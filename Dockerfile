# ===========================================
# Skilluv Frontend — Production Dockerfile
# Multi-stage build : ~50MB final image
# ===========================================

# --- Stage 1 : Build ---
FROM node:22-alpine AS build

WORKDIR /app

# Dépendances d'abord (cache Docker)
COPY package.json package-lock.json ./
RUN npm ci

# Source
COPY . .

# Build SvelteKit (adapter-node)
ENV NODE_ENV=production
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# --- Stage 2 : Production ---
FROM node:22-alpine AS production

WORKDIR /app

# Utilisateur non-root
RUN addgroup -S skilluv && adduser -S skilluv -G skilluv

# Copier uniquement le nécessaire
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV ORIGIN=https://skilluv.com

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Port
EXPOSE 3000

# Utilisateur non-root
USER skilluv

# Démarrer le serveur Node
CMD ["node", "build/index.js"]
