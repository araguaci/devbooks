# Configurar Turso para o DevBooks

O DevBooks usa [Turso](https://turso.tech) como banco de dados em produção (Vercel). Em desenvolvimento local, usa SQLite.

## Pré-requisitos

- Conta no [Turso](https://turso.tech)
- [Turso CLI](https://docs.turso.tech/cli/installation) instalado

## 1. Obter `TURSO_DATABASE_URL`

### Criar o banco (primeira vez)

```bash
turso db create devbooks
```

### Obter a URL

```bash
turso db show devbooks --url
```

Saída esperada (exemplo):

```
libsql://devbooks-xxxxx-xxxxx.turso.io
```

Use esse valor como `TURSO_DATABASE_URL`.

## 2. Obter `TURSO_AUTH_TOKEN`

```bash
turso db tokens create devbooks
```

Saída esperada (exemplo):

```
eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

Use esse valor como `TURSO_AUTH_TOKEN`.

> **Segurança:** Não commite o token no repositório. Use variáveis de ambiente.

## 3. Onde configurar

### Vercel (produção)

1. Acesse o projeto na [Vercel](https://vercel.com)
2. **Settings** → **Environment Variables**
3. Adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `TURSO_DATABASE_URL` | `libsql://devbooks-xxx.turso.io` | Production, Preview |
| `TURSO_AUTH_TOKEN` | `eyJhbGci...` | Production, Preview |

4. Faça um novo deploy para aplicar as variáveis

### Local (desenvolvimento)

Crie ou edite `dashboard/server/.env`:

```env
TURSO_DATABASE_URL=libsql://devbooks-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGci...
```

Ou use variáveis de ambiente ao rodar comandos:

```bash
TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run seed
```

## 4. Popular o banco (seed)

Após configurar as variáveis, rode o seed contra o Turso:

```bash
cd dashboard/server
TURSO_DATABASE_URL=libsql://devbooks-xxx.turso.io TURSO_AUTH_TOKEN=eyJ... npm run seed
```

Ou, se o `.env` já estiver configurado:

```bash
cd dashboard/server
npm run seed
```

## 5. Comportamento

| Variáveis definidas | Banco usado |
|--------------------|-------------|
| `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` | Turso |
| Não definidas | SQLite local (`./data/biblioteca.db`) |

## Referências

- [Turso Docs](https://docs.turso.tech)
- [Turso + Vercel](https://docs.turso.tech/guides/vercel)
