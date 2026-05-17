# Raw SQL Audit — BMAD Blocker 2

**Date:** 2026-05-02 | **Agent:** Amelia (Security) + Winston (Architecture)

## Summary

- **Total `$queryRawUnsafe` call sites:** 18
- **Category A (already parameterized — SAFE):** 16
- **Category B (wrapper with guard added):** 2
- **Category C (string concat — DANGEROUS):** 0

## Category A — Already Parameterized (SAFE)

All enterprise functions use the `(query, ...params)` pattern with `$N` placeholders.
These are **safe** as-is — no user input is concatenated into the SQL string.

| #   | File                                                           | Line | Pattern                                               | Risk    |
| --- | -------------------------------------------------------------- | ---- | ----------------------------------------------------- | ------- |
| 1   | `src/functions/enterprise/multi-school-orchestrator.ts`        | 258  | `$queryRawUnsafe(countQuery, ...params.slice(0, -2))` | ✅ Safe |
| 2   | `src/functions/enterprise/multi-school-orchestrator.ts`        | 259  | `$queryRawUnsafe(dataQuery, ...params)`               | ✅ Safe |
| 3   | `src/functions/enterprise/multi-school-orchestrator.ts`        | 678  | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |
| 4   | `src/functions/enterprise/multi-school-orchestrator.ts`        | 740  | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |
| 5   | `src/functions/enterprise/school-hierarchy-manager.ts`         | 184  | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |
| 6   | `src/functions/enterprise/school-hierarchy-manager.ts`         | 432  | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |
| 7   | `src/functions/enterprise/school-hierarchy-manager.ts`         | 620  | `$queryRawUnsafe(countQuery, ...params.slice(0, -2))` | ✅ Safe |
| 8   | `src/functions/enterprise/school-hierarchy-manager.ts`         | 621  | `$queryRawUnsafe(dataQuery, ...params)`               | ✅ Safe |
| 9   | `src/functions/enterprise/school-hierarchy-manager.ts`         | 926  | `$queryRawUnsafe(countQuery, ...params.slice(0, -2))` | ✅ Safe |
| 10  | `src/functions/enterprise/school-hierarchy-manager.ts`         | 927  | `$queryRawUnsafe(dataQuery, ...params)`               | ✅ Safe |
| 11  | `src/functions/enterprise/school-hierarchy-manager.ts`         | 1040 | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |
| 12  | `src/functions/enterprise/cross-school-analytics.ts`           | 820  | `$queryRawUnsafe(baseQuery, ...params)`               | ✅ Safe |
| 13  | `src/functions/enterprise/enterprise-billing-consolidation.ts` | 768  | `$queryRawUnsafe(countQuery, ...params.slice(0, -2))` | ✅ Safe |
| 14  | `src/functions/enterprise/enterprise-billing-consolidation.ts` | 769  | `$queryRawUnsafe(dataQuery, ...params)`               | ✅ Safe |
| 15  | `src/functions/enterprise/enterprise-billing-consolidation.ts` | 1226 | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe |
| 16  | `src/functions/analytics/business-intelligence-aggregator.ts`  | 1048 | `$queryRawUnsafe(query, ...params)`                   | ✅ Safe (binds only); **2026-05-04:** SQL dialect fixed from SQLite `?`/`strftime` to PostgreSQL `$n`/`date_trunc` + `assertSafePostgresRawSql` |

## `Prisma.raw` on `DatabaseService` (Express + Lambda re-export path)

`src/services/database.service.ts` methods `query`, `queryRaw`, and `executeRaw` wrap `Prisma.raw(query)` with **runtime checks** from `src/utils/sql-raw-guards.ts`:

- Rejects obvious `; DROP|DELETE|…` multi-statement abuse.
- If any bind parameters are passed, the SQL string must contain PostgreSQL **`$1`-style** placeholders (same contract as order Lambdas using `database.query(...)`).

**HTTP exposure:** Yes, indirectly — Lambda order handlers and any future route that calls these methods must keep SQL as static strings with binds only.

## Category B — Wrapper with Guard (FIXED)

These are generic wrapper functions. Guards added to block multi-statement injection and warn on missing `$N` placeholders.

| #   | File                                        | Line | Status         |
| --- | ------------------------------------------- | ---- | -------------- |
| 17  | `src/database/DatabaseManager.ts`           | — | ✅ `assertSafePostgresRawSql` before `$queryRawUnsafe` |
| 18  | `src/services/analytics/query-execution.ts` | — | ✅ `assertSafePostgresRawSql` before `$queryRawUnsafe` |

## Category C — String Concatenation (DANGEROUS)

**None found.** All 18 call sites use parameterized patterns.

## Note on `$queryRaw` (tagged template — safe by design)

The remaining ~40 calls using `$queryRaw` with tagged template literals (backtick syntax) are safe by Prisma design — values are automatically parameterized. No action needed.

## BMAD-style external audit — cross-check (2026-05-04)

| Finding | Verified? | Notes |
| --- | --- | --- |
| Critical SQLi from `$queryRawUnsafe` in analytics | **Overstated** | `QueryExecutionService.executeRawQuery` requires `ALLOW_UNSAFE_RAW_SQL=true`; BI aggregation uses `$N` binds + Zod enums for dimensions/measures. |
| BI aggregator unsafe | **Partially true (bug, not classic SQLi)** | Query used **SQLite** `?` and `strftime` against **PostgreSQL** — would fail or mis-bind at runtime; remediated to `$n`, `date_trunc`, typed casts, and `assertSafePostgresRawSql`. |
| Default Lambda 512 MB | **True** | `serverless.yml` `provider.memorySize: 512` — tune per function / enable pooling (Accelerate or RDS Proxy) under load; see `docs/performance/LUNCH_PEAK_LOAD_TEST.md`. |
| `TEST_COVERAGE_REPORT.md` ~0.44% lines | **Stale headline** | Denominator is entire `src/` tree; **`npm run test:unit`** is green on a focused suite set — use coverage scoped to critical paths for meaningful %, or regenerate report after `npm run test:coverage`. |
| Compound `Order` index | **Valid gap** | Added `@@index([schoolId, status, deliveryDate])` + migration `20260504183000_order_school_status_delivery_idx`. |
| `setup:complete` runs `db:migrate` | **True** | First-time / env bootstrap script; production should run migrations as a **separate** controlled step (already noted in readiness plan). |

## Conclusion

**Risk level after audit: LOW.** Raw SQL uses PostgreSQL `$N` parameterization where values are passed; generic wrappers call **`assertSafePostgresRawSql`**. Re-run **jcodemunch** / ripgrep after refactors touching raw SQL.
