# DevBooks Dashboard

Dashboard gamificado para acompanhar progresso de leitura do DevBooks.

## Stack

- **Frontend:** React 18 + Vite (porta 5173)
- **Backend:** Node.js + Express (porta 3001)
- **DB:** SQLite

## Desenvolvimento

```bash
# Instalar dependências (uma vez)
cd dashboard && npm install && npm run setup

# Subir cliente e servidor
npm run dev
```

**Portas em uso?** Rode `npm run dev:fresh` para liberar 3001 e 5173 e subir novamente.

Acesse http://localhost:5173. O frontend faz proxy de `/api` para o backend.

## Estrutura

```
dashboard/
├── client/     # React + Vite
├── server/     # Express + SQLite
└── README.md
```
