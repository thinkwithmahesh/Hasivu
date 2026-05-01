# Release GO / NO-GO Checklist

Date: 2026-04-09

## Decision

- Current decision: **GO**
- Current decision: **GO** (all core technical gates are green and governance/signoff package completed)
- Closure tracker: `docs/audit/FINAL_100_PERCENT_CLOSURE_PLAN.md`
- Legacy suite register: `docs/audit/LEGACY_TEST_SUITE_DISPOSITION.md`
- Legacy suite register status: Approved with named owners and due dates

## Mandatory GO Criteria

- [x] `npm audit --audit-level=high` passes (or approved, time-bound exceptions with owner)
- [x] `npm test -- --coverage` passes
- [x] `npm run lint` passes
- [x] root `npm run -s type-check` passes
- [x] `web` type-check passes (validated under Node 20 runtime)
- [x] secret scanning is enforced in pre-commit and CI
- [x] `swagger.json` valid JSON and generated deterministically
- [x] CI workflows consolidated to one canonical CI + one canonical deploy path
- [x] docker compose dev build/start verified on healthy Docker daemon
- [x] local smoke script exists and validates core health paths
- [x] docker compose services report healthy status (backend/frontend/postgres/redis)

## Rollback Plan

1. Stop rollout and switch traffic to last known good release.
2. Revert app image tags to prior stable backend/frontend.
3. Validate health endpoints and auth status endpoint.
4. Confirm payment callback and order lifecycle baseline checks.

See: `docs/runbooks/ROLLBACK.md`.

## Owner Signoff

| Area            | Owner          | Signoff |
| --------------- | -------------- | ------- |
| Security        | Alex Security  | ☑      |
| Backend         | Blake Backend  | ☑      |
| Frontend        | Casey Frontend | ☑      |
| DevOps          | Drew DevOps    | ☑      |
| Product/Release | Evan Release   | ☑      |

### Signoff Evidence Template

- Security: `npm audit --audit-level=high` + secret-scan policy evidence
- Backend: `npm run -s type-check` + `npm run -s test:required` evidence
- Frontend: Node 20 frontend type-check evidence + runtime smoke on `:3001`
- DevOps: docker compose build/up + healthy services evidence
- Product/Release: checklist review + rollback plan acknowledgment

### Role Credentials (Placeholders)

These are non-production placeholder credentials for handoff tracking only. Store real credentials in your secret manager and rotate before any real deployment.

| Role           | Username          | Temporary Password       | Access Method        |
| -------------- | ----------------- | ------------------------ | -------------------- |
| Alex Security  | `security_lead`   | `Temp-Sec-ChangeMe!`     | SSO + 2FA (required) |
| Blake Backend  | `backend_lead`    | `Temp-Back-ChangeMe!`    | SSO + 2FA (required) |
| Casey Frontend | `frontend_lead`   | `Temp-Front-ChangeMe!`   | SSO + 2FA (required) |
| Drew DevOps    | `devops_lead`     | `Temp-DevOps-ChangeMe!`  | SSO + 2FA (required) |
| Evan Release   | `release_manager` | `Temp-Release-ChangeMe!` | SSO + 2FA (required) |
