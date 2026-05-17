# HASIVU — Acceptance delivery package

**To:** Raghavendra  
**From:** Mahesh  
**Repository:** https://github.com/thinkwithmahesh/Hasivu  
**Branch:** `main` (fresh history — see [SECRETS_AND_HISTORY.md](./SECRETS_AND_HISTORY.md))

---

## 1. Clean production repository

| Included        | Location                                                          |
| --------------- | ----------------------------------------------------------------- |
| Backend API     | `src/` (Express, Prisma)                                          |
| Frontend        | `web/` (Next.js App Router)                                       |
| Database        | `prisma/` (schema + migrations)                                   |
| Docker          | `Dockerfile`, `docker-compose.dev.yml`, `docker-compose.prod.yml` |
| Tests           | `tests/`, `web/tests/`                                            |
| Scripts         | `scripts/` (deploy, smoke, delivery prep)                         |
| Docs / runbooks | `docs/runbooks/`, `docs/architecture/`, `docs/delivery/`          |
| CI              | `.github/workflows/`                                              |

| Removed from delivery              | Reason                                  |
| ---------------------------------- | --------------------------------------- |
| `*.bak` (~380 files)               | Editor backups                          |
| `*.log`, `dump.rdb`                | Local/runtime artifacts                 |
| `legacy/`                          | Quarantined serverless path (not pilot) |
| Root agent/status `*.md`           | Session reports (prior cleanup)         |
| `AWSCLIV2.pkg`                     | Local installer                         |
| `node_modules/`, `dist/`, `.next/` | Build outputs (gitignored)              |

---

## 2. Environment and secret cleanup

| Item                                                    | Status                                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| `.env.example` + `web/.env.example` only                | Committed (placeholders)                                               |
| `web/.env.production`, `.env.staging`, `.env.development`, `.env.india` | **Removed** from tracking; gitignored (see SECRETS_AND_HISTORY.md) |
| Root `.env.production` / `.env.staging`                 | **Never** in delivery tree                                             |
| Fresh Git history on `main` (post env cleanup)          | **Yes** — rewritten so env files are not in any commit                 |
| Secret rotation after any past leak                     | **Required before production** — operator action                       |

---

## 3. Setup instructions

See root [README.md](../../README.md) — sections: Prerequisites, Install, Database, Docker, Demo users, Verification commands.

### Demo login (local Docker seed)

**Password for all demo accounts:** `Hasivu123!`

| Role    | Email                     |
| ------- | ------------------------- |
| Parent  | parent.demo@hasivu.local  |
| Admin   | admin.demo@hasivu.local   |
| Kitchen | kitchen.demo@hasivu.local |
| Student | student.demo@hasivu.local |
| Vendor  | vendor.demo@hasivu.local  |

Login URL: http://localhost:3001/auth/login

---

## 4. Verification evidence

Run locally and attach CI links:

```bash
npm run type-check
cd web && npm run type-check
npm run test:unit
cd web && npm test -- --passWithNoTests
cd web && npx playwright test --project="Desktop Chrome" tests/e2e/login-order-pay.spec.ts
docker compose -f docker-compose.dev.yml up -d --build
./scripts/smoke-local.sh
```

Record outputs in `docs/delivery/evidence/` or your CI dashboard. Template: [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md).

**Latest local run:** [VERIFICATION_RESULTS.md](./VERIFICATION_RESULTS.md) (2026-05-17).

---

## 5. Scope status

See [SCOPE_STATUS.md](./SCOPE_STATUS.md).

---

## 6. Deployment package

| Artifact            | Path                                     |
| ------------------- | ---------------------------------------- |
| Local / demo Docker | `docker-compose.dev.yml`                 |
| Production compose  | `docker-compose.prod.yml`                |
| Deploy runbook      | `docs/runbooks/DEPLOY.md`                |
| Rollback            | `docs/runbooks/ROLLBACK.md`              |
| Secrets rotation    | `docs/runbooks/SECRETS_ROTATION.md`      |
| Env matrix          | `docs/runbooks/ENV_MATRIX.md`            |
| Runtime routes      | `docs/architecture/RUNTIME_ROUTE_MAP.md` |

**Hosting assumption (pilot):** Docker on VPS (Express + Next + Postgres + Redis) or local Docker for acceptance; optional Supabase-hosted Postgres in production.

---

## Product roles (five)

`parent`, `student`, `admin`, `kitchen_staff`, `vendor` — no teacher/super-admin product surfaces.
