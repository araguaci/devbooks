# PWA e Open Graph — DevBooks

## PWA (Progressive Web App)

O DevBooks é instalável como PWA. Recursos:

- **Service Worker** — cache automático, atualização em segundo plano
- **manifest.webmanifest** — nome, ícones, theme_color, display standalone
- **Ícones** — 32, 72, 96, 128, 144, 152, 192, 384, 512px

### Gerar ícones

```bash
cd client
npm run generate-icons
```

Gera `public/icons/*.png`, `public/favicon.png` e `public/og-image.png` a partir de `public/icon.svg`.

### Personalizar o ícone

Edite `client/public/icon.svg` e rode `npm run generate-icons` novamente.

---

## Open Graph e Twitter Card

Tags para compartilhamento em redes sociais (Facebook, Twitter, LinkedIn, WhatsApp):

- **og:image** — `og-image.png` (1200×630), gerado a partir do ícone PWA
- **og:title**, **og:description**, **og:url**
- **twitter:card** — summary_large_image

### Alterar URL base

Se o site estiver em outro domínio, atualize em `client/index.html`:

- `og:url` e `og:image`
- `twitter:url` e `twitter:image`

Exemplo: substituir `https://devbooks.artesdosul.com` pela URL correta.
