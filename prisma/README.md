# Prisma — migrations and PostgreSQL

## Current state

- `schema.prisma` targets **PostgreSQL**.
- `migrations/migration_lock.toml` may still declare **`sqlite`** from an older history — that blocks `prisma migrate deploy` on PostgreSQL (provider mismatch).

## Paths to 100% readiness

1. **Baseline (recommended for production):** create a **new** PostgreSQL migration history (squash/baseline) that matches the current schema, replace or archive legacy sqlite-oriented SQL, set `migration_lock.toml` to `postgresql`, and validate `migrate deploy` on a fresh database in CI.
2. **Interim (dev only):** `prisma db push` when `USE_PRISMA_DB_PUSH=true` in `scripts/docker-backend-entrypoint.sh` — **not** a substitute for versioned migrations in production. Default dev compose uses **`migrate deploy`** (`USE_PRISMA_DB_PUSH=false`).

See `docs/PRODUCTION_READINESS_100_PLAN.md` MUST item #1.
