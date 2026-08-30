# ===========================================
# Skilluv Frontend — Production Dockerfile
# Multi-stage build : ~50MB final image
# ===========================================

# --- Stage 1 : Build ---
FROM node:24-alpine AS build

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
FROM node:24-alpine AS production

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
# The production domain. SvelteKit checks the Origin header of every form
# post against this value and rejects mismatches as CSRF, so a deployment
# that serves a different host MUST override it — a preview or staging
# environment left on this default renders perfectly and silently refuses
# every submission.
ENV ORIGIN=https://skill-uv.com

# Healthcheck
#
# 127.0.0.1, not localhost. In this image wget resolves `localhost` to the IPv6
# loopback and connects to [::1]:3000, while the server binds 0.0.0.0, which is
# IPv4 only — so every probe was refused and the container was declared
# unhealthy while it was serving perfectly ("Listening on http://0.0.0.0:3000"
# in the logs, connection refused in the probe). The literal address removes
# the name resolution that caused it.
#
# $PORT rather than a literal 3000, so overriding the port does not leave the
# healthcheck probing the old one.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://127.0.0.1:${PORT}/" || exit 1

# Port
EXPOSE 3000

# Utilisateur non-root
USER skilluv

# Démarrer le serveur Node
CMD ["node", "build/index.js"]
