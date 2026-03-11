# Deploy DevBooks na Netlify

**URL:** https://edevbooks.netlify.app

## Configuração

O projeto usa `netlify.toml` na raiz:

| Config | Valor |
|--------|-------|
| **Build Command** | `npm run build` |
| **Publish Directory** | `client/dist` |
| **Functions Directory** | `netlify/functions` |

## Variáveis de ambiente

Em **Site settings** → **Environment variables**:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `TURSO_DATABASE_URL` | `libsql://devbooks-xxx.turso.io` | All |
| `TURSO_AUTH_TOKEN` | *(token do Turso)* | All |
| `JWT_SECRET` | *(string aleatória segura)* | All |
| `GITHUB_RAW_BASE` | `https://raw.githubusercontent.com/araguaci/devbooks/main` | All |
| *(opcional)* | | |

Ver [TURSO.md](TURSO.md) para obter `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`.

**Importante:** Sem essas variáveis, a API retorna 502/503. Configure antes do deploy.

## Deploy

```bash
npm run build
netlify deploy --prod
```

Ou conecte o repositório Git para deploy automático.

## Estrutura

- **Static:** `client/dist` (React/Vite)
- **API:** `netlify/functions/server.js` (Express via serverless-http)
- **Redirects:** `/api/*` → function, `/*` → SPA fallback

## Troubleshooting: 502 / Servidor indisponível

Se `/api/auth/register` ou `/api/auth/login` retornam 502:

1. **Verifique as variáveis de ambiente** — `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` devem estar em **Site settings** → **Environment variables** (All scopes).
2. **Redeploy** — Após adicionar/alterar variáveis, faça um novo deploy (Deploys → Trigger deploy).
3. **Logs** — Em **Functions** → **server** → **Logs**, confira erros como "TURSO_DATABASE_URL deve estar configurado".
