# Incident Response Runbook

## Severity Definitions

- Sev-1: Platform unavailable or data integrity risk.
- Sev-2: Major user-impacting degradation.
- Sev-3: Minor degradation or isolated defect.

## First 15 Minutes

1. Acknowledge incident.
2. Assign incident commander.
3. Freeze deploys.
4. Capture blast radius and impacted endpoints.

## Investigation Checklist

1. Check deploy logs.
2. Check backend health and auth middleware errors.
3. Check DB and Redis connectivity.
4. Confirm secret rotation or credential expiry issues.

## Containment

1. Roll back if production instability persists.
2. Disable non-critical integrations if needed.

## Closure

1. Publish incident summary.
2. Add follow-up tasks with owners and deadlines.
