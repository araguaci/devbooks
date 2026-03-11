# Links dos livros

## Forma recomendada: raw do GitHub

Configure a variável `GITHUB_RAW_BASE` no `.env`:

```
GITHUB_RAW_BASE=https://raw.githubusercontent.com/SEU_USER/BibliotecaDev/main
```

Todos os 95+ livros terão link automático para `LivrosDev/{slug}.pdf` — sem editar nada manualmente.

## Override com links.json

Para livros com URL diferente (ex: link externo, outro host), adicione em `links.json`:

```json
{
  "slug-do-livro": "https://url-alternativa.com/livro.pdf"
}
```

O `links.json` tem prioridade sobre o GitHub raw.
