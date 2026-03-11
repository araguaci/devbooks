#!/usr/bin/env node
/**
 * Gera ícones PNG para PWA a partir do icon.svg
 * Uso: node scripts/generate-icons.js
 */
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const iconsDir = join(publicDir, 'icons');

const sizes = [32, 72, 96, 128, 144, 152, 192, 384, 512];
const ogSize = { w: 1200, h: 630 }; // Open Graph recomendado
const svgPath = join(publicDir, 'icon.svg');

async function generate() {
  if (!existsSync(svgPath)) {
    console.error('Arquivo icon.svg não encontrado em public/');
    process.exit(1);
  }

  mkdirSync(iconsDir, { recursive: true });

  const svgBuffer = readFileSync(svgPath);

  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Gerado: icons/icon-${size}x${size}.png`);
  }

  // Open Graph / Twitter Card (1200x630) - ícone centralizado em fundo gradiente
  const icon512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  const ogPath = join(publicDir, 'og-image.png');
  const gradientSvg = `
    <svg width="${ogSize.w}" height="${ogSize.h}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00d9ff"/>
          <stop offset="100%" stop-color="#ff6b35"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>
  `;
  await sharp(Buffer.from(gradientSvg))
    .resize(ogSize.w, ogSize.h)
    .composite([{
      input: icon512,
      top: Math.round((ogSize.h - 512) / 2),
      left: Math.round((ogSize.w - 512) / 2),
    }])
    .png()
    .toFile(ogPath);
  console.log('Gerado: og-image.png (1200x630)');

  // Favicon (32x32) - cópia como favicon.png para fallback
  const faviconPath = join(publicDir, 'favicon.png');
  await sharp(svgBuffer).resize(32, 32).png().toFile(faviconPath);
  console.log('Gerado: favicon.png');

  console.log('Ícones gerados com sucesso.');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
