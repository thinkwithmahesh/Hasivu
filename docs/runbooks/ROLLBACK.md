# Rollback Runbook

## Trigger Conditions

1. Health checks fail after deploy.
2. Auth flows fail (`401/500` spikes).
3. Payment flow failures regress materially.

## Immediate Actions

1. Stop rollout and notify on-call.
2. Trigger workflow rollback path in production pipeline.
3. Re-point service aliases to last known good versions.

## Data Safety

1. Do not run destructive migration rollbacks without DB snapshot verification.
2. Validate write paths are stable before re-opening traffic.

## Verification

1. `/health` and `/api/health` pass.
2. Key auth endpoint works.
3. Error rate returns to baseline.
