import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rankingPath = join(__dirname, 'data', 'ranking.json');
const linksPath = join(__dirname, 'data', 'links.json');
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

function getBookUrl(slug, links) {
  if (links[slug]) return links[slug];
  const base = process.env.GITHUB_RAW_BASE || '';
  if (!base) return null;
  return `${base.replace(/\/$/, '')}/LivrosDev/${slug}.pdf`;
}

function enrichBook(book) {
  const r = getRanking();
  const links = getLinks();
  const meta = r.books[book.slug] || {};
  const url = meta.url || getBookUrl(book.slug, links);
  return {
    ...book,
    rank: meta.rank ?? 999,
    topic: meta.topic || book.category,
    tags: meta.tags || [book.category],
    motivo: meta.motivo || null,
    url: url || null,
  };
}

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

app.use(cors({ origin: true }));
app.use(express.json());

// --- Auth middleware ---
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

// --- XP thresholds for levels ---
const XP_LEVELS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000, 15000];
function levelFromXP(xp) {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i]) return i + 1;
  }
  return 1;
}

// --- Streak bonus ---
const STREAK_BONUS_PER_DAY = 5;
const STREAK_BONUS_MAX = 30;

// --- Auth routes ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email e senha obrigatórios' });
  const hash = await bcrypt.hash(password, 10);
  try {
    const r = db.prepare('INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)').run(
      email.toLowerCase().trim(),
      hash,
      displayName?.trim() || null
    );
    const user = db.prepare('SELECT id, email, display_name, created_at FROM users WHERE id = ?').get(r.lastInsertRowid);
    db.prepare('INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)').run(user.id);
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
  const user = db.prepare('SELECT id, email, password_hash, display_name FROM users WHERE email = ?').get(
    email.toLowerCase().trim()
  );
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Credenciais inválidas' });
  delete user.password_hash;
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user, token });
});

app.get('/api/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, display_name, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

// --- Ranking legend ---
app.get('/api/ranking/legend', (req, res) => {
  res.json(getRanking().legend || {});
});

// --- Books ---
app.get('/api/books', (req, res) => {
  const books = db.prepare('SELECT id, slug, title, category, priority, xp_value FROM books ORDER BY priority, title').all();
  const enriched = books.map(enrichBook).sort((a, b) => a.rank - b.rank);
  res.json(enriched);
});

app.get('/api/books/:slug', (req, res) => {
  const book = db.prepare('SELECT id, slug, title, category, priority, xp_value FROM books WHERE slug = ?').get(
    req.params.slug
  );
  if (!book) return res.status(404).json({ error: 'Livro não encontrado' });
  res.json(enrichBook(book));
});

// --- Progress ---
app.post('/api/progress/toggle/:bookId', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const bookId = parseInt(req.params.bookId, 10);
  if (isNaN(bookId)) return res.status(400).json({ error: 'ID inválido' });

  const book = db.prepare('SELECT id, xp_value, priority FROM books WHERE id = ?').get(bookId);
  if (!book) return res.status(404).json({ error: 'Livro não encontrado' });

  const existing = db.prepare('SELECT 1 FROM user_progress WHERE user_id = ? AND book_id = ?').get(userId, bookId);

  db.transaction(() => {
    if (existing) {
      db.prepare('DELETE FROM user_progress WHERE user_id = ? AND book_id = ?').run(userId, bookId);
      const stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);
      const newXP = Math.max(0, (stats?.total_xp || 0) - book.xp_value);
      db.prepare('UPDATE user_stats SET total_xp = ?, level = ? WHERE user_id = ?').run(
        newXP,
        levelFromXP(newXP),
        userId
      );
      return res.json({ completed: false, xp: 0 });
    }

    const now = new Date();
    const today = now.toLocaleDateString('en-CA');
    let xp = book.xp_value;
    const stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId) || {
      total_xp: 0,
      current_streak: 0,
      longest_streak: 0,
      last_activity_at: null,
    };

    let newStreak = stats.current_streak || 0;
    const last = stats.last_activity_at;
    if (last) {
      const lastDate = new Date(last);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate - lastDate) / 86400000);
      if (diffDays === 0) newStreak = stats.current_streak;
      else if (diffDays === 1) newStreak = (stats.current_streak || 0) + 1;
      else newStreak = 1;
    } else newStreak = 1;

    const streakBonus = Math.min(newStreak * STREAK_BONUS_PER_DAY, STREAK_BONUS_MAX);
    xp += streakBonus;

    const longest = Math.max(stats.longest_streak || 0, newStreak);
    const newXP = (stats.total_xp || 0) + xp;

    db.prepare(
      'INSERT INTO user_progress (user_id, book_id) VALUES (?, ?)'
    ).run(userId, bookId);
    db.prepare(
      'INSERT INTO user_stats (user_id, total_xp, level, current_streak, longest_streak, last_activity_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET total_xp = excluded.total_xp, level = excluded.level, current_streak = excluded.current_streak, longest_streak = excluded.longest_streak, last_activity_at = excluded.last_activity_at'
    ).run(userId, newXP, levelFromXP(newXP), newStreak, longest, today);

    // Check badges
    const completedCount = db.prepare('SELECT COUNT(*) as c FROM user_progress WHERE user_id = ?').get(userId).c;
    const p0Count = db
      .prepare(
        'SELECT COUNT(*) as c FROM user_progress up JOIN books b ON up.book_id = b.id WHERE up.user_id = ? AND b.priority = ?'
      )
      .get(userId, 'P0').c;

    const badgesToCheck = db.prepare(
      'SELECT * FROM badges WHERE (condition_type = ? AND condition_value <= ?) OR (condition_type = ? AND condition_value <= ?)'
    ).all('books', completedCount, 'p0_complete', p0Count >= 5 ? 1 : 0);

    for (const b of badgesToCheck) {
      if (b.condition_type === 'books' && completedCount >= b.condition_value) {
        db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(userId, b.id);
      }
      if (b.condition_type === 'p0_complete' && p0Count >= 5) {
        db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(userId, b.id);
      }
    }

    if (newStreak >= 7) {
      const badge = db.prepare('SELECT id FROM badges WHERE condition_type = ? AND condition_value <= ?').get(
        'streak',
        7
      );
      if (badge) db.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES (?, ?)').run(userId, badge.id);
    }

    res.json({ completed: true, xp, streak: newStreak, streakBonus });
  })();
});

app.get('/api/progress', authMiddleware, (req, res) => {
  const rows = db
    .prepare(
      'SELECT up.book_id, up.completed_at, b.slug, b.title, b.category, b.priority FROM user_progress up JOIN books b ON up.book_id = b.id WHERE up.user_id = ? ORDER BY up.completed_at DESC'
    )
    .all(req.user.id);
  res.json(rows);
});

// --- Stats ---
app.get('/api/stats', authMiddleware, (req, res) => {
  const stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(req.user.id);
  const completedCount = db.prepare('SELECT COUNT(*) as c FROM user_progress WHERE user_id = ?').get(req.user.id).c;
  const badges = db
    .prepare(
      'SELECT b.slug, b.name, b.description, ub.earned_at FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = ?'
    )
    .all(req.user.id);

  const level = stats ? levelFromXP(stats.total_xp) : 1;
  const xpForNext = XP_LEVELS[level] || XP_LEVELS[XP_LEVELS.length - 1];
  const xpInLevel = stats ? stats.total_xp - (XP_LEVELS[level - 1] || 0) : 0;
  const xpNeeded = xpForNext - (XP_LEVELS[level - 1] || 0);

  res.json({
    total_xp: stats?.total_xp || 0,
    level,
    current_streak: stats?.current_streak || 0,
    longest_streak: stats?.longest_streak || 0,
    last_activity_at: stats?.last_activity_at,
    books_completed: completedCount,
    badges,
    progress: { xpInLevel, xpNeeded, xpForNext },
  });
});

// --- Leaderboard ---
app.get('/api/leaderboard', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const rows = db
    .prepare(
      `SELECT u.id, u.display_name, u.email, us.total_xp, us.level, us.current_streak
       FROM users u
       JOIN user_stats us ON u.id = us.user_id
       ORDER BY us.total_xp DESC
       LIMIT ?`
    )
    .all(limit);
  res.json(rows);
});

// --- Badges ---
app.get('/api/badges', (req, res) => {
  const badges = db.prepare('SELECT id, slug, name, description, condition_type, condition_value FROM badges').all();
  res.json(badges);
});

// --- Challenges ---
function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

app.get('/api/challenges/current', authMiddleware, (req, res) => {
  const weekStart = getWeekStart();
  let challenge = db.prepare('SELECT * FROM weekly_challenges WHERE week_start = ?').get(weekStart);

  if (!challenge) {
    const descriptions = [
      'Leia 3 livros esta semana',
      'Leia 2 livros P0 ou P1',
      'Leia 1 livro P0',
    ];
    const targets = [3, 2, 1];
    const idx = new Date(weekStart).getTime() % 3;
    db.prepare(
      'INSERT INTO weekly_challenges (week_start, description, target_books, xp_bonus) VALUES (?, ?, ?, ?)'
    ).run(weekStart, descriptions[idx], targets[idx], 50);
    challenge = db.prepare('SELECT * FROM weekly_challenges WHERE week_start = ?').get(weekStart);
  }

  const progress = db
    .prepare(
      'SELECT books_completed, completed_at FROM user_challenge_progress WHERE user_id = ? AND challenge_id = ?'
    )
    .get(req.user.id, challenge.id);

  const completedThisWeek = db
    .prepare(
      `SELECT COUNT(*) as c FROM user_progress up
       JOIN books b ON up.book_id = b.id
       WHERE up.user_id = ? AND date(up.completed_at) >= ?`
    )
    .get(req.user.id, weekStart).c;

  if (!progress) {
    db.prepare(
      'INSERT INTO user_challenge_progress (user_id, challenge_id, books_completed) VALUES (?, ?, ?)'
    ).run(req.user.id, challenge.id, completedThisWeek);
  } else {
    db.prepare(
      'UPDATE user_challenge_progress SET books_completed = ? WHERE user_id = ? AND challenge_id = ?'
    ).run(completedThisWeek, req.user.id, challenge.id);
  }

  const updated = db
    .prepare('SELECT books_completed, completed_at FROM user_challenge_progress WHERE user_id = ? AND challenge_id = ?')
    .get(req.user.id, challenge.id);

  const done = updated.books_completed >= challenge.target_books;
  if (done && !updated.completed_at) {
    db.prepare(
      'UPDATE user_challenge_progress SET completed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND challenge_id = ?'
    ).run(req.user.id, challenge.id);
    db.prepare('UPDATE user_stats SET total_xp = total_xp + ? WHERE user_id = ?').run(challenge.xp_bonus, req.user.id);
  }

  res.json({
    ...challenge,
    books_completed: updated.books_completed,
    completed: done,
  });
});

// --- Health ---
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
