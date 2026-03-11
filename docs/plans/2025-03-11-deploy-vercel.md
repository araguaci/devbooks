# Plano: Deploy DevBooks na Vercel

**Data:** 2025-03-11  
**Status:** Concluído

---

## 1. Visão Geral

Deploy do dashboard DevBooks na Vercel. O projeto tem frontend (React/Vite) e backend (Node/Express) com SQLite. A Vercel é serverless e não oferece filesystem persistente — o SQLite precisa ser substituído por um banco compatível.

---

## 2. Opções de Arquitetura

### Opção A: Full Vercel + Turso (recomendada)

| Componente | Solução |
|------------|---------|
| Frontend | Vercel (static/SPA) |
| API | Vercel Serverless Functions |
| Banco | [Turso](https://turso.tech) (SQLite edge, compatível) |

**Prós:** Tudo em um lugar, deploy simples, Turso tem SQLite compatível  
**Contras:** Migrar `better-sqlite3` → `@libsql/client`

### Opção B: Híbrido (Vercel + Railway)

| Componente | Solução |
|------------|---------|
| Frontend | Vercel |
| API + SQLite | [Railway](https://railway.app) ou [Render](https://render.com) |

**Prós:** Sem migração de banco, código atual quase inalterado  
**Contras:** Dois serviços, CORS, variáveis em dois ambientes

### Opção C: Full Vercel + Vercel Postgres

| Componente | Solução |
|------------|---------|
| Frontend | Vercel |
| API | Vercel Serverless Functions |
| Banco | Vercel Postgres |

**Prós:** Integração nativa com Vercel  
**Contras:** Migrar schema SQLite → PostgreSQL

---

## 3. Plano Detalhado: Opção A (Turso)

### 3.1 Estrutura do Projeto na Vercel

```
devbooks/
├── dashboard/
│   ├── client/          → Build Vite, output em dist/
│   └── server/          → API como Serverless Functions
├── api/                 → Ou: pasta api/ na raiz com handlers
├── vercel.json
└── package.json
```

### 3.2 Etapas

#### Fase 1: Preparar repositório

1. **Raiz do monorepo**
   - `vercel.json` na raiz
   - Build do client em `dashboard/client`
   - API em `dashboard/server` ou `api/`

2. **Configurar `vercel.json`**
   ```json
   {
     "buildCommand": "cd dashboard/client && npm install && npm run build",
     "outputDirectory": "dashboard/client/dist",
     "rewrites": [
       { "source": "/api/(.*)", "destination": "/api" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

3. **Serverless Functions**
   - Converter Express em handler compatível com Vercel
   - Ou usar `api/` com um único `api/index.js` que importa o app Express

#### Fase 2: Migrar para Turso

1. **Criar conta Turso** (turso.tech)
2. **Criar banco**: `turso db create devbooks`
3. **Obter URL e token**: `turso db show devbooks --url` e `turso db tokens create devbooks`
4. **Instalar**: `npm install @libsql/client`
5. **Adaptar `db.js`** para usar `createClient` do libsql em vez de `better-sqlite3`
6. **Rodar seed** contra Turso (script ou CLI)

#### Fase 3: Ajustes para Serverless

1. **Arquivos estáticos** (ranking.json, links.json, books.json)
   - Manter no repositório e ler em runtime (já é o caso)
   - Ou mover para Vercel Blob/Storage se necessário

2. **Proxy de PDF**
   - Rota `/api/pdf/:slug` continua funcionando
   - Timeout: 10s (Hobby) ou 60s (Pro) — PDFs grandes podem estourar
   - Alternativa: redirecionar para raw do GitHub em vez de proxy

3. **Cold start**
   - Primeira requisição pode demorar ~1–2s

#### Fase 4: Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `TURSO_DATABASE_URL` | Sim | URL do banco Turso |
| `TURSO_AUTH_TOKEN` | Sim | Token de autenticação Turso |
| `JWT_SECRET` | Sim | Segredo para tokens JWT |
| `GITHUB_RAW_BASE` | Não | Base para links de PDF (fallback) |

---

## 4. Estrutura de Arquivos para Vercel

### 4.1 `vercel.json` (raiz)

```json
{
  "version": 2,
  "buildCommand": "cd dashboard/client && npm ci && npm run build",
  "outputDirectory": "dashboard/client/dist",
  "framework": null,
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### 4.2 API como Serverless

Duas abordagens:

**A) Um handler que encapsula o Express**

- `api/[[...path]].js` — catch-all que repassa para o app Express
- O Express já tem as rotas `/api/*`

**B) Funções separadas**

- Uma função por rota (ex.: `api/auth/register.js`, `api/books.js`)
- Mais trabalho de refatoração

Recomendação: usar (A) com um único handler que importa o app Express.

---

## 5. Limitações da Vercel

| Item | Hobby | Pro |
|------|-------|-----|
| Timeout função | 10s | 60s |
| Tamanho resposta | 4.5 MB | 4.5 MB |
| Bandwidth | 100 GB/mês | 1 TB |
| Invocações | 100k/dia | 1M/dia |

**PDF proxy:** Arquivos grandes podem exceder timeout ou tamanho. Se necessário, usar link direto para o raw do GitHub em vez de proxy.

---

## 6. Checklist de Deploy

- [ ] Conta Vercel conectada ao repo `araguaci/devbooks`
- [ ] Conta Turso criada e banco `devbooks` criado
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] `db.js` migrado para `@libsql/client`
- [ ] Handler serverless criado em `api/`
- [ ] `vercel.json` configurado
- [ ] Seed executado no Turso
- [ ] Testes de login, progresso e PDF
- [ ] Domínio customizado (opcional)

---

## 7. Alternativa Rápida: Híbrido

Para deploy rápido sem migrar o banco:

1. **Frontend na Vercel**
   - Conectar repo, build em `dashboard/client`
   - `VITE_API_URL` apontando para o backend

2. **Backend no Railway**
   - Deploy do `dashboard/server` (Docker ou Node)
   - SQLite em volume persistente
   - Variáveis: `JWT_SECRET`, `GITHUB_RAW_BASE`

3. **CORS**
   - No Express: `cors({ origin: ['https://seu-app.vercel.app'] })`

---

## 8. Troubleshooting: API 404

Se `/api/*` retorna 404:

1. **Root Directory** — Em Vercel → Settings → General, o **Root Directory** deve estar vazio (raiz do repo). Se estiver `dashboard/client`, a pasta `api/` não será encontrada.

2. **Testar `/api/health`** — Acesse `https://seu-app.vercel.app/api/health`. Se retornar `{"ok":true}`, a pasta `api/` está funcionando. Se 404, o problema é a estrutura do deploy.

3. **Redeploy** — Após alterar `vercel.json` ou a pasta `api/`, faça um novo deploy.

4. **Variáveis** — Sem `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`, a API pode falhar. Configure em Settings → Environment Variables.

---

## 9. Referências

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Turso + Vercel](https://docs.turso.tech/guides/vercel)
- [libsql client](https://github.com/tursodatabase/libsql-client-ts)
