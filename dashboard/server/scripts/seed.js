import { getDb } from '../db.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const books = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'books.json'), 'utf8'));

const XP = { P0: 100, P1: 80, P2: 60, P3: 40 };

async function seed() {
  const db = await getDb();

  for (const b of books) {
    await db.run(
      'INSERT OR IGNORE INTO books (slug, title, category, priority, xp_value) VALUES (?, ?, ?, ?, ?)',
      b.slug, b.title, b.category, b.priority, XP[b.priority] || 40
    );
  }
  console.log(`Seeded ${books.length} books`);

  const badges = [
    { slug: 'primeiro-passo', name: 'Primeiro Passo', description: 'Marcou o primeiro livro', condition_type: 'books', condition_value: 1 },
    { slug: 'p0-completo', name: 'P0 Completo', description: 'Completou todos os 5 livros essenciais', condition_type: 'p0_complete', condition_value: 1 },
    { slug: 'leitor-semanal', name: 'Leitor Semanal', description: '7 dias de streak', condition_type: 'streak', condition_value: 7 },
    { slug: 'dez-livros', name: '10 Livros', description: 'Completou 10 livros', condition_type: 'books', condition_value: 10 },
    { slug: 'vinte-cinco-livros', name: '25 Livros', description: 'Completou 25 livros', condition_type: 'books', condition_value: 25 },
    { slug: 'categoria-mestre', name: 'Mestre da Categoria', description: '100% em uma categoria', condition_type: 'category_complete', condition_value: 1 },
    { slug: 'desafio-semanal', name: 'Desafio Semanal', description: 'Completou o desafio da semana', condition_type: 'weekly_challenge', condition_value: 1 },
  ];

  for (const b of badges) {
    await db.run(
      'INSERT OR IGNORE INTO badges (slug, name, description, condition_type, condition_value) VALUES (?, ?, ?, ?, ?)',
      b.slug, b.name, b.description, b.condition_type, b.condition_value
    );
  }
  console.log(`Seeded ${badges.length} badges`);
}

seed().catch(console.error);
