# Rollback Runbook

## Trigger Conditions

1. Health checks fail after deploy.
2. Auth flows fail (`401/500` spikes).
3. Payment flow failures regress materially.

## Immediate Actions

1. Stop rollout and notify on-call.
2. Trigger workflow rollback path in production pipeline.
3. Re-point service aliases to last known good versions (serverless path).
4. For VPS path, redeploy previous known-good image tags and re-run health checks.

## Data Safety

1. Do not run destructive migration rollbacks without DB snapshot verification.
2. Validate write paths are stable before re-opening traffic.
3. Prefer forward-fix migration for Supabase unless a validated backup restore window is approved.

## Verification

1. `/health` and `/api/health` pass.
2. Key auth endpoint works.
3. Error rate returns to baseline.
4. Hybrid parity smoke (`./scripts/smoke-hybrid.sh`) passes for both VPS and serverless targets.
