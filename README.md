# HASIVU Platform

Production-oriented school meal management platform with parent ordering, kitchen workflows, RFID verification, payments, and analytics.

## Current Stack

- Backend: Node.js + TypeScript (`src/`)
- Frontend: Next.js 15 App Router (`web/src/app`)
- Database: Supabase Postgres (production), local Postgres for development
- Deployment target: VPS with Docker Compose + Nginx

## What Is Live In This Repo

- Frontend redesign pass with consistent motion/accessibility on:
  - Landing entry
  - `/menu`, `/orders`, `/dashboard`
  - shared dashboard/order UI surfaces
- Next.js 15 metadata/viewport alignment:
  - Root metadata remains in `metadata`
  - viewport/theme-color moved to `viewport` export path
- Nonce handling hardened to avoid static-render build noise while preserving CSP behavior in request contexts.

## Repository Layout

- `src/` - backend services, routes, and business logic
- `web/` - Next.js frontend
- `docs/` - architecture, deployment, and operational docs
- `scripts/` - validation and utility scripts

## Local Development

### Backend

```bash
npm install
npm run dev
```

### Frontend

```bash
cd web
npm install
npm run dev
```

## Build & Validation

### Frontend

```bash
cd web
npm run build
npm test
```

### Backend (example)

```bash
npm run build
npm test
```

## Environment

- Start from `.env.sample` and `web/.env.*` templates.
- Never commit secrets.
- Use Supabase connection strings for production DB settings.

## Deployment Notes (VPS + Supabase)

- App services are intended to run on VPS via Docker Compose.
- Supabase hosts Postgres; app should connect using SSL-enabled DB URL.
- Nginx should terminate TLS and reverse proxy frontend/backend.

## Status

- Local branch and `origin/main` are currently in sync.
- Working tree is clean.
