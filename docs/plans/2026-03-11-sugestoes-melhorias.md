# Plano de Sugestões de Melhorias — DevBooks

**Data:** 2026-03-11  
**Objetivo:** Roadmap de melhorias para o DevBooks (produto, UX, técnico, conteúdo)

---

## 1. Visão Geral

Este documento consolida sugestões de melhorias organizadas por área, prioridade e esforço estimado. Serve como backlog para evolução contínua do produto.

---

## 2. Melhorias de Produto e UX

### 2.1 Sugestão de Livros (Feature)

| Item | Descrição | Prioridade | Esforço |
|------|-----------|------------|---------|
| Canal de sugestões | Formulário ou link para usuários sugerirem novos livros ao catálogo | Média | Baixo |
| Sugestão por categoria | "Sugerir livro" dentro de cada categoria, com campos: título, autor, link, motivo | Média | Médio |
| GitHub Issues | Usar Issues do repositório como canal oficial de sugestões (link no app) | Baixa | Muito baixo |
| Votação comunitária | Usuários votam em sugestões; livros mais votados entram no backlog | Baixa | Alto |

**Recomendação inicial:** GitHub Issues — link "Sugerir livro" que abre template de Issue no repositório. Zero custo, baixo esforço.

---

### 2.2 Feedback e Erros

| Item | Descrição | Prioridade | Esforço |
|------|-----------|------------|---------|
| Toast de erro em PDF | ✅ Implementado — erros de carregamento de PDF exibidos no toast | — | — |
| Feedback de sucesso | Toast "Livro marcado como lido!" ao marcar livro | Baixa | Muito baixo |
| Página 404 amigável | Página customizada para rotas inexistentes | Baixa | Baixo |
| Relatório de bug | Link "Reportar problema" que abre Issue ou formulário | Baixa | Baixo |

---

### 2.3 Navegação e Descoberta

| Item | Descrição | Prioridade | Esforço |
|------|-----------|------------|---------|
| Filtro por idioma | PT-BR vs EN nos livros | Média | Médio |
| Ordenação | Por XP, título, data de conclusão, prioridade | Média | Baixo |
| Lista "Próximos sugeridos" | Baseado em livros lidos e ranking | Baixa | Alto |
| Histórico de leitura | Timeline ou lista de livros concluídos com data | Média | Médio |

---

### 2.4 Gamificação

| Item | Descrição | Prioridade | Esforço |
|------|-----------|------------|---------|
| Notificações de streak | Toast no login quando streak em risco | Média | Baixo |
| Push notifications (PWA) | Lembrete de streak ou desafio semanal | Baixa | Médio |
| Meta anual | "Ler X livros em 2026" com progresso | Baixa | Médio |
| Comparar com amigos | Convite por link, ver progresso de amigos | Baixa | Alto |

---

## 3. Melhorias Técnicas

### 3.1 Performance

| Item | Descrição | Prioridade | Esforço |
|------|-----------|------------|---------|
| Cache de PDF | Cache em disco/memória para PDFs já baixados do GitHub | Média | Médio |
| Lazy load de livros | Paginação ou virtualização na lista de livros | Baixa | Médio |
| Prefetch de ranking | Carregar ranking.json em background | Baixa | Baixo |
| Service Worker para API | Cache de respostas da API no PWA | Baixa | Médio |

---

### 3.2 Confiabilidade

| Item | Descrição | Prioridade | Esforço |
|------|-----------|------------|---------|
| Retry no fetch de PDF | Retentar 1–2x em caso de falha temporária | Média | Baixo |
| Health check do PDF | Endpoint ou job que valida links em links.json | Média | Médio |
| Logs estruturados | JSON logs para facilitar análise em produção | Baixa | Médio |
| Rate limit na API | Proteção contra abuso em endpoints públicos | Baixa | Baixo |

---

### 3.3 Segurança e DevOps

| Item | Descrição | Prioridade | Esforço |
|------|-----------|------------|---------|
| CSP headers | Content-Security-Policy para mitigar XSS | Média | Baixo |
| Rotação de JWT | Refresh tokens ou sessões com expiração curta | Baixa | Médio |
| Backup automático do DB | Script ou cron para backup do SQLite/Turso | Média | Baixo |
| CI/CD | GitHub Actions para build, test e deploy | Média | Médio |

---

## 4. Melhorias de Conteúdo

### 4.1 Catálogo

| Item | Descrição | Prioridade | Esforço |
|------|-----------|------------|---------|
| Sincronizar books.json | Garantir que books.json reflete o README/LivrosDev | Alta | Baixo |
| Validar links.json | Script que verifica se cada URL retorna 200 | Alta | Baixo |
| Metadados extras | Páginas, ano, idioma em books.json | Baixa | Médio |
| Capas dos livros | Exibir capa (URL do .github/img) no BookCard | Média | Médio |

---

### 4.2 Ranking e Curação

| Item | Descrição | Prioridade | Esforço |
|------|-----------|------------|---------|
| Atualizar RANKING.md | Revisar prioridades e motivos periodicamente | Contínuo | — |
| Ranking por trilha | Trilhas temáticas (ex: "Backend", "Frontend", "Liderança") | Baixa | Alto |
| Resenhas curtas | Campo opcional de resenha ao marcar como lido | Baixa | Médio |

---

## 5. Plano de Implementação Sugerido

### Fase 1 — Quick Wins (1–2 semanas) ✅ Concluída

1. ✅ **Link "Sugerir livro"** → GitHub Issues com template (footer do Layout)
2. ✅ **Toast de sucesso** ao marcar livro
3. ✅ **Retry no fetch de PDF** (1–2 tentativas)
4. ✅ **Script de validação de links** — `npm run validate-links` no server
5. ✅ **Página 404** customizada

### Fase 2 — Melhorias de Produto (2–4 semanas)

1. Filtro por idioma
2. Ordenação da lista de livros
3. Notificações de streak no login
4. Cache de PDF no servidor
5. Capas nos cards (se imagens disponíveis)

### Fase 3 — Evolução (backlog)

- Histórico de leitura
- Meta anual
- Push notifications
- Trilhas de leitura
- Sugestão in-app com votação

---

## 6. Canal de Sugestões (Implementação Mínima)

Para habilitar sugestões de usuários com esforço zero:

1. Criar Issue template no repositório: `.github/ISSUE_TEMPLATE/sugestao-livro.md`
2. Adicionar link no footer ou na seção de livros: "Sugerir novo livro" → `https://github.com/araguaci/devbooks/issues/new?template=sugestao-livro.md`

**Template sugerido:**

```markdown
---
name: Sugestão de livro
about: Sugira um novo livro para o catálogo DevBooks
title: '[LIVRO] '
labels: sugestao, livro
assignees: ''
---

**Título do livro:**
**Autor(es):**
**Categoria sugerida:**
**Link para o livro (PDF, site, etc.):**
**Motivo da sugestão:**
```

---

## 7. Métricas de Sucesso (Sugestão)

| Métrica | Como medir |
|---------|------------|
| Engajamento | Livros marcados como lidos / mês |
| Retenção | Usuários que voltam após 7 dias |
| Cobertura de PDFs | % de links em links.json que retornam 200 |
| Sugestões | Número de Issues abertas com label `sugestao` |

---

*Documento vivo — revisar e atualizar conforme prioridades mudarem.*
