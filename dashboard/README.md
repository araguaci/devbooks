# DevBooks Dashboard

Dashboard gamificado para acompanhar progresso de leitura do DevBooks.

## Stack

- **Frontend:** React 18 + Vite (porta 5173)
- **Backend:** Node.js + Express (porta 3001)
- **DB:** SQLite (local) / Turso (produção)

## Desenvolvimento

```bash
# Instalar dependências (uma vez)
cd dashboard && npm install && npm run setup

# Subir cliente e servidor
npm run dev
```

**Portas em uso?** Rode `npm run dev:fresh` para liberar 3001 e 5173 e subir novamente.

Acesse http://localhost:5173. O frontend faz proxy de `/api` para o backend.

## Deploy (Vercel)

1. **Variáveis de ambiente** na Vercel (Settings → Environment Variables):
   - `TURSO_DATABASE_URL` — URL do banco Turso ([como obter](../docs/TURSO.md))
   - `TURSO_AUTH_TOKEN` — Token do Turso ([como obter](../docs/TURSO.md))
   - `JWT_SECRET` — Segredo para JWT
   - `GITHUB_RAW_BASE` — (opcional) Base para PDFs

2. **Deploy:**
   ```bash
   npm run deploy
   ```

3. **Seed no Turso** (após deploy):
   ```bash
   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run seed
   ```

## Estrutura

```
dashboard/
├── client/     # React + Vite
├── server/     # Express + SQLite/Turso
└── README.md
```
