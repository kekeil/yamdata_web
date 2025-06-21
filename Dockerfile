# syntax=docker.io/docker/dockerfile:1

# --- BUILD STAGE ---
FROM node:18-alpine AS builder

# Ajout de libc6-compat si nécessaire
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copier uniquement package.json et installer les dépendances complètes
COPY package.json ./
RUN npm install

# Copier le reste du code et compiler l'application Next.js
COPY . ./
RUN npm run build


# --- PRODUCTION STAGE ---
FROM node:18-alpine AS runner

# Installer seulement les librairies système nécessaires
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Création d'un utilisateur non-root pour plus de sécurité
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copier package.json et n'installer que les dépendances de production
COPY package.json ./
RUN npm install --production

# Copier les artefacts de build Next.js
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Passer en user non-root et exposer le port
USER nextjs
EXPOSE 3000

# Démarrer le serveur Next.js
CMD ["npx", "next", "start", "-p", "3000"]
