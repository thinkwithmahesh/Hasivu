# Multi-stage Dockerfile for Hasivu Platform
# Smaller images: split install (no web deps in backend), lean backend context, prune after build.

# Stage 1: Base image with Node.js
FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache libc6-compat

# Stage 2a: Backend dependencies only (no web/node_modules — saves ~hundreds of MB per layer)
FROM base AS deps-backend
RUN apk add --no-cache python3 make g++
COPY package*.json ./
ENV DOCKER_BUILD=1
ENV HUSKY=0
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Stage 2b: Frontend dependencies only
FROM base AS deps-frontend
COPY web/package*.json ./web/
ENV DOCKER_BUILD=1
ENV HUSKY=0
# sharp pulls a large prebuilt libvips tarball; default timeouts/retries often abort on slow links or tight Docker disk
ENV npm_config_fetch_retries=10 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_timeout=600000
RUN cd web && npm ci --legacy-peer-deps && npm cache clean --force

# Stage 3: Build backend
FROM base AS backend-builder
WORKDIR /app

COPY --from=deps-backend /app/node_modules ./node_modules
COPY package*.json ./
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json tsconfig-build.json tsconfig.runtime.json ./

ENV DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/postgres?schema=public"
RUN npx prisma generate && \
    npm run build && \
    npm prune --omit=dev --legacy-peer-deps && \
    npm cache clean --force

# Stage 4: Build frontend (single RUN removes node_modules from final builder layer footprint)
FROM base AS frontend-builder
WORKDIR /app/web

COPY web/package*.json ./
COPY --from=deps-frontend /app/web/node_modules ./node_modules

COPY web/ ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ARG NEXT_SERVER_API_URL
ENV NEXT_SERVER_API_URL=$NEXT_SERVER_API_URL

# Docker builds run inside linux/arm64 on Apple Silicon. Next's default
# Turbopack production build lacks native bindings there, so use Webpack.
RUN npm run build:docker && \
    rm -rf node_modules .next/cache && \
    npm cache clean --force

# Stage 5: Production backend image
FROM node:20-alpine AS backend-production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=backend-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=backend-builder --chown=nodejs:nodejs /app/tsconfig.runtime.json ./tsconfig.runtime.json
COPY --from=backend-builder --chown=nodejs:nodejs /app/prisma ./prisma

COPY scripts/docker-backend-entrypoint.sh /app/docker-backend-entrypoint.sh
RUN chmod +x /app/docker-backend-entrypoint.sh && chown nodejs:nodejs /app/docker-backend-entrypoint.sh

USER nodejs

ENV TS_NODE_PROJECT=tsconfig.runtime.json

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["/app/docker-backend-entrypoint.sh"]

# Stage 6: Production frontend image
FROM node:20-alpine AS frontend-production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=frontend-builder --chown=nodejs:nodejs /app/web/.next/standalone ./
COPY --from=frontend-builder --chown=nodejs:nodejs /app/web/.next/static ./.next/static
COPY --from=frontend-builder --chown=nodejs:nodejs /app/web/public ./public

USER nodejs

ENV HOSTNAME=0.0.0.0
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/status', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]

# Stage 7: Combined production image (default)
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache libc6-compat tini

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=backend-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=backend-builder --chown=nodejs:nodejs /app/prisma ./prisma

COPY --from=frontend-builder --chown=nodejs:nodejs /app/web/.next ./web/.next
COPY --from=frontend-builder --chown=nodejs:nodejs /app/web/public ./web/public
COPY --from=frontend-builder --chown=nodejs:nodejs /app/web/package*.json ./web/

COPY --chown=nodejs:nodejs scripts/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nodejs

EXPOSE 3000 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["./docker-entrypoint.sh"]
