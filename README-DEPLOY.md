# DevBooks — Deploy

**Produção:** https://edevbooks.netlify.app

## Estrutura do projeto

```
BibliotecaDev/
├── client/              # React + Vite (frontend)
├── server/               # Express + SQLite/Turso (API)
├── netlify/functions/    # Netlify Function (API)
├── server.js             # Entry point Vercel (legado)
├── netlify.toml          # Config Netlify
├── vercel.json           # Config Vercel (legado)
└── package.json
```

## Desenvolvimento

```bash
# Instalar dependências
npm install && cd client && npm install && cd ../server && npm install

# Seed (opcional)
npm run seed

# Subir cliente e servidor
npm run dev
```

Acesse http://localhost:5173. O frontend faz proxy de `/api` para o backend (porta 3001).

## Deploy

**Convencional (Railway, Render, VPS):** [docs/DEPLOY-CONVENCIONAL.md](docs/DEPLOY-CONVENCIONAL.md) — sem serverless, Node roda como processo normal.

**Netlify (serverless):** [docs/NETLIFY.md](docs/NETLIFY.md)

**Vercel (legado):** [docs/VERCEL-SETUP.md](docs/VERCEL-SETUP.md) para:
- Excluir projeto e criar novamente
- **Build Command**, **Output Directory**, **Install Command**
- Variáveis de ambiente

```bash
npm run deploy
```

**Variáveis de ambiente** na Vercel (Settings → Environment Variables):
- `TURSO_DATABASE_URL` — [docs/TURSO.md](docs/TURSO.md)
- `TURSO_AUTH_TOKEN` — [docs/TURSO.md](docs/TURSO.md)
- `JWT_SECRET` — Segredo para JWT
- `GITHUB_RAW_BASE` — (opcional) Base para PDFs
