# Hasivu - School Meal Ordering Platform

Hasivu is a school meal ordering platform for Indian schools. Parents order meals, kitchen staff manage preparation, admins oversee operations, students track meal activity, and RFID flows support delivery verification.

## Quick Start (Development)

```bash
# Prerequisites: Docker Desktop, Node 18+
git clone https://github.com/thinkwithmahesh/Hasivu
cd Hasivu
cp .env.example .env.local
docker compose -f docker-compose.dev.yml up -d
```

Services:

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend | http://localhost:3000 |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

Demo credentials for local Docker:

| Role | Email | Password |
|------|-------|----------|
| Parent | parent.demo@hasivu.local | Hasivu123! |
| Admin | admin.demo@hasivu.local | Hasivu123! |
| Kitchen | kitchen.demo@hasivu.local | Hasivu123! |
| Student | student.demo@hasivu.local | Hasivu123! |
| Vendor | vendor.demo@hasivu.local | Hasivu123! |

## Architecture

```text
Next.js App Router       Express API
       |                     |
       |-- BFF API routes ---|  (selected proxy/fallback routes)
       |                     |
       |                 Prisma ORM
       |                     |
       |              PostgreSQL + Redis
```

Runtime decision:

| Area | Decision |
|------|----------|
| Production path | Docker VPS + Express + Next.js + Redis + Supabase/Postgres |
| Legacy path | AWS Lambda/serverless is quarantined and not part of pilot deploy |
| Auth | Cookie-based JWT using httpOnly cookies |
| Payments | Razorpay |
| Database | Prisma with PostgreSQL |
| Observability | Health/readiness/metrics endpoints plus Sentry hooks |

## Pilot Scope

The pilot launch path is intentionally narrower than the full historical PRD. See [docs/pilot/SERVICE_QUARANTINE.md](docs/pilot/SERVICE_QUARANTINE.md) for the active services, quarantined services, and formally deferred features.

Pilot-live areas:

- Authentication and role dashboards
- Parent menu/cart/checkout/order confirmation
- Admin user/menu/analytics navigation
- Kitchen workflow and management screens
- Student and vendor dashboards
- RFID verification and card-management smoke flows
- Health/readiness/metrics endpoints

Deferred areas:

- WhatsApp Business integration
- Hindi/Kannada i18n
- Calendar scheduler
- WebSocket live push
- Wallet/invoice/subscription/fraud/ML services
- React Native app

## Testing

```bash
npm run type-check
cd web && npm run type-check
npm run test:required
cd web && npx playwright test --project="Desktop Chrome"
npm audit --omit=dev --audit-level=moderate
cd web && npm audit --omit=dev --audit-level=moderate
```

Current proven local gates:

| Gate | Expected |
|------|----------|
| Root TypeScript | Pass |
| Web TypeScript | Pass |
| Required backend tests | 16/16 passing |
| Playwright role/browser suite | 41/41 passing |
| npm audit root/web | 0 moderate/high/critical vulnerabilities |
| Docker health | backend, frontend, postgres, redis healthy |

## Health And Operations

```bash
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
curl http://localhost:3000/metrics
curl http://localhost:3001/api/status
```

Operational runbooks live in [docs/runbooks](docs/runbooks).

## Production Readiness

BMAD status: **Conditional GO for pilot**, not final 100/100 production certification.

Cleared:

- Browser-readable auth tokens removed from launch path
- Raw SQL escape hatches removed or audited
- Docker launch path rebuilt and tested
- Role dashboards and core routes verified
- Razorpay CSP allowlist present
- WebGL shader dependency removed from launch UI
- Generated artifacts removed from Git tracking

Pending before any public access:

- Rotate every secret that ever appeared in tracked `.env*` history
- Scrub historical `.env*` secrets using `git filter-repo` after backup review
- Update GitHub/VPS/Supabase secrets with rotated values
- Rebuild and redeploy Docker with rotated secrets
- Complete human sign-off in [docs/pilot/PILOT_LAUNCH_CHECKLIST.md](docs/pilot/PILOT_LAUNCH_CHECKLIST.md)

## Useful Commands

```bash
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
npm run db:migrate
npm run db:seed:demo-local
```
