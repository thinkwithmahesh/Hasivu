# Lambda Memory + DB Pooling Plan

## Why this exists

`serverless.yml` currently sets `provider.memorySize: 512` for all functions. That is safe as a baseline, but it is not ideal for mixed workloads (auth vs analytics vs billing jobs). This plan defines a staged tuning approach instead of a blind global bump.

## Current verified state

- Global Lambda baseline: `512 MB` (`serverless.yml` provider block).
- Runtime: `nodejs18.x`, `arm64`, timeout `30s`.
- DB URL comes from SSM as `DATABASE_URL`.
- Production env template includes pooled/direct Supabase URLs and `pgbouncer=true` in `DIRECT_DATABASE_URL` example (`.env.production.example`).

## Decision

1. Keep `512 MB` as **default** for light handlers.
2. Introduce **per-function overrides** for heavy handlers only.
3. Ensure runtime database connections use a pooling endpoint in production.

## Recommended memory tiers

- **Tier A (512 MB):** health/auth/read-only lightweight handlers.
- **Tier B (1024 MB):** order/payment mutation handlers and webhook processing.
- **Tier C (1536–2048 MB):** heavy analytics/report generation, batch/billing automation.

> Note: in Lambda, higher memory also increases CPU share; this can reduce p95 latency and duration for CPU-heavy codepaths.

## Pooling policy

- Production/staging must use pooled connection string for runtime traffic.
- Migrations should continue using direct DB URL (existing deploy scripts already separate migrate/runtime paths).
- Add deployment check that fails if runtime `DATABASE_URL` is non-pooled in production.

## Rollout plan (safe sequence)

1. **Instrument**: collect p95/p99 + duration + error metrics for current baseline.
2. **Canary 1**: raise memory for payment/order hot paths only; compare one-day metrics.
3. **Canary 2**: raise analytics/batch handlers if still CPU-bound.
4. **Finalize**: keep default 512 where no measurable gain exists.

## Exit criteria

- p95 latency improvement on targeted endpoints without increased error rate.
- No DB connection exhaustion under lunch-peak load runs.
- Cost delta documented alongside latency improvements.

## Follow-up implementation tickets

- Add per-function `memorySize` overrides in `serverless.yml`.
- Add CI/deploy validator to assert pooled runtime DB URL in production.
- Attach metrics snapshots in `docs/performance/evidence/`.

## Implementation progress (2026-05-05)

- Added pooling runtime check to `src/scripts/production-readiness-check.ts` (`Database Pooling` warning in production-like envs when runtime URL is not pooler-compatible).
- Added per-function memory overrides in `serverless.yml`:
  - `payments-advanced` -> `1024`
  - `payments-retry` -> `1024`
  - `payments-webhook-handler` -> `1024`
- Canary evidence captured in `docs/performance/evidence/`:
  - burst profile showed limiter throttling (`429`)
  - controlled canary profile reached `100%` success with `p95=14ms` on `/health`
- Remaining for closure: repeat canary against staging/preview URL and attach comparable endpoint metrics.
