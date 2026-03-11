/**
 * DB layer: better-sqlite3 (local) ou @libsql/client (Turso/Vercel)
 * Usa TURSO_DATABASE_URL + TURSO_AUTH_TOKEN para Turso
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const useTurso = !!process.env.TURSO_DATABASE_URL;

let _db = null;

async function getDb() {
  if (_db) return _db;

  if (useTurso) {
    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    _db = {
      async run(sql, ...args) {
        const r = await client.execute({ sql, args: args.length ? args : undefined });
        return { lastInsertRowid: r.lastInsertRowid ?? (r.meta?.last_insert_rowid) };
      },
      async get(sql, ...args) {
        const r = await client.execute({ sql, args: args.length ? args : undefined });
        const row = r.rows?.[0];
        if (!row) return undefined;
        if (Array.isArray(row)) {
          const cols = r.columns || [];
          return Object.fromEntries(cols.map((c, i) => [c, row[i]]));
        }
        return row;
      },
      async all(sql, ...args) {
        const r = await client.execute({ sql, args: args.length ? args : undefined });
        const cols = r.columns || [];
        return (r.rows || []).map((row) =>
          Array.isArray(row) ? Object.fromEntries(cols.map((c, i) => [c, row[i]])) : row
        );
      },
      async transaction(fn) {
        const tx = client.transaction('write');
        try {
          const txDb = {
            async run(sql, ...args) {
              await tx.execute({ sql, args: args.length ? args : undefined });
              return {};
            },
            async get(sql, ...args) {
              const r = await tx.execute({ sql, args: args.length ? args : undefined });
              const row = r.rows?.[0];
              if (!row) return undefined;
              const cols = r.columns || [];
              return Array.isArray(row) ? Object.fromEntries(cols.map((c, i) => [c, row[i]])) : row;
            },
            async all(sql, ...args) {
              const r = await tx.execute({ sql, args: args.length ? args : undefined });
              const cols = r.columns || [];
              return (r.rows || []).map((row) =>
                Array.isArray(row) ? Object.fromEntries(cols.map((c, i) => [c, row[i]])) : row
              );
            },
          };
          const result = await fn(txDb);
          await tx.commit();
          return result;
        } finally {
          tx.close();
        }
      },
    };
  } else {
    const Database = (await import('better-sqlite3')).default;
    const dbPath = process.env.DATABASE_PATH || join(__dirname, 'data', 'biblioteca.db');
    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    sqlite.exec(SCHEMA);

    _db = {
      async run(sql, ...args) {
        const r = sqlite.prepare(sql).run(...args);
        return { lastInsertRowid: r.lastInsertRowid };
      },
      async get(sql, ...args) {
        return sqlite.prepare(sql).get(...args);
      },
      async all(sql, ...args) {
        return sqlite.prepare(sql).all(...args);
      },
      async transaction(fn) {
        const txDb = {
          run: (s, ...a) => Promise.resolve(sqlite.prepare(s).run(...a)),
          get: (s, ...a) => Promise.resolve(sqlite.prepare(s).get(...a)),
          all: (s, ...a) => Promise.resolve(sqlite.prepare(s).all(...a)),
        };
        sqlite.prepare('BEGIN').run();
        try {
          const result = await fn(txDb);
          sqlite.prepare('COMMIT').run();
          return result;
        } catch (e) {
          sqlite.prepare('ROLLBACK').run();
          throw e;
        }
      },
    };
  }

  if (useTurso) await initSchemaTurso(_db);
  return _db;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    xp_value INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_progress (
    user_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (book_id) REFERENCES books(id)
  );
  CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY,
    total_xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity_at DATE,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS badges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    condition_type TEXT,
    condition_value INTEGER
  );
  CREATE TABLE IF NOT EXISTS user_badges (
    user_id INTEGER NOT NULL,
    badge_id INTEGER NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, badge_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (badge_id) REFERENCES badges(id)
  );
  CREATE TABLE IF NOT EXISTS weekly_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start DATE NOT NULL,
    description TEXT NOT NULL,
    target_books INTEGER NOT NULL,
    xp_bonus INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_challenge_progress (
    user_id INTEGER NOT NULL,
    challenge_id INTEGER NOT NULL,
    books_completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    PRIMARY KEY (user_id, challenge_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (challenge_id) REFERENCES weekly_challenges(id)
  );
  CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
  CREATE INDEX IF NOT EXISTS idx_progress_book ON user_progress(book_id);
`;

async function initSchemaTurso(db) {
  for (const stmt of SCHEMA.split(';').filter((s) => s.trim())) {
    try {
      await db.run(stmt + ';');
    } catch (e) {
      if (!e.message?.includes('already exists')) throw e;
    }
  }
}

export { getDb };
