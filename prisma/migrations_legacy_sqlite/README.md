# Legacy SQLite migration history (archived)

These SQL files were generated when the project used **SQLite** as the Prisma migration provider (`migration_lock.toml` previously declared `sqlite`). The live `schema.prisma` targets **PostgreSQL** only.

They are **kept for audit and archaeology** — they are **not** applied by `prisma migrate deploy`.

## Current path

- Production and CI use **`prisma/migrations/`** with `provider = "postgresql"` in `migration_lock.toml`.
- Baseline: `prisma/migrations/20260204120000_postgresql_baseline/migration.sql` (generated from `prisma migrate diff --from-empty --to-schema-datamodel`).

## Contents

| Path | Note |
|------|------|
| `20250921123942_init/` … `20260501120000_add_order_assignment/` | Historical incremental migrations (SQLite DDL). |
| `001_vendor_marketplace.sql` | Standalone SQL reference (never a Prisma-versioned migration folder); vendor marketplace DDL for Postgres-style types — apply manually only if product requires those tables and they are not in `schema.prisma`. |
