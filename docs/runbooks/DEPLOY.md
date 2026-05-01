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

## Production Deploy

1. Use `.github/workflows/production-deployment.yml`.
2. Confirm environment secrets are set in GitHub Actions.
3. Ensure `secret-scan.yml` and CI checks pass before deployment.

## Post Deploy Validation

1. Health:
   - `/health`
   - `/api/health`
2. Auth smoke:
   - `POST /api/auth/validate-password`
3. User-facing app loads from frontend URL.
