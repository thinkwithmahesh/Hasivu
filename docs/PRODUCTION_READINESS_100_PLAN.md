# Production Readiness → 100% — Master Plan

This document turns the BMAD-style assessment into an **executable backlog**. “100%” means: **all MUST items closed with evidence**, **all SHOULD items scheduled**, and **COULD/WON’T explicitly accepted or deferred** with sign-off.

## Verification log (jcodemunch + graphify)

Use this section as the **evidence trail** when someone asks “did we reindex / verify?”

| Check                                                                                    | Result (latest)                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **jcodemunch `resolve_repo`** on `/Users/mahesha/Downloads/hasivu-platform`              | **`local/hasivu-platform-f501c264`**, indexed, **~1 118 files**, **~19 404 symbols** (per MCP response).                                                                                                                                                                                                                    |
| **jcodemunch `index_folder`** (incremental, `use_ai_summaries: false`)                   | **2026-05-05:** “No changes detected” when tree already synced; run again after large merges.                                                                                                                                                                                                                               |
| **jcodemunch `search_text`** — `prisma migrate deploy`                                   | Hits **`tests/setup-integration.ts`**, **`scripts/docker-backend-entrypoint.sh`**, **`scripts/deploy.sh`**, **`scripts/deploy-vps.sh`**, etc. **Limitation:** pattern `file_pattern: .github/workflows/*.yml` returned **0 files** in this index — **always confirm CI YAML with ripgrep/read_file**, not jcodemunch alone. |
| **Filesystem**                                                                           | `prisma/migrations/migration_lock.toml` → **`provider = "postgresql"`**; exactly **one** versioned migration dir: `20260204120000_postgresql_baseline/migration.sql`.                                                                                                                                                       |
| **graphify** (`graphify query "production readiness migrations secrets"` from repo root) | BFS hit **`src/scripts/production-readiness-check.ts`** (`ProductionReadinessChecker`) and related nodes — use **`graphify-out/graph.json`** + **`GRAPH_REPORT.md`** for cross-cutting discovery; re-run **`graphify … --update`** after major doc/code churn.                                                              |
| **BMAD-style audit (2026-05-04)**                                                        | Claims cross-checked against code + **`docs/security/raw-sql-audit.md`**. **SQLi “critical”** on analytics paths was **overstated** (guards + env gate); **BI aggregator** had a **real PostgreSQL vs SQLite dialect bug** (fixed). See raw-sql audit **BMAD-style external audit** table.                                  |

## Definition of done (scorecard)

| Pillar       | 100% means                                                                                                                                   |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| PRD / docs   | Sharded PRD index matches files; each FR/NFR has owner + verification artifact (test, runbook, or dashboard).                                |
| Architecture | Single source of truth for **Postgres migrations** (no sqlite lock mismatch); Express vs Lambda boundaries documented.                       |
| Security     | No placeholder secrets in prod-like envs; **no unguarded raw SQL** from user input; `npm audit` gate in CI with waiver process.              |
| Performance  | Baseline load test + top 10 slow queries addressed or waived with SLO rationale.                                                             |
| QA           | Coverage policy matches reality (or tests added); critical journeys have E2E + integration tests.                                            |
| DevOps       | Migrations + rollback tested; secrets from SSM/Secrets Manager in prod; observability runbook (`docs/runbooks/OBSERVABILITY.md`) + alerts.   |
| UX / a11y    | WCAG scope agreed; **Jest a11y gate in CI** + manual checklist (`docs/quality/WCAG_2_1_AA_BACKLOG.md`); Playwright a11y smoke optional next. |

## MoSCoW backlog (living)

### MUST (blocking “production”)

1. **Postgres migration integrity** — **Done:** `migration_lock.toml` → PostgreSQL; baseline migration + `migrate deploy` in CI integration job; legacy SQL under `prisma/migrations_legacy_sqlite/`. See `prisma/README.md`.
2. **Secrets** — **Done (repo):** `docker-compose.dev.yml` uses `${JWT_SECRET:?…}` / `${JWT_REFRESH_SECRET:?…}`; `env.assertProductionSafe()` on Express startup (`src/app.ts`); rotation in `docs/runbooks/SECRETS_ROTATION.md`. **Prod:** wire secrets only via SSM / GitHub Environments (not committed).
3. **Raw SQL attack surface** — **Done (repo):** `docs/security/raw-sql-audit.md`; `assertSafePostgresRawSql` on `DatabaseService` `query` / `queryRaw` / `executeRaw`; tests `tests/unit/utils/sql-raw-guards.test.ts`. Re-scan with **jcodemunch** `search_text` after refactors.
4. **AuthZ on mutations** — **Done (baseline):** `docs/security/ROUTE_AUTHZ_MATRIX.md` aligned with mounted Express routes (`src/app.ts`). **Ongoing:** add matrix rows + tests whenever a new state-changing route ships.

### SHOULD (first sprint after MUST)

5. **CI truth** — **In progress:** workflow runs lint, typecheck, unit, integration, **accessibility-tests**, e2e (conditional), coverage upload. **`npm run test:unit`:** green (26 suites); see `docs/quality/CI_UNIT_TEST_REMEDIATION.md`. **Gap:** keep **`main` green** on integration/e2e and watch regressions.
6. **Dependency hygiene** — **Done:** `docs/security/DEPENDENCY_AUDIT_POLICY.md`, `npm run audit:prod-critical`, Dependabot (`.github/dependabot.yml`), CI gate + JSON artifacts. Use **graphify** corpus report + **jcodemunch** `index_folder` / `search_text` before major dependency surgery.
7. **Epic / PRD hygiene** — **Done (baseline):** `docs/prd/README.md` links resolve (epic stubs + handoff stub). **Gap:** replace stubs with acceptance criteria + RTM.
8. **Express vs Serverless map** — **Done:** `docs/architecture/RUNTIME_ROUTE_MAP.md`.

### COULD (next quarter)

9. **WCAG 2.1 AA** — **Jest gate done:** CI job `accessibility-tests` blocks `build`; checklist `docs/quality/WCAG_2_1_AA_BACKLOG.md`. **Next:** Playwright a11y on **staging/preview URL** + signed manual audit sample.
10. **Load test** — **Doc:** `docs/performance/LUNCH_PEAK_LOAD_TEST.md` + existing `npm run test:load:*` scripts; capture evidence when run.
11. **i18n** — **Deferred (post-MVP):** Kannada/Hindi remain out of scope until product restarts localization; app copy and SEO stay **English-first** (currency already **INR** in web). Revisit when PRD explicitly schedules locale packs + `next-intl` (or equivalent) ownership.

### WON’T (explicit deferral)

12. **Full microservice split** — Unless business resets scope; document “modular monolith” decision in ADR (`docs/architecture/adr/0001-modular-monolith.md`).

## Executable todo list (next 2–4 weeks)

| #   | Task                                                                                                     | Owner     | Done when                                                                                                                                                                                                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | **CI green:** fix or quarantine failing `npm run test:unit` (policy in doc if quarantined).              | Eng       | `unit-tests` job green on `main`. **Status (2026-05-04):** `npm run test:unit` — **26/26 suites**, 293 tests; see `docs/quality/CI_UNIT_TEST_REMEDIATION.md`.                                                                                                                                                                                                                      |
| T2  | **NFR / RTM grid:** one table — NFR → owner → verification artifact (test, dashboard, runbook).          | PM + Eng  | **`docs/quality/NFR_RTM_MATRIX.md`** (living); extend rows as NFRs split.                                                                                                                                                                                                                                                                                                          |
| T3  | **Load evidence:** one run per `docs/performance/LUNCH_PEAK_LOAD_TEST.md`; attach log + SHA.             | Eng       | **In progress:** local docker evidence captured (`load-2026-05-05T15-37-31-918Z.*`, `load-2026-05-05T15-50-21-927Z.*`); staging/prod-like run still blocked by DNS resolution to `app.hasivu.com` from current environment.                                                                                                                                                        |
| T4  | **Playwright a11y** job against **preview/staging** URL (non-blocking → blocking).                       | Eng       | **In progress (workflow fixed; external URL reachability blocker):** latest run `25390435855` now fails fast at preflight with "PLAYWRIGHT_BASE_URL is not reachable from this runner" (earlier runs `25389929398`, `25390062318`). Next: point secret to a publicly reachable preview/staging host, then rerun to green. Setup guide: `docs/quality/PLAYWRIGHT_A11Y_CI_SETUP.md`. |
| T5  | **i18n decision:** in-scope roadmap or explicit **defer** line in this doc.                              | Product   | **Done (defer):** COULD #11 + this row — English-first until localization is scheduled; no separate ADR required unless scope changes.                                                                                                                                                                                                                                             |
| T6  | **jcodemunch** `index_folder` after each **large** merge; **graphify `--update`** monthly or on release. | Eng       | Dated row added under Verification log.                                                                                                                                                                                                                                                                                                                                            |
| T7  | **Prod observability:** staging Sentry test event + alert destination verified.                          | Eng + Ops | Recorded in `docs/runbooks/OBSERVABILITY.md` checklist.                                                                                                                                                                                                                                                                                                                            |
| T8  | **Lambda memory + DB pooling review:** tiered memory strategy + pooled runtime DB policy.                | Eng       | Baseline doc at `docs/performance/LAMBDA_MEMORY_POOLING_PLAN.md`; implement per-function overrides + canary evidence before closure.                                                                                                                                                                                                                                               |

## How to use jcodemunch on each task

- `resolve_repo` with repo path (already indexed: `local/hasivu-platform-f501c264`).
- `find_references` / `search_symbols` / `search_text` for blast radius before changing auth, SQL, or orders.
- `get_blast_radius` (if configured) before large refactors.

## Immediate next steps (this week)

1. **MUST #1 (done in repo):** PostgreSQL baseline migration `20260204120000_postgresql_baseline`, `migration_lock.toml` → `postgresql`, legacy SQL under `prisma/migrations_legacy_sqlite/`, CI integration job uses `prisma migrate deploy`.
2. **MUST #2 (done in repo):** Compose requires `JWT_SECRET` / `JWT_REFRESH_SECRET`; production startup calls `env.assertProductionSafe()`; runbook updated (`docs/runbooks/SECRETS_ROTATION.md`).
3. **MUST #3 (done in repo):** `docs/security/raw-sql-audit.md` + `assertSafePostgresRawSql` on `DatabaseService` `query` / `queryRaw` / `executeRaw` + unit tests (`tests/unit/utils/sql-raw-guards.test.ts`).
4. **MUST #4 (baseline done):** `docs/security/ROUTE_AUTHZ_MATRIX.md` + Express mounts in `src/app.ts` — re-verify when adding routes.
