# Verification checklist (acceptance)

Run from repository root after copying env templates and setting secrets locally (never commit):

```bash
cp .env.example .env.local
cp web/.env.example web/.env.local   # optional; adjust NEXT_PUBLIC_* for local API
export JWT_SECRET="$(openssl rand -hex 32)"
export JWT_REFRESH_SECRET="$(openssl rand -hex 32)"
```

Confirm tracked env files only:

```bash
git ls-files '.env*' 'web/.env*'
# Expected: .env.example, web/.env.example
```

### Demo credentials (all roles)

| Role    | Email                     | Password   |
| ------- | ------------------------- | ---------- |
| Parent  | parent.demo@hasivu.local  | Hasivu123! |
| Admin   | admin.demo@hasivu.local   | Hasivu123! |
| Kitchen | kitchen.demo@hasivu.local | Hasivu123! |

Also seeded: `student.demo@hasivu.local`, `vendor.demo@hasivu.local` (same password).

| #   | Check                  | Command                                                                                      | Pass criteria                   |
| --- | ---------------------- | -------------------------------------------------------------------------------------------- | ------------------------------- |
| 1   | Backend type-check     | `npm run type-check`                                                                         | Exit 0                          |
| 2   | Frontend type-check    | `cd web && npm run type-check`                                                               | Exit 0                          |
| 3   | Backend unit tests     | `npm run test:unit`                                                                          | All suites green                |
| 4   | Required tests         | `npm run test:required`                                                                      | Pass                            |
| 5   | Frontend unit tests    | `cd web && npm test -- --passWithNoTests`                                                    | Pass                            |
| 6   | Frontend Docker build  | `cd web && npm run build:docker`                                                             | Uses Webpack; exit 0            |
| 7   | Playwright E2E (smoke) | `cd web && npx playwright test tests/e2e/login-order-pay.spec.ts --project="Desktop Chrome"` | Pass                            |
| 8   | Docker compose up      | `docker compose -f docker-compose.dev.yml up -d --build`                                     | All services healthy            |
| 9   | Health                 | `curl -fsS http://localhost:3000/health`                                                     | HTTP 200                        |
| 10  | Frontend status        | `curl -fsS http://localhost:3001/api/status`                                                 | HTTP 200                        |
| 11  | Smoke script           | `./scripts/smoke-local.sh`                                                                   | Exit 0                          |
| 12  | npm audit              | `npm audit --audit-level=moderate && cd web && npm audit --audit-level=moderate`             | 0 vulnerabilities               |
| 13  | Parent login           | Browser: `parent.demo@hasivu.local` / `Hasivu123!`                                           | Dashboard loads                 |
| 14  | Parent order           | Menu → cart → checkout                                                                       | Order completes (test Razorpay) |
| 15  | Kitchen flow           | `kitchen.demo@hasivu.local` / `Hasivu123!`                                                   | Kitchen management loads        |
| 16  | Admin flow             | `admin.demo@hasivu.local` / `Hasivu123!`                                                     | Admin dashboard loads           |
| 17  | RFID flow              | `/rfid-verification`                                                                         | Page loads, no 500              |
| 18  | Payment test           | Razorpay test keys in `.env.local`                                                           | Test payment path               |

## Evidence to attach

- Terminal output or CI run URL for rows 1–6
- Screenshot or log for Docker `ps` + health curls
- Short screen recording for login + order + kitchen (optional)

Store artifacts under `docs/delivery/evidence/` (gitignored) or attach to acceptance email.
