/**
 * Valida se os links em links.json retornam 200
 * Uso: node scripts/validate-links.js
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const linksPath = join(__dirname, '..', 'data', 'links.json');

const links = JSON.parse(readFileSync(linksPath, 'utf8'));
const entries = Object.entries(links).filter(([k, v]) => !k.startsWith('_') && typeof v === 'string');

let ok = 0;
let fail = 0;
const failed = [];

for (const [slug, url] of entries) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DevBooks-validate-links/1.0' },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      ok++;
      process.stdout.write('.');
    } else {
      fail++;
      failed.push({ slug, url, status: res.status });
      process.stdout.write('x');
    }
  } catch (err) {
    fail++;
    failed.push({ slug, url, error: err.message });
    process.stdout.write('x');
  }
}

console.log('\n');
console.log(`OK: ${ok} | Falhas: ${fail} | Total: ${entries.length}`);

if (failed.length > 0) {
  console.log('\nLinks com falha:');
  failed.forEach(({ slug, url, status, error }) => {
    console.log(`  - ${slug}`);
    console.log(`    ${url}`);
    console.log(`    ${status ? `Status: ${status}` : `Erro: ${error}`}`);
  });
  process.exit(1);
}
