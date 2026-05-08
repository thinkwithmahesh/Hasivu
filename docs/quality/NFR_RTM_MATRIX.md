# NFR → owner → verification (RTM)

Living matrix for **non-functional requirements** from `docs/PRODUCTION_READINESS_100_PLAN.md`. Update when scope or owners change.

| NFR (concise) | Owner | Verification artifact | Status (repo) |
|----------------|-------|-------------------------|---------------|
| **Postgres migrations** — single provider, CI `migrate deploy` | Eng | `prisma/migration_lock.toml`, `.github/workflows` integration job, `prisma/README.md` | Done |
| **Secrets** — no placeholders in prod-like paths; rotation path | Eng + Ops | `docker-compose.dev.yml` required vars, `env.assertProductionSafe()` (`src/app.ts`), `docs/runbooks/SECRETS_ROTATION.md` | Repo done; prod wiring external |
| **Raw SQL safety** — parameterized, guarded paths | Eng | `docs/security/raw-sql-audit.md`, `assertSafePostgresRawSql`, `tests/unit/utils/sql-raw-guards.test.ts` | Done |
| **AuthZ on mutations** — routes match matrix | Eng | `docs/security/ROUTE_AUTHZ_MATRIX.md` vs `src/app.ts` mounts | Baseline done; extend per new route |
| **CI truth** — lint, typecheck, unit, integration, a11y | Eng | `.github/workflows/ci-cd.yml`, `npm run test:unit` trend | Unit suite remediation in progress (`docs/quality/CI_UNIT_TEST_REMEDIATION.md`) |
| **Dependency hygiene** — audit gate + policy | Eng | `docs/security/DEPENDENCY_AUDIT_POLICY.md`, `npm run audit:prod-critical`, Dependabot | Done |
| **WCAG / a11y** — automated gate | Eng + Design | `accessibility-tests` CI job, `docs/quality/WCAG_2_1_AA_BACKLOG.md` | Jest gate done |
| **Performance / load** — lunch peak evidence | Eng | `docs/performance/LUNCH_PEAK_LOAD_TEST.md`, `docs/performance/evidence/` (run logs + SHA) | Evidence when run |
| **Observability** — staging Sentry + alerts | Eng + Ops | `docs/runbooks/OBSERVABILITY.md` checklist | Verify per env |
| **i18n** (Kannada/Hindi if in PRD) | Product + Eng | ADR or defer line in `PRODUCTION_READINESS_100_PLAN.md` | Decision pending (T5) |

### How to use

1. For each **MUST** NFR, keep **Owner** and **Verification artifact** non-empty before calling “100%” for that row.  
2. Link **PRs** or **run URLs** in the artifact column when useful (optional).  
3. Reconcile with **PRD shards** under `docs/prd/` when acceptance criteria land (SHOULD #7).
