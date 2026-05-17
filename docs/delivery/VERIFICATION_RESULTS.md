# Verification results

**Run date (UTC):** 2026-05-17 (updated after env-file cleanup)  
**Environment:** macOS, Node local + Docker Compose (`docker-compose.dev.yml`)  
**Repository:** https://github.com/thinkwithmahesh/Hasivu  
**Raw logs:** `docs/delivery/evidence/` (gitignored — copy to acceptance email or attach as zip)

### Env / artifact audit (post-cleanup)

```bash
git ls-files '.env*' 'web/.env*'
# .env.example
# web/.env.example

git ls-files '*.bak' '*.log' 'dump.rdb'
# (empty)

git log --oneline -- web/.env.production
# (empty — file not in published history after rewrite)
```

See [SECRETS_AND_HISTORY.md](./SECRETS_AND_HISTORY.md) for credential audit notes.

---

## Summary

| # | Check | Result | Notes |
|---|--------|--------|--------|
| 1 | Backend type-check | **PASS** | `npm run type-check` exit 0 |
| 2 | Frontend type-check | **PASS** | `cd web && npm run type-check` exit 0 |
| 3 | Backend build | **PASS** | `npm run build` exit 0 |
| 4 | Frontend build | **PASS** | `cd web && npm run build` exit 0 |
| 5 | Backend unit tests | **PASS** | 29 suites, 306 tests |
| 6 | Required tests (acceptance gate) | **PASS** | 7 suites, 21 tests |
| 7 | Frontend unit tests | **PASS** | 11 suites, 48 tests |
| 8 | Playwright: login → order | **PASS** | 1 passed @ `http://localhost:3001` |
| 9 | Playwright: RFID flow | **PASS** | 1 passed |
| 10 | Playwright: payment flow | **SKIP** | Wallet UI disabled in pilot; test skipped by design |
| 11 | Playwright: admin/kitchen auth | **PASS** | 8 passed |
| 12 | Docker Compose up | **PASS** | postgres, redis, backend, frontend healthy |
| 13 | Backend `/health` | **PASS** | HTTP 200, DB + Redis up |
| 14 | Frontend `/api/status` | **PASS** | HTTP 200 |
| 15 | `scripts/smoke-local.sh` | **PASS** | After fix: `/api/health` instead of removed `/api/auth/status` |

---

## Commands used

```bash
# From repo root
cp .env.example .env.local
cp web/.env.example web/.env.local
export JWT_SECRET="$(openssl rand -hex 32)"
export JWT_REFRESH_SECRET="$(openssl rand -hex 32)"

git ls-files '.env*' 'web/.env*'   # .env.example + web/.env.example only

npm run type-check
npm run build
npm run test:unit
npm run test:required

cd web && npm run type-check && npm run build
cd web && npm test -- --passWithNoTests

docker compose -f docker-compose.dev.yml up -d --build
curl -fsS http://localhost:3000/health
curl -fsS http://localhost:3001/api/status
./scripts/smoke-local.sh

cd web && npx playwright install chromium
CI=1 PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test tests/e2e/login-order-pay.spec.ts --project="Desktop Chrome"
CI=1 PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test tests/e2e/rfid-flow.spec.ts --project="Desktop Chrome"
CI=1 PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test tests/e2e/payment-flow.spec.ts --project="Desktop Chrome"
CI=1 PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test tests/e2e/admin-kitchen-auth.spec.ts --project="Desktop Chrome"
```

---

## Demo credentials (verification runs)

**Password for all:** `Hasivu123!`

| Role    | Email                     |
| ------- | ------------------------- |
| Parent  | parent.demo@hasivu.local  |
| Admin   | admin.demo@hasivu.local   |
| Kitchen | kitchen.demo@hasivu.local |

---

## E2E / manual flows (Playwright)

| Flow | Demo user | Result |
|------|-----------|--------|
| Parent login + menu + cart + checkout | `parent.demo@hasivu.local` / `Hasivu123!` | **PASS** (`login-order-pay.spec.ts`) |
| Kitchen / admin auth surfaces | `kitchen.demo@hasivu.local`, admin routes | **PASS** (`admin-kitchen-auth.spec.ts`, 8 tests) |
| RFID verification page | — | **PASS** (`rfid-flow.spec.ts`) |
| Payment / wallet | — | **SKIP** (wallet quarantined; see `docs/pilot/SERVICE_QUARANTINE.md`) |

---

## Docker Compose (local demo)

```
NAME                  STATUS                    PORTS
hasivu-backend-dev    Up (healthy)              3000->3000
hasivu-frontend-dev   Up (healthy)              3001->3000
hasivu-postgres-dev   Up (healthy)              5432->5432
hasivu-redis-dev      Up (healthy)              6379->6379
```

Backend health excerpt:

```json
{"services":{"database":{"status":"up"},"redis":{"status":"up"}}}
```

---

## Follow-ups before production sign-off

1. Run full Playwright matrix in CI (`web` job) and attach GitHub Actions URL.
2. Confirm **secret rotation** before production per [SECRETS_AND_HISTORY.md](./SECRETS_AND_HISTORY.md).

---

## Log file index

| File pattern | Content |
|--------------|---------|
| `*-01-backend-typecheck.log` | Backend `tsc --noEmit` |
| `*-02-frontend-typecheck.log` | Frontend `tsc` |
| `*-03-backend-unit.log` | Full unit test output |
| `*-04-required.log` | Required gate tests |
| `*-05-frontend-unit.log` | Frontend Jest |
| `*-00-backend-build.log` / `*-00-frontend-build.log` | Production builds |
| `*-07-docker-compose.log` | `docker compose up --build` |
| `*-08-docker-health.log` | `docker ps`, curls, smoke |
| `*-06-playwright-*.log` | E2E specs |
