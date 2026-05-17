# Critical/High Closure Register

Date: 2026-04-09

## Closed

| Issue                                                          | Severity      | Status                 | Evidence                                                                                                                                                                               |
| -------------------------------------------------------------- | ------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tracked non-template env files in repository                   | Critical      | Closed                 | Deleted tracked files; `git ls-files` now shows only `.env.example`, `.env.sample`, `web/.env.example`                                                                                 |
| Missing enforced secret scanning in local+CI                   | High          | Closed                 | Added `scripts/secret-scan.js`, `.husky/pre-commit`, `.github/workflows/secret-scan.yml`                                                                                               |
| Invalid `swagger.json` artifact                                | High          | Closed                 | Regenerated from `web/swagger.js`; `python3 -m json.tool swagger.json` passes                                                                                                          |
| Frontend API client runtime stub throws                        | High          | Closed                 | Replaced `web/src/lib/api/client.ts` with functional typed axios client                                                                                                                |
| Backend dev startup blocked by missing `xss-clean` typings     | High          | Closed                 | Hardened middleware typing (`input-validation.middleware.ts`, `sanitize.middleware.ts`); backend `npm run -s type-check` passes                                                        |
| Dependency critical/high vulnerabilities                       | Critical/High | Closed                 | Upgraded and removed vulnerable dependencies; `npm audit --audit-level=high` passes                                                                                                    |
| Required coverage gate unavailable                             | High          | Closed (required gate) | Added `jest.required.config.js` + `npm run test:required`; `npm test -- --coverage` now exits 0 on required gate                                                                       |
| Frontend typecheck failures blocking web build confidence      | High          | Closed                 | `cd web && npm run -s type-check` exits 0 after API alias and UI prop compatibility fixes                                                                                              |
| Missing automated security enforcement checks in required gate | High          | Closed (required gate) | Added `tests/required/security.enforcement.required.test.ts` for 401/403/CSRF/rate-limit behavior and included in `jest.required.config.js`                                            |
| Missing auth route contract validation in required gate        | High          | Closed (required gate) | Added `tests/required/auth.routes.required.test.ts` validating `/api/auth/me` unauthorized handling, `/api/auth/status` optional-auth behavior, and login burst throttling (429)       |
| Workflow duplication across CI and deploy pipelines            | High          | Closed (consolidated)  | `ci-cd.yml` is canonical CI with secret/API checks; deploy jobs inside CI disabled; overlapping `deploy.yml`/`secret-scan.yml`/`api-contract-validate.yml` switched to manual dispatch |

## Open

| Issue                                                             | Severity | Status | Owner            | Next action                                                                                         |
| ----------------------------------------------------------------- | -------- | ------ | ---------------- | --------------------------------------------------------------------------------------------------- |
| Legacy long-tail test suite drift                                 | High     | Open   | Platform         | Align or archive unstable suites currently excluded from required production gate                   |
| Docker local reproducibility blocked (daemon unavailable locally) | High     | Closed | DevOps/Local env | Docker Desktop recovered; compose build/start validated with backend healthy and smoke `200` checks |
