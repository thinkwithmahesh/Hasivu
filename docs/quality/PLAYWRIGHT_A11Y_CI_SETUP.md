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
