# Plano de Deploy — DevBooks em devbooks.artesdosul.com

**Data:** 2026-03-11  
**Ambiente:** srv1114865 (baseado em infra-documentacao-20260311_205608.txt)  
**Domínio:** devbooks.artesdosul.com

---

## 1. Resumo da Aplicação DevBooks

| Componente | Tecnologia |
|------------|------------|
| Frontend | React + Vite (SPA) |
| Backend | Express (Node.js) |
| Arquitetura | Monolito — API + SPA servidos na mesma porta |
| Banco de dados | SQLite (better-sqlite3) local **ou** Turso (LibSQL) em nuvem |
| Porta padrão | 3001 |

**Comandos de build/start:**
```bash
npm run build   # gera client/dist
npm start       # sobe API + SPA em http://localhost:3001
```

---

## 2. Visão Geral da Infraestrutura Atual

- **Host:** srv1114865, Ubuntu, Docker 28.2.2, Docker Compose 1.29.2
- **Proxy reverso:** Nginx no host nas portas 80/443
- **Padrão de apps:** Containers Docker expondo portas (ex: saude_livre_frontend:5174, zero_app:3002)
- **SSL:** Let's Encrypt em `/etc/letsencrypt/live/<dominio>/`
- **Config Nginx:** `/etc/nginx/sites-enabled/` (2 arquivos)

**Portas já em uso (evitar):** 80, 443, 3000, 3001, 3002, 3306, 5000, 5001, 5174, 5678, 6379, 6380, 7575, 8000, 8079, 8080, 8081, 8443, 8760, 8761, 9443

**Porta sugerida para DevBooks:** `3003` (livre)

---

## 3. Opções de Deploy

### Opção A — Container Docker (recomendada)

Vantagens: isolamento, consistência, fácil rollback, alinhado aos outros apps.

### Opção B — Processo nativo no host (PM2/systemd)

Vantagens: menos overhead, acesso direto ao filesystem. Útil se preferir manter fora de containers.

---

## 4. Plano Detalhado — Opção A (Docker)

### 4.1 Criar Dockerfile

Arquivo: `Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Dependências
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm install && cd server && npm install && cd ../client && npm install

# Código
COPY . .

# Build do frontend
RUN npm run build

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["npm", "start"]
```

### 4.2 Criar docker-compose.yml

Arquivo: `docker-compose.yml`

```yaml
services:
  devbooks_app:
    build: .
    container_name: devbooks_app
    restart: unless-stopped
    ports:
      - "3003:3001"
    environment:
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET}
      - GITHUB_RAW_BASE=${GITHUB_RAW_BASE:-}
      # Opção 1: SQLite local (volume)
      - DATABASE_PATH=/data/biblioteca.db
      # Opção 2: Turso (descomente e use)
      # - TURSO_DATABASE_URL=${TURSO_DATABASE_URL}
      # - TURSO_AUTH_TOKEN=${TURSO_AUTH_TOKEN}
    volumes:
      - devbooks_data:/data
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "-", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  devbooks_data:
```

### 4.3 Arquivo .env (não versionar)

```env
JWT_SECRET=seu-segredo-jwt-forte-aqui
GITHUB_RAW_BASE=https://raw.githubusercontent.com/USER/REPO/main
# Se usar Turso:
# TURSO_DATABASE_URL=libsql://devbooks-xxx.turso.io
# TURSO_AUTH_TOKEN=eyJ...
```

### 4.4 Ajuste no server para DATABASE_PATH

O `server/db.js` já suporta `DATABASE_PATH`. Para SQLite em container, usar `/data/biblioteca.db` e montar volume em `/data`.

---

## 5. Configuração do Nginx no Host

### 5.1 Obter certificado SSL

```bash
sudo certbot certonly --nginx -d devbooks.artesdosul.com
```

Certificados ficarão em: `/etc/letsencrypt/live/devbooks.artesdosul.com/`

### 5.2 Adicionar server block

Criar arquivo em `/etc/nginx/sites-available/devbooks` (ou adicionar ao existente):

```nginx
# ============================================
# DEVBOOKS - devbooks.artesdosul.com
# ============================================

# HTTP - Redirecionar para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name devbooks.artesdosul.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    return 301 https://$server_name$request_uri;
}

# HTTPS - DevBooks (Proxy Reverso)
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name devbooks.artesdosul.com;

    ssl_certificate /etc/letsencrypt/live/devbooks.artesdosul.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/devbooks.artesdosul.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubdomains" always;

    access_log /var/log/nginx/devbooks_access.log;
    error_log /var/log/nginx/devbooks_error.log;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
}
```

**Nota:** Se o Nginx do host usar nomes de containers (ex: `saude_livre_frontend`) em vez de `127.0.0.1`, será necessário conectar o container `devbooks_app` à mesma rede Docker. Nesse caso, use `proxy_pass http://devbooks_app:3001` e garanta que o Nginx esteja em um container na mesma rede.

### 5.3 Habilitar e recarregar

```bash
sudo ln -s /etc/nginx/sites-available/devbooks /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. DNS

Antes do certificado:

- Registrar **A** ou **CNAME** para `devbooks.artesdosul.com` apontando para o IP do srv1114865.

---

## 7. Checklist de Execução

| # | Tarefa | Comando/Ação |
|---|--------|--------------|
| 1 | Configurar DNS | A/CNAME devbooks.artesdosul.com → IP do servidor |
| 2 | Obter certificado SSL | `sudo certbot certonly --nginx -d devbooks.artesdosul.com` |
| 3 | Criar Dockerfile | Conteúdo da seção 4.1 |
| 4 | Criar docker-compose.yml | Conteúdo da seção 4.2 |
| 5 | Criar .env | JWT_SECRET, GITHUB_RAW_BASE (e Turso se usar) |
| 6 | Configurar Nginx | Arquivo da seção 5.2, habilitar e recarregar |
| 7 | Build e subir | `docker compose build && docker compose up -d` |
| 8 | Seed (opcional) | `docker compose exec devbooks_app npm run seed` |
| 9 | Testar | https://devbooks.artesdosul.com |

---

## 8. Plano Detalhado — Opção B (Nativo no host)

Se preferir rodar sem Docker:

```bash
# No servidor
cd /var/www/devbooks  # ou /root/devbooks
git pull
npm install && cd server && npm install && cd ..
npm run build

# Criar .env na raiz
export JWT_SECRET=...
export TURSO_DATABASE_URL=...  # ou use SQLite
export TURSO_AUTH_TOKEN=...

# PM2
npm install -g pm2
pm2 start server/index.js --name devbooks
pm2 save
pm2 startup
```

**Nginx:** usar `proxy_pass http://127.0.0.1:3001` (se a app rodar na 3001).

---

## 9. Banco de Dados — SQLite vs Turso

| Opção | Quando usar | Configuração |
|-------|-------------|--------------|
| **SQLite** | Deploy simples, dados em um único servidor | Volume Docker em `/data/biblioteca.db` ou `DATABASE_PATH` |
| **Turso** | Escalabilidade, multi-região, backup | `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` |

Para SQLite em container: `docker compose exec devbooks_app npm run seed` (após subir).

---

## 10. Variáveis de Ambiente

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `JWT_SECRET` | Sim | Chave para tokens JWT |
| `TURSO_DATABASE_URL` | Sim* | URL do banco Turso |
| `TURSO_AUTH_TOKEN` | Sim* | Token Turso |
| `GITHUB_RAW_BASE` | Não | Base para PDFs |
| `DATABASE_PATH` | Não | Caminho do SQLite (padrão: `./data/biblioteca.db`) |
| `PORT` | Não | Porta interna (padrão: 3001) |

\* Obrigatório se não usar SQLite local.

---

## 11. Troubleshooting

| Problema | Solução |
|----------|---------|
| 502 Bad Gateway | Verificar se o container está rodando: `docker ps \| grep devbooks` |
| Erro de banco | Conferir volume ou `TURSO_*` |
| SSL não funciona | `certbot certonly --nginx -d devbooks.artesdosul.com` |
| 404 em rotas SPA | Garantir que o build gerou `client/dist` e que o Express serve o fallback |

---

## 12. Referências

- [docs/DEPLOY-CONVENCIONAL.md](../DEPLOY-CONVENCIONAL.md)
- [docs/TURSO.md](../TURSO.md)
- `infra-documentacao-20260311_205608.txt` (raiz do projeto)
