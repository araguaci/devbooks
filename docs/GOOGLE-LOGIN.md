# Login com Google — DevBooks

## 1. Criar credenciais no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. **APIs e Serviços** → **Credenciais** → **Criar credenciais** → **ID do cliente OAuth**
4. Tipo: **Aplicativo da Web**
5. **URIs de redirecionamento autorizados:**
   - `https://devbooks.artesdosul.com`
   - `http://localhost:5173` (desenvolvimento)
6. Copie o **ID do cliente** (formato: `xxx.apps.googleusercontent.com`)

## 2. Configurar variáveis de ambiente

### Backend (Docker / servidor)

No `.env`:

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

### Frontend (build)

O Client ID do Google é exposto no frontend (é público). Para o build de produção, use:

```env
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

**Docker:** passe no build ou em runtime. Como o frontend é buildado na imagem, use `ARG` no Dockerfile ou defina antes do build:

```bash
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com docker compose build
```

Ou adicione ao `.env` (o Vite lê variáveis `VITE_*` no build):

```env
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

## 3. Rebuild e deploy

```bash
# Com VITE_GOOGLE_CLIENT_ID no .env
docker compose build --no-cache
docker compose up -d
```

## 4. Fluxo

- Usuário clica em "Continuar com Google" em `/login` ou `/register`
- Google retorna um `id_token` (JWT)
- O frontend envia o token para `POST /api/auth/google`
- O backend verifica o token com a API do Google e cria/atualiza o usuário
- O backend retorna JWT do DevBooks; o usuário fica logado

## 5. Vinculação de contas

Se um usuário já tem conta com email/senha e faz login com Google usando o mesmo email, a conta é vinculada automaticamente (o `google_id` é associado ao usuário existente).
