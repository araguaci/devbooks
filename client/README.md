# DevBooks Dashboard (Frontend)

Interface React com estética Cyber-Growth para o dashboard gamificado.

## Setup

```bash
npm install
npm run dev
```

O Vite faz proxy de `/api` para `http://localhost:3001`. Certifique-se de que o backend está rodando.

## Scripts

- `npm run dev` — desenvolvimento (porta 5173)
- `npm run build` — build de produção
- `npm run preview` — preview do build

## Estrutura

- `src/api.js` — chamadas à API
- `src/context/AuthContext.jsx` — estado de autenticação
- `src/pages/` — Login, Register, Dashboard
- `src/components/` — BookCard, StatsCard, ChallengeCard, Leaderboard, Layout
