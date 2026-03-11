/**
 * Gera links.json com URLs raw do GitHub para todos os livros em books.json
 * Uso: node scripts/generate-links.js
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://raw.githubusercontent.com/araguaci/devbooks/main';

const books = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'books.json'), 'utf8'));
const links = {};
for (const b of books) {
  links[b.slug] = `${BASE}/LivrosDev/${b.slug}.pdf`;
}
writeFileSync(join(__dirname, '..', 'data', 'links.json'), JSON.stringify(links, null, 2));
console.log(`Gerados ${Object.keys(links).length} links em links.json`);
