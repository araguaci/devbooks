/**
 * Entry point para Vercel — Express na raiz (padrão Vercel)
 * SPA + API em um único handler
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './server/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, 'client/dist');

// SPA: arquivos estáticos e fallback para index.html (após rotas /api)
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

export default app;
