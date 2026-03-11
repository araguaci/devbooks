# Configuração Vercel — DevBooks

## Excluir projeto e criar novamente

1. Acesse [vercel.com](https://vercel.com) → seu projeto DevBooks
2. **Settings** → **General** → role até o final
3. **Delete Project** → confirme

## Criar novo projeto

1. **Add New** → **Project**
2. Importe o repositório (ex.: `araguaci/devbooks`)
3. Configure antes do deploy:

### Build and Deployment Settings

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Other |
| **Root Directory** | *(deixar vazio)* |
| **Build Command** | `npm run build` |
| **Output Directory** | *(deixar vazio)* |
| **Install Command** | `npm install && cd client && npm install` |

### Importante

- **Root Directory** deve estar vazio (raiz do repo)
- **Output Directory** vazio — o `vercel.json` define `builds` e `routes`; o `server.js` serve tudo
- Se o projeto usar `vercel.json` com `builds`, as configurações de Build/Output podem ser ignoradas (a Vercel usa o `vercel.json`)

### Variáveis de ambiente

Em **Settings** → **Environment Variables**, adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `TURSO_DATABASE_URL` | `libsql://devbooks-xxx.turso.io` | Production, Preview |
| `TURSO_AUTH_TOKEN` | *(token do Turso)* | Production, Preview |
| `JWT_SECRET` | *(string aleatória segura)* | Production, Preview |
| `GITHUB_RAW_BASE` | `https://raw.githubusercontent.com/araguaci/devbooks/main` | Production, Preview |
| *(opcional)* | | |

## Referência: vercel.json

O projeto usa `vercel.json` com `builds` e `routes`:

```json
{
  "version": 2,
  "installCommand": "npm install && cd client && npm install",
  "framework": null,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "client/dist" }
    },
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/server.js" }
  ]
}
```

| Config | Função |
|--------|--------|
| **Install Command** | Instala dependências da raiz e do client |
| **Build Command** | `npm run build` (via `package.json` → `cd client && npm ci && npm run build`) |
| **Build 1** | Gera `client/dist` (frontend) |
| **Build 2** | `server.js` (Express, SPA + API) |
| **Routes** | Todas as requisições → `server.js` |

## Deploy

```bash
npm run deploy
```

Ou conecte o repositório Git para deploy automático a cada push.

---

## Troubleshooting: deploy não sobe

### 1. Pasta LivrosDev muito grande
Se o projeto tem muitos PDFs em `LivrosDev/`, o upload pode falhar ou demorar. O `.vercelignore` já exclui essa pasta. Confirme que existe na raiz.

### 2. Build falha
- Rode localmente: `npm run build`
- Se falhar, corrija antes do deploy
- Verifique os logs em Vercel → Deployments → Building

### 3. Erro "builds" / configuração
- Em **Settings** → **Build and Deployment**, deixe **Root Directory** vazio
- Se aparecer "Due to builds existing, Project Settings will not apply" — é esperado; o `vercel.json` controla

### 4. Deploy via Git
Se `vercel --prod` falhar, tente conectar o repo na Vercel e fazer push. O deploy automático pode funcionar melhor.

### 5. Node.js
Em **Settings** → **General** → **Node.js Version**, use **20.x** ou **22.x**.

### 6. 502 / Servidor indisponível em /api/auth/*
Se cadastro ou login retornam 502:
- Configure `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` em **Settings** → **Environment Variables**
- Aplique em Production e Preview
- Faça um novo deploy após alterar variáveis
