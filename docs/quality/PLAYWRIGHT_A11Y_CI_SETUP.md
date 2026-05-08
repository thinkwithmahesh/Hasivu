# Playwright A11y CI Setup (Preview/Staging)

This runbook closes T4 in the production readiness plan.

## Prerequisites

1. The workflow file exists in the target branch:
   - `.github/workflows/playwright-a11y-preview.yml`
2. Repository secret is configured:
   - `PLAYWRIGHT_BASE_URL` = reachable staging/preview web URL
     - Example: `https://staging.hasivu.com`

## One-time setup

```bash
# In repo root
gh secret set PLAYWRIGHT_BASE_URL --repo thinkwithmahesh/Hasivu --body "https://staging.hasivu.com"
```

## Trigger and verify

```bash
# Trigger manually
gh workflow run "Playwright A11y (Preview/Staging)" --repo thinkwithmahesh/Hasivu

# Watch latest runs
gh run list --workflow "Playwright A11y (Preview/Staging)" --repo thinkwithmahesh/Hasivu --limit 5
```

Success criteria:

- workflow run status is `completed` + `success`
- artifact `playwright-a11y-preview-report` uploaded
- T4 can be marked complete in `docs/PRODUCTION_READINESS_100_PLAN.md`

## Troubleshooting (current known blocker)

If the job fails with:

- `Error: App not reachable at <PLAYWRIGHT_BASE_URL>. Is the stack running?`

Then the configured URL is not reachable from GitHub-hosted runners (common causes: private DNS, VPN-only ingress, IP allowlist, or sleeping preview deployment).

Quick checks:

1. Ensure `PLAYWRIGHT_BASE_URL` points to a public HTTPS host (no localhost/private domain).
2. Confirm `https://<host>/` returns a normal HTML response from a clean network.
3. Re-run:

```bash
gh workflow run "Playwright A11y (Preview/Staging)" --repo thinkwithmahesh/Hasivu --ref main
```

Recent failed runs for reference: `25389929398`, `25390062318`.
