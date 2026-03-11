# Links dos livros

Os links apontam para o raw do repositório `araguaci/devbooks`:

```
https://raw.githubusercontent.com/araguaci/devbooks/main/LivrosDev/{slug}.pdf
```

## Regenerar links

Ao adicionar livros em `books.json`, rode:

```bash
cd server && npm run generate-links
```

Isso atualiza `links.json` com as URLs raw para todos os livros.

## Override

Para um livro com URL diferente (ex: link externo), edite `links.json` manualmente. O script `generate-links` sobrescreve o arquivo — faça backup de overrides antes de rodar.
