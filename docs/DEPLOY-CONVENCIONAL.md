# Deploy convencional — Railway, Render, VPS

Deploy sem serverless: Node roda como processo normal, sem bundling de funções.

## Pré-requisitos

- Node.js 20+
- Turso (banco em produção) — [TURSO.md](TURSO.md)

## Build e start

```bash
npm run build   # gera client/dist
npm start       # sobe API + SPA em uma única porta
```

O servidor Express serve:
- `/api/*` → API
- `/*` → SPA (client/dist) + fallback para index.html

---

## Railway

1. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Conecte o repositório
3. **Settings**:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** *(vazio)*
4. **Variables:** adicione `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `GITHUB_RAW_BASE`
5. **Deploy** — Railway detecta o push e faz deploy automático

---

## Render

1. [render.com](https://render.com) → **New** → **Web Service**
2. Conecte o repositório
3. **Build & Deploy**:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
4. **Environment** → adicione as variáveis
5. **Create Web Service**

---

## VPS (DigitalOcean, Linode, etc.)

```bash
# No servidor
git clone <seu-repo>
cd BibliotecaDev
npm install
cd server && npm install && cd ..
npm run build
npm start
```

Para produção, use **PM2**:

```bash
npm install -g pm2
pm2 start server/index.js --name devbooks
pm2 save
pm2 startup
```

**Variáveis:** crie `.env` na raiz ou use `export TURSO_DATABASE_URL=...` antes do start.

**Nginx** (proxy reverso, SSL):

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Variáveis de ambiente

| Nome | Obrigatório | Descrição |
|------|-------------|-----------|
| `TURSO_DATABASE_URL` | Sim | URL do banco Turso |
| `TURSO_AUTH_TOKEN` | Sim | Token de autenticação Turso |
| `JWT_SECRET` | Sim | Chave para tokens JWT |
| `GITHUB_RAW_BASE` | Não | Base para PDFs (ex: `https://raw.githubusercontent.com/user/repo/main`) |
| `PORT` | Não | Porta (padrão: 3001) |
