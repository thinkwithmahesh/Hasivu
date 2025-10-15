# Multi-stage Dockerfile for Hasivu Platform
# Optimized for production deployment with minimal image size

# Stage 1: Base image with Node.js
FROM node:18-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Stage 2: Dependencies installation
FROM base AS deps

# Copy package files
COPY package*.json ./
COPY web/package*.json ./web/

# Install dependencies with clean install
RUN npm ci --only=production && \
    cd web && npm ci --only=production

# Stage 3: Build backend
FROM base AS backend-builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/web/node_modules ./web/node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build backend
RUN npm run build

# Stage 4: Build frontend
FROM base AS frontend-builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/web/node_modules ./web/node_modules

# Copy web source
COPY web ./web

# Build frontend
WORKDIR /app/web
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Stage 5: Production backend image
FROM node:18-alpine AS backend-production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built backend
COPY --from=backend-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/package*.json ./

# Copy Prisma files
COPY --from=backend-builder --chown=nodejs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start backend
CMD ["node", "dist/index.js"]

# Stage 6: Production frontend image
FROM node:18-alpine AS frontend-production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built frontend
COPY --from=frontend-builder --chown=nodejs:nodejs /app/web/.next/standalone ./
COPY --from=frontend-builder --chown=nodejs:nodejs /app/web/.next/static ./.next/static
COPY --from=frontend-builder --chown=nodejs:nodejs /app/web/public ./public

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start frontend
CMD ["node", "server.js"]

# Stage 7: Combined production image (default)
FROM node:18-alpine AS production
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy backend
COPY --from=backend-builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=backend-builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=backend-builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=backend-builder --chown=nodejs:nodejs /app/prisma ./prisma

# Copy frontend
COPY --from=frontend-builder --chown=nodejs:nodejs /app/web/.next ./web/.next
COPY --from=frontend-builder --chown=nodejs:nodejs /app/web/public ./web/public
COPY --from=frontend-builder --chown=nodejs:nodejs /app/web/package*.json ./web/

# Copy startup script
COPY --chown=nodejs:nodejs scripts/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use tini as init system
ENTRYPOINT ["/sbin/tini", "--"]

# Start application
CMD ["./docker-entrypoint.sh"]
