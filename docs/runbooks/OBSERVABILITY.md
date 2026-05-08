# Observability — errors, metrics, alerts

## Error reporting (Sentry)

### Rules

1. **Never commit** a real DSN or auth token. Examples in templates must stay obviously fake (`https://xxxxxxxxxx@sentry.io/...`).
2. **Production** values come from the deployment environment (e.g. GitHub Actions secrets → `NEXT_PUBLIC_SENTRY_DSN`, or container env — see `docker-compose.prod.yml`).
3. Client-side capture is optional; `UnifiedErrorBoundary` checks for `window.Sentry` when present (`web/src/components/error-boundary/UnifiedErrorBoundary.tsx`).

### Verification before go-live

- [ ] `NEXT_PUBLIC_SENTRY_DSN` (or server `SENTRY_DSN`) set in the **staging** environment and one test error appears in the correct Sentry project.
- [ ] Release tracking (release name / dist) matches your deploy tag if you use source maps.
- [ ] PII scrubbing rules reviewed (auth cookies, child names) per policy.

## Metrics and dashboards

- **API:** expose structured logs (JSON) and scrape or ship to your log stack (CloudWatch, Datadog, etc.) — align with `docs/architecture/RUNTIME_ROUTE_MAP.md` so each runtime knows where logs originate.
- **DB / Redis:** use managed metrics (connections, slow query log, eviction).

## Alert routing

- Define **on-call** and **severity** (paging vs email) for: 5xx spike, DB connection exhaustion, queue depth, payment webhook failures.
- Document webhook URLs in the secret manager (e.g. Slack) — not in git.

## Related

- `docs/runbooks/SECRETS_ROTATION.md`
- `docs/PRODUCTION_READINESS_100_PLAN.md` (DevOps / observability pillar)
