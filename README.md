# HASIVU — School Meal Ordering Platform

HASIVU is a **school meal ordering and operations platform** for Indian schools. Parents order meals for children; kitchen staff manage preparation queues; school admins manage users and menus; vendors handle supply; students use RFID-assisted pickup flows. Payments use **Razorpay**; data is stored in **PostgreSQL** (Prisma); sessions and cache use **Redis**.

**Product roles (five):** `parent`, `student`, `admin`, `kitchen_staff`, `vendor`.

**Acceptance package for reviewers:** [docs/delivery/ACCEPTANCE_PACKAGE.md](docs/delivery/ACCEPTANCE_PACKAGE.md) (scope, verification, deployment, secrets).

---

## Prerequisites

- **Node.js** ≥ 18.19 (`nvm use` reads `.nvmrc`)
- **npm** ≥ 9
- **Docker Desktop** (recommended for full stack)
- **Git**

---

## 1. Install dependencies

```bash
git clone https://github.com/thinkwithmahesh/Hasivu.git
cd Hasivu

# Root API + tooling
npm install --legacy-peer-deps

# Web app
cd web && npm install --legacy-peer-deps && cd ..
```

---

## 2. Environment setup

Only **`.env.example`** (root) and **`web/.env.example`** are committed. Copy and set secrets locally (never commit real values):

```bash
cp .env.example .env.local
cp web/.env.example web/.env.local
# Generate two distinct secrets (32+ chars each):
# openssl rand -hex 32
```

Required for Docker and local API:

| Variable                                  | Notes                              |
| ----------------------------------------- | ---------------------------------- |
| `JWT_SECRET`                              | Min 32 characters                  |
| `JWT_REFRESH_SECRET`                      | Different from `JWT_SECRET`        |
| `DATABASE_URL`                            | Postgres connection string         |
| `DIRECT_DATABASE_URL`                     | Direct Postgres URL for migrations |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Test keys for payment flows        |

For **integration tests**, use `NODE_ENV=test` and a test DB URL (see `npm run test:integration`); do not commit `.env.test`.

---

## 3. Database migrations

With Postgres running (Docker or local):

```bash
export DATABASE_URL="postgresql://hasivu:dev-only-change-me@localhost:5432/hasivu?schema=public"
export DIRECT_DATABASE_URL="$DATABASE_URL"

npm run db:migrate
# or: npx prisma migrate deploy
```

Generate Prisma client if needed:

```bash
npm run db:generate
```

---

## 4. Seed demo data

Docker compose seeds automatically when the DB is empty (`RUN_DB_SEED_IF_EMPTY=true`).

Manual seed:

```bash
npm run db:seed:demo-local
# optional full seed:
npm run db:seed
```

---

## 5. Start with Docker (recommended)

```bash
# From repo root — ensure JWT_* are exported or in .env.local loaded by your shell
export JWT_SECRET="$(openssl rand -hex 32)"
export JWT_REFRESH_SECRET="$(openssl rand -hex 32)"

docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml ps
```

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| Postgres    | localhost:5432        |
| Redis       | localhost:6379        |

Health checks:

```bash
curl -fsS http://localhost:3000/health
curl -fsS http://localhost:3000/api/health
curl -fsS http://localhost:3001/api/status
./scripts/smoke-local.sh
```

---

## 6. Start without Docker (split terminals)

**Terminal A — backend**

```bash
export DATABASE_URL="postgresql://hasivu:dev-only-change-me@localhost:5432/hasivu?schema=public"
export DIRECT_DATABASE_URL="$DATABASE_URL"
export JWT_SECRET="your-local-jwt-secret-min-32-chars"
export JWT_REFRESH_SECRET="your-local-refresh-secret-min-32-chars"
export REDIS_URL="redis://localhost:6379"
export CORS_ORIGINS="http://localhost:3000,http://localhost:3001"

npm run db:migrate
npm run dev
```

**Terminal B — frontend**

```bash
cd web
export NEXT_PUBLIC_API_URL=http://localhost:3000
npm run dev
# Default Next dev port may be 3000 — use 3001 in compose; set -p 3001 if needed
```

---

## 7. Demo users (local Docker seed)

| Role    | Email                     | Password   |
| ------- | ------------------------- | ---------- |
| Parent  | parent.demo@hasivu.local  | Hasivu123! |
| Admin   | admin.demo@hasivu.local   | Hasivu123! |
| Kitchen | kitchen.demo@hasivu.local | Hasivu123! |
| Student | student.demo@hasivu.local | Hasivu123! |
| Vendor  | vendor.demo@hasivu.local  | Hasivu123! |

Login: http://localhost:3001/auth/login

---

## 8. Verification commands

```bash
npm run type-check
cd web && npm run type-check
npm run test:unit
npm run test:required
cd web && npm test -- --passWithNoTests
cd web && npx playwright test tests/e2e/login-order-pay.spec.ts --project="Desktop Chrome"
```

Full acceptance checklist: [docs/delivery/VERIFICATION_CHECKLIST.md](docs/delivery/VERIFICATION_CHECKLIST.md).

---

## Architecture

```text
Next.js (web/)          Express API (src/)
       |                        |
       +---- BFF /api/* ---------+
       |                        |
                         Prisma ORM
                               |
                    PostgreSQL + Redis
```

| Area       | Path                         |
| ---------- | ---------------------------- |
| API routes | `src/routes/*`, `src/app.ts` |
| Web UI     | `web/src/app/**`             |
| Migrations | `prisma/migrations/`         |
| Runbooks   | `docs/runbooks/`             |

See [docs/architecture/RUNTIME_ROUTE_MAP.md](docs/architecture/RUNTIME_ROUTE_MAP.md).

---

## Pilot scope

Active: auth, parent order flow, kitchen ops, admin/vendor dashboards, RFID verification UI, Razorpay test payments, health/metrics.

Deferred: WhatsApp, wallet/subscriptions, realtime push, i18n, mobile app, `legacy/` serverless.

Details: [docs/pilot/SERVICE_QUARANTINE.md](docs/pilot/SERVICE_QUARANTINE.md) and [docs/delivery/SCOPE_STATUS.md](docs/delivery/SCOPE_STATUS.md).

---

## Production deployment

| Doc                                                                    | Purpose                     |
| ---------------------------------------------------------------------- | --------------------------- |
| [docs/runbooks/DEPLOY.md](docs/runbooks/DEPLOY.md)                     | Deploy steps                |
| [docs/runbooks/ROLLBACK.md](docs/runbooks/ROLLBACK.md)                 | Rollback                    |
| [docs/runbooks/SECRETS_ROTATION.md](docs/runbooks/SECRETS_ROTATION.md) | Secret rotation             |
| [docs/runbooks/ENV_MATRIX.md](docs/runbooks/ENV_MATRIX.md)             | Environment matrix          |
| `docker-compose.prod.yml`                                              | Production compose template |

---

## License

Proprietary — Hasivu Platform. Contact maintainers for use outside authorized pilot.
