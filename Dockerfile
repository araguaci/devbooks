# DevBooks - Container Docker para deploy
# Porta interna: 3001 | Porta host sugerida: 3003 (evitar conflito com 3000, 3001, 3002)

FROM node:20-alpine

# Dependências para better-sqlite3 (módulo nativo) + wget (healthcheck)
RUN apk add --no-cache python3 make g++ wget

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Instalar dependências (root, server, client)
# Usa npm install para tolerar lockfiles dessincronizados entre subprojetos
RUN npm install && cd server && npm install && cd ../client && npm install

# Copiar código
COPY . .

# Build do frontend (VITE_* são lidas no build)
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["npm", "start"]
