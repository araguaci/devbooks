# DevBooks — Estrutura para Vercel

## Estrutura do projeto

```
BibliotecaDev/
├── client/          # React + Vite (frontend)
├── server/          # Express + SQLite/Turso (API)
├── api/             # (legado, não usado)
├── server.js        # Entry point Vercel — SPA + API
├── vercel.json
├── package.json
└── docs/
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

## Deploy (Vercel)

```bash
npm run deploy
```

**Variáveis de ambiente** na Vercel (Settings → Environment Variables):
- `TURSO_DATABASE_URL` — [docs/TURSO.md](docs/TURSO.md)
- `TURSO_AUTH_TOKEN` — [docs/TURSO.md](docs/TURSO.md)
- `JWT_SECRET` — Segredo para JWT
- `GITHUB_RAW_BASE` — (opcional) Base para PDFs
