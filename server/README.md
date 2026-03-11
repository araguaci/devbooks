# API DevBooks Dashboard

Backend Node.js + Express + SQLite para o dashboard gamificado.

## Setup

```bash
npm install
npm run seed   # popula livros e badges
npm run dev    # inicia com watch (porta 3001)
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste:

- `PORT` — porta do servidor (default: 3001)
- `JWT_SECRET` — segredo para tokens (obrigatório em produção)
- `DATABASE_PATH` — caminho do SQLite (default: `./data/biblioteca.db`)

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | — | Cadastro |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/me` | ✓ | Usuário atual |
| GET | `/api/books` | — | Lista livros |
| GET | `/api/books/:slug` | — | Livro por slug |
| POST | `/api/progress/toggle/:bookId` | ✓ | Marcar/desmarcar livro |
| GET | `/api/progress` | ✓ | Progresso do usuário |
| GET | `/api/stats` | ✓ | XP, nível, streak, badges |
| GET | `/api/leaderboard` | — | Ranking por XP |
| GET | `/api/badges` | — | Lista de badges |
| GET | `/api/challenges/current` | ✓ | Desafio da semana |
| GET | `/api/health` | — | Health check |

## Gamificação

- **XP:** P0=100, P1=80, P2=60, P3=40 + bônus de streak (+5 XP/dia, máx 30)
- **Níveis:** 0→100→250→500→1000→2000...
- **Streak:** dias consecutivos com ≥1 livro marcado
- **Desafios semanais:** rotacionam toda segunda-feira
