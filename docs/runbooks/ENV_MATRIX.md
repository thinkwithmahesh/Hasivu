# Environment Matrix (Hybrid Runtime)

## Canonical Targets

| Environment           | Runtime                            | Host                     | Database                 | Migration URL                 | Smoke Command                                                        |
| --------------------- | ---------------------------------- | ------------------------ | ------------------------ | ----------------------------- | -------------------------------------------------------------------- |
| Local Docker          | Express + Next (containers)        | `docker-compose.dev.yml` | Local Postgres container | `DIRECT_DATABASE_URL` (local) | `./scripts/smoke-local.sh`                                           |
| Staging VPS           | Express + Next (containers on VPS) | VPS + Caddy              | Supabase Postgres        | Supabase direct URL           | `VPS_BASE_URL=... SERVERLESS_BASE_URL=... ./scripts/smoke-hybrid.sh` |
| Production VPS        | Express + Next (containers on VPS) | VPS + Caddy              | Supabase Postgres        | Supabase direct URL           | `./scripts/smoke-hybrid.sh` against prod endpoints                   |
| Staging Serverless    | Lambda/API Gateway                 | AWS                      | Supabase Postgres        | Supabase direct URL           | `./scripts/smoke-hybrid.sh`                                          |
| Production Serverless | Lambda/API Gateway                 | AWS                      | Supabase Postgres        | Supabase direct URL           | `./scripts/smoke-hybrid.sh`                                          |

## Required Shared Variables

- `DATABASE_URL` (pooled Supabase URL for app runtime)
- `DIRECT_DATABASE_URL` (direct Supabase URL for migrations)
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `CORS_ORIGINS`
- `NEXT_PUBLIC_API_URL`

## Release Rule

A release is eligible only when both staging targets (VPS + serverless) pass smoke and required gates.
