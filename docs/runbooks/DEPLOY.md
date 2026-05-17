# Deploy Runbook

## Goal

Deploy backend/frontend safely with auditable pre-checks and rollback readiness.

## Preconditions

1. `npm run lint` passes.
2. `npm run type-check` passes.
3. `npm test -- --coverage` passes.
4. `npm audit --audit-level=high` passes or approved exceptions documented.

## Local Docker Deploy (Dev)

```bash
docker compose -f docker-compose.dev.yml up --build -d
./scripts/smoke-local.sh
```

## Production Deploy (Hybrid)

### VPS Path (Docker + Supabase)

1. Prepare `.env.production` with:
   - `DATABASE_URL` (Supabase pooled URL)
   - `DIRECT_DATABASE_URL` (Supabase direct URL)
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`
2. Run:

```bash
./scripts/deploy-vps.sh .env.production
```

3. Validate:
   - `curl -fsS http://localhost/health`
   - `curl -fsS http://localhost/api/health`

### Serverless Path (AWS + Supabase)

1. Use the main CI deployment workflow.
2. Confirm environment secrets are set in GitHub Actions.
3. Ensure security + CI checks pass before deployment.
4. Deploy serverless stage and run staged smoke checks.

## Post Deploy Validation

1. Health:
   - `/health`
   - `/api/health`
2. Auth smoke:
   - `POST /api/auth/validate-password`
3. User-facing app loads from frontend URL.
4. Hybrid parity:

```bash
VPS_BASE_URL=https://api-staging.hasivu.com \
SERVERLESS_BASE_URL=https://<stage>.execute-api.ap-south-1.amazonaws.com/staging \
./scripts/smoke-hybrid.sh
```

## Go/No-Go Artifact

Before production go-live, complete:

- `docs/release/GO_NO_GO_SCORECARD.md`
