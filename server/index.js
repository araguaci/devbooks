import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db.js';

const isServerless = !!(process.env.VERCEL || process.env.NETLIFY);

function getDataDir() {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return join(dirname(fileURLToPath(import.meta.url)), 'data');
    }
  } catch {}
  return join(process.cwd(), 'server', 'data');
}
const rankingPath = join(getDataDir(), 'ranking.json');
const linksPath = join(getDataDir(), 'links.json');
let rankingData = null;

function getRanking() {
  if (!rankingData) {
    try {
      rankingData = JSON.parse(readFileSync(rankingPath, 'utf8'));
    } catch {
      rankingData = { legend: {}, books: {} };
    }
  }
  return rankingData;
}

function getLinks() {
  try {
    const raw = JSON.parse(readFileSync(linksPath, 'utf8'));
    return Object.fromEntries(
      Object.entries(raw).filter(([k, v]) => !k.startsWith('_') && typeof v === 'string' && v.trim())
    );
  } catch {
    return {};
  }
}

function getRawUrl(slug, links) {
  if (links[slug]) return links[slug];
  const base = process.env.GITHUB_RAW_BASE || '';
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/LivrosDev/${slug}.pdf`;
}

function enrichBook(book) {
  const r = getRanking();
  const links = getLinks();
  const meta = r.books[book.slug] || {};
  const rawUrl = meta.url || getRawUrl(book.slug, links);
  return {
    ...book,
    rank: meta.rank ?? 999,
    topic: meta.topic || book.category,
    tags: meta.tags || [book.category],
    motivo: meta.motivo || null,
    url: rawUrl ? `/api/pdf/${encodeURIComponent(book.slug)}` : null,
  };
}

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

app.use(cors({ origin: true }));
app.use(express.json());

// Health check sem DB — para validar que a função Netlify/Vercel está rodando
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(async (req, res, next) => {
  try {
    req.db = await getDb();
    next();
  } catch (e) {
    console.error('[DB]', e.message);
    res.status(503).json({
      error: process.env.NETLIFY || process.env.VERCEL
        ? 'Banco de dados não configurado. Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN nas variáveis de ambiente.'
        : e.message,
    });
  }
});

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token ausente' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

const XP_LEVELS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];
function levelFromXP(xp) {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i]) return i + 1;
  }
  return 1;
}

const STREAK_BONUS_PER_DAY = 5;
const STREAK_BONUS_MAX = 30;

app.post('/api/auth/register', async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await req.db.get(
      'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?) RETURNING id, email, display_name, created_at',
      email.toLowerCase().trim(), hash, displayName?.trim() || null
    );
    await req.db.run('INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)', user.id);
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Email já cadastrado' });
    throw e;
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });
  const user = await req.db.get('SELECT id, email, password_hash, display_name FROM users WHERE email = ?',
    email.toLowerCase().trim());
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  if (user.google_id) return res.status(401).json({ error: 'Use o login com Google para esta conta' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
  delete user.password_hash;
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user, token });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Token Google ausente' });
  if (!GOOGLE_CLIENT_ID) return res.status(503).json({ error: 'Login com Google não configurado' });

  try {
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    if (!email) return res.status(400).json({ error: 'Email não fornecido pelo Google' });

    const emailLower = email.toLowerCase().trim();
    let user = await req.db.get(
      'SELECT id, email, display_name, created_at, google_id FROM users WHERE google_id = ? OR email = ?',
      googleId, emailLower
    );

    if (!user) {
      const placeholderHash = await bcrypt.hash('google_oauth_' + googleId, 10);
      const result = await req.db.get(
        'INSERT INTO users (email, password_hash, display_name, google_id) VALUES (?, ?, ?, ?) RETURNING id, email, display_name, created_at',
        emailLower, placeholderHash, (name || '').trim() || null, googleId
      );
      user = result;
      await req.db.run('INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)', user.id);
    } else if (!user.google_id) {
      await req.db.run('UPDATE users SET google_id = ? WHERE id = ?', googleId, user.id);
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      user: { id: user.id, email: user.email, display_name: user.display_name, created_at: user.created_at },
      token,
    });
  } catch (e) {
    console.error('[Google Auth]', e.message);
    res.status(401).json({ error: 'Token Google inválido' });
  }
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const user = await req.db.get('SELECT id, email, display_name, created_at FROM users WHERE id = ?', req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

app.get('/api/pdf/:slug', async (req, res) => {
  const slug = decodeURIComponent(req.params.slug);
  const rawUrl = getRawUrl(slug, getLinks());
  if (!rawUrl) return res.status(404).json({ error: 'Livro não encontrado' });
  try {
    const resp = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'DevBooks/1.0 (https://devbooks.artesdosul.com)',
        'Accept': 'application/pdf,application/octet-stream,*/*',
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!resp.ok) {
      console.error('[PDF] fetch failed:', resp.status, rawUrl);
      return res.status(502).json({ error: 'Erro ao buscar PDF' });
    }
    const buffer = Buffer.from(await resp.arrayBuffer());
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'inline' });
    res.send(buffer);
  } catch (e) {
    console.error('[PDF]', slug, e.message);
    res.status(502).json({ error: 'Erro ao buscar PDF' });
  }
});

app.get('/api/ranking/legend', (req, res) => {
  res.json(getRanking().legend || {});
});

app.get('/api/books', async (req, res) => {
  const books = await req.db.all('SELECT id, slug, title, category, priority, xp_value FROM books ORDER BY priority, title');
  const enriched = books.map(enrichBook).sort((a, b) => a.rank - b.rank);
  res.json(enriched);
});

app.get('/api/books/:slug', async (req, res) => {
  const book = await req.db.get('SELECT id, slug, title, category, priority, xp_value FROM books WHERE slug = ?', req.params.slug);
  if (!book) return res.status(404).json({ error: 'Livro não encontrado' });
  res.json(enrichBook(book));
});

app.post('/api/progress/toggle/:bookId', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const bookId = parseInt(req.params.bookId, 10);
  if (isNaN(bookId)) return res.status(400).json({ error: 'ID inválido' });

  const book = await req.db.get('SELECT id, xp_value, priority FROM books WHERE id = ?', bookId);
  if (!book) return res.status(404).json({ error: 'Livro não encontrado' });

  const existing = await req.db.get('SELECT 1 FROM user_progress WHERE user_id = ? AND book_id = ?', userId, bookId);

  const result = await req.db.transaction(async (tx) => {
    if (existing) {
      await tx.run('DELETE FROM user_progress WHERE user_id = ? AND book_id = ?', userId, bookId);
      const stats = await tx.get('SELECT * FROM user_stats WHERE user_id = ?', userId);
      const newXP = Math.max(0, (stats?.total_xp || 0) - book.xp_value);
      await tx.run('UPDATE user_stats SET total_xp = ?, level = ? WHERE user_id = ?', newXP, levelFromXP(newXP), userId);
      return { completed: false, xp: 0 };
    }

    const today = new Date().toLocaleDateString('en-CA');
    let xp = book.xp_value;
    const stats = await tx.get('SELECT * FROM user_stats WHERE user_id = ?', userId) || {
      total_xp: 0, current_streak: 0, longest_streak: 0, last_activity_at: null,
    };

    let newStreak = stats.current_streak || 0;
    const last = stats.last_activity_at;
    if (last) {
      const diffDays = Math.floor((new Date(today) - new Date(last)) / 86400000);
      newStreak = diffDays === 0 ? stats.current_streak : diffDays === 1 ? (stats.current_streak || 0) + 1 : 1;
    } else newStreak = 1;

    xp += Math.min(newStreak * STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX);
    const longest = Math.max(stats.longest_streak || 0, newStreak);
    const newXP = (stats.total_xp || 0) + xp;

    await tx.run('INSERT INTO user_progress (user_id, book_id) VALUES (?, ?)', userId, bookId);
    await tx.run(
      'INSERT INTO user_stats (user_id, total_xp, level, current_streak, longest_streak, last_activity_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET total_xp = excluded.total_xp, level = excluded.level, current_streak = excluded.current_streak, longest_streak = excluded.longest_streak, last_activity_at = excluded.last_activity_at',
      userId, newXP, levelFromXP(newXP), newStreak, longest, today
    );

    const completedCount = (await tx.all('SELECT COUNT(*) as c FROM user_progress WHERE user_id = ?', userId))[0]?.c ?? 0;
    const p0Count = (await tx.all('SELECT COUNT(*) as c FROM user_progress up JOIN books b ON up.book_id = b.id WHERE up.user_id = ? AND b.priority = ?', userId, 'P0'))[0]?.c ?? 0;
    const badgesToCheck = await tx.all(
      'SELECT * FROM badges WHERE (condition_type = ? AND condition_value <= ?) OR (condition_type = ? AND condition_value <= ?)',
      'books', completedCount, 'p0_complete', p0Count >= 5 ? 1 : 0
    );

    for (const b of badgesToCheck) {
      if ((b.condition_type === 'books' && completedCount >= b.condition_value) || (b.condition_type === 'p0_complete' && p0Count >= 5)) {
        await tx.run('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', userId, b.id);
      }
    }
    if (newStreak >= 7) {
      const badge = await tx.get('SELECT id FROM badges WHERE condition_type = ? AND condition_value <= ?', 'streak', 7);
      if (badge) await tx.run('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)', userId, badge.id);
    }

    return { completed: true, xp, streak: newStreak, streakBonus: Math.min(newStreak * STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX) };
  });

  res.json(result);
});

app.get('/api/progress', authMiddleware, async (req, res) => {
  const rows = await req.db.all(
    'SELECT up.book_id, up.completed_at, b.slug, b.title, b.category, b.priority FROM user_progress up JOIN books b ON up.book_id = b.id WHERE up.user_id = ? ORDER BY up.completed_at DESC',
    req.user.id
  );
  res.json(rows);
});

app.get('/api/stats', authMiddleware, async (req, res) => {
  const stats = await req.db.get('SELECT * FROM user_stats WHERE user_id = ?', req.user.id);
  const completedCount = (await req.db.all('SELECT COUNT(*) as c FROM user_progress WHERE user_id = ?', req.user.id))[0]?.c ?? 0;
  const badges = await req.db.all(
    'SELECT b.slug, b.name, b.description, ub.earned_at FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = ?',
    req.user.id
  );

  const level = stats ? levelFromXP(stats.total_xp) : 1;
  const xpForNext = XP_LEVELS[level] || XP_LEVELS[XP_LEVELS.length - 1];
  const xpInLevel = stats ? stats.total_xp - (XP_LEVELS[level - 1] || 0) : 0;
  const xpNeeded = xpForNext - (XP_LEVELS[level - 1] || 0);

  res.json({
    total_xp: stats?.total_xp || 0, level, current_streak: stats?.current_streak || 0,
    longest_streak: stats?.longest_streak || 0, last_activity_at: stats?.last_activity_at,
    books_completed: completedCount, badges, progress: { xpInLevel, xpNeeded, xpForNext },
  });
});

app.get('/api/leaderboard', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const rows = await req.db.all(
    'SELECT u.id, u.display_name, u.email, us.total_xp, us.level, us.current_streak FROM users u JOIN user_stats us ON u.id = us.user_id ORDER BY us.total_xp DESC LIMIT ?',
    limit
  );
  res.json(rows);
});

app.get('/api/badges', async (req, res) => {
  const badges = await req.db.all('SELECT id, slug, name, description, condition_type, condition_value FROM badges');
  res.json(badges);
});

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

app.get('/api/challenges/current', authMiddleware, async (req, res) => {
  const weekStart = getWeekStart();
  let challenge = await req.db.get('SELECT * FROM weekly_challenges WHERE week_start = ?', weekStart);

  if (!challenge) {
    const descriptions = ['Leia 3 livros esta semana', 'Leia 2 livros P0 ou P1', 'Leia 1 livro P0'];
    const targets = [3, 2, 1];
    const idx = new Date(weekStart).getTime() % 3;
    await req.db.run('INSERT INTO weekly_challenges (week_start, description, target_books, xp_bonus) VALUES (?, ?, ?, ?)', weekStart, descriptions[idx], targets[idx], 50);
    challenge = await req.db.get('SELECT * FROM weekly_challenges WHERE week_start = ?', weekStart);
  }

  const completedThisWeek = (await req.db.all(
    'SELECT COUNT(*) as c FROM user_progress up JOIN books b ON up.book_id = b.id WHERE up.user_id = ? AND date(up.completed_at) >= ?',
    req.user.id, weekStart
  ))[0]?.c ?? 0;

  const progress = await req.db.get('SELECT books_completed, completed_at FROM user_challenge_progress WHERE user_id = ? AND challenge_id = ?', req.user.id, challenge.id);
  if (!progress) {
    await req.db.run('INSERT INTO user_challenge_progress (user_id, challenge_id, books_completed) VALUES (?, ?, ?)', req.user.id, challenge.id, completedThisWeek);
  } else {
    await req.db.run('UPDATE user_challenge_progress SET books_completed = ? WHERE user_id = ? AND challenge_id = ?', completedThisWeek, req.user.id, challenge.id);
  }

  const updated = await req.db.get('SELECT books_completed, completed_at FROM user_challenge_progress WHERE user_id = ? AND challenge_id = ?', req.user.id, challenge.id);
  const done = updated.books_completed >= challenge.target_books;

  if (done && !updated.completed_at) {
    await req.db.run('UPDATE user_challenge_progress SET completed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND challenge_id = ?', req.user.id, challenge.id);
    await req.db.run('UPDATE user_stats SET total_xp = total_xp + ? WHERE user_id = ?', challenge.xp_bonus, req.user.id);
  }

  res.json({ ...challenge, books_completed: updated.books_completed, completed: done });
});

// Deploy convencional: servir SPA + fallback
if (!isServerless) {
  const distPath = join(process.cwd(), 'client', 'dist');
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(join(distPath, 'index.html'));
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    });
  }
}

const PORT = process.env.PORT || 3001;
if (!isServerless) {
  app.listen(PORT, () => console.log(`DevBooks rodando em http://localhost:${PORT}`));
}

export default app;
