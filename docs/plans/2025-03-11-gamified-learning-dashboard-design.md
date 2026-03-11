# Design: Dashboard Gamificado para BibliotecaDev

**Data:** 2025-03-11  
**Status:** Aprovado  
**Deploy:** VPS

---

## 1. Visão Geral

Dashboard web gamificado para acompanhar progresso de leitura da BibliotecaDev. Multi-usuário com login, persistência em banco, XP, níveis, streaks, badges, leaderboard, conquistas especiais, desafios semanais e notificações de streak.

### Requisitos validados
- **Conteúdo:** Livros da BibliotecaDev (LivrosDev + RANKING)
- **Usuários:** Multi-usuário com cadastro/login
- **Gamificação:** Completa + (XP, níveis, streaks, badges, leaderboard, conquistas, desafios semanais, notificações)

---

## 2. Arquitetura

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   React     │────▶│  Node.js    │────▶│  SQLite     │
│   (Vite)    │     │  (Express)  │     │  (DB)       │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │
       │                    │ JWT Auth
       └────────────────────┘
```

### Stack
- **Frontend:** React 18 + Vite, estética Cyber-Growth (artesdosul)
- **Backend:** Node.js + Express
- **DB:** SQLite (better-sqlite3) — migrável para PostgreSQL
- **Auth:** JWT + bcrypt
- **Deploy:** Docker + nginx (VPS)

---

## 3. Modelo de Dados

### Tabelas
- **users** — id, email, password_hash, display_name, created_at
- **books** — id, slug, title, category, priority (P0-P3), xp_value
- **user_progress** — user_id, book_id, completed_at
- **user_stats** — user_id, total_xp, level, current_streak, longest_streak, last_activity_at
- **badges** — id, slug, name, description, condition_type, condition_value
- **user_badges** — user_id, badge_id, earned_at
- **weekly_challenges** — id, week_start, description, target_books, xp_bonus
- **user_challenge_progress** — user_id, challenge_id, books_completed

### XP e Níveis
- P0: 100 XP | P1: 80 XP | P2: 60 XP | P3: 40 XP
- Streak bonus: +5 XP/dia (máx 30 XP extra)
- Níveis: 0→100→250→500→1000→2000... (curva exponencial)

### Streak
- Consecutivos dias com ≥1 livro marcado
- Reset se não marcar em 24h após último dia

---

## 4. Conquistas e Badges

| Badge | Condição |
|-------|----------|
| Primeiro Passo | 1 livro |
| P0 Completo | 5 livros P0 |
| Leitor Semanal | 7 dias streak |
| 10 Livros | 10 livros |
| 25 Livros | 25 livros |
| Mestre da Categoria | 100% em 1 categoria |
| Desafio Semanal | Completar desafio da semana |

---

## 5. Desafios Semanais

- Ex: "Leia 3 livros esta semana" — +50 XP bônus
- Rotaciona toda segunda-feira
- Opções: 2 livros P0-P1, 3 livros qualquer, 1 livro P0

---

## 6. Notificações de Streak

- Toast no login: "Seu streak está em X dias! Marque um livro hoje."
- Em risco: "Você não marcou livro ontem. Streak em risco!"
- PWA: push notification (opcional, fase 2)

---

## 7. Endpoints API

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/me
GET    /api/books
GET    /api/books/:slug
POST   /api/progress/toggle/:bookId
GET    /api/progress
GET    /api/stats
GET    /api/leaderboard
GET    /api/badges
GET    /api/challenges/current
```

---

## 8. Deploy VPS

- Dockerfile: Node + build do frontend
- docker-compose: app + nginx (reverse proxy)
- Volume para SQLite
- .env: JWT_SECRET, PORT, DATABASE_URL
