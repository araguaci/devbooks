# DevBooks — Deploy com Docker

Deploy em container usando a porta **3003** (evita conflito com 3000, 3001, 3002 em uso no srv1114865).

## Pré-requisitos

- Docker e Docker Compose
- Arquivo `.env` com `JWT_SECRET`

## Quick Start

```bash
# 1. Criar .env a partir do exemplo
cp .env.example .env
# Editar .env e definir JWT_SECRET

# 2. Build e subir
docker compose build
docker compose up -d

# 3. Seed (primeira vez, SQLite local)
docker compose exec devbooks_app npm run seed

# 4. Verificar
curl http://localhost:3003/api/health
```

## Portas

| Host | Container | Uso |
|------|-----------|-----|
| 3003 | 3001 | DevBooks (API + SPA) |

## Comandos úteis

```bash
# Logs
docker compose logs -f devbooks_app

# Parar
docker compose down

# Rebuild após alterações
docker compose build --no-cache && docker compose up -d
```

## Nginx (proxy reverso)

Após configurar o domínio e SSL, adicione no Nginx:

```nginx
proxy_pass http://127.0.0.1:3003;
```

Ver plano completo: [docs/plans/2026-03-11-deploy-devbooks-artesdosul.md](plans/2026-03-11-deploy-devbooks-artesdosul.md)
