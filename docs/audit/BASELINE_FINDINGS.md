# Baseline Findings (As-Built Truth)

Date: 2026-04-09

## Scope

Initial production-readiness lock before remediation. This records current repository state and known blockers discovered during command and code audit.

## Baseline Critical Findings

1. Secret hygiene failure
   - Tracked non-template env files existed in git history and index.
   - Concrete secret-like values present in root `.env` (workspace local file).
2. Dependency vulnerability overload
   - `npm audit --audit-level=moderate` reports 91 vulnerabilities (3 critical, 68 high).
3. Test gate broken
   - `npm test -- --coverage` fails due to Jest ESM parsing and multiple failing suites.
4. API contract artifact invalid
   - `swagger.json` is not valid JSON.
5. Architecture documentation drift
   - `docs/architecture.md` claims serverless/Turborepo/Fastify/React Native while implemented runtime is Express + Next.js.

## Baseline High Findings

1. Frontend API client stub throws at runtime:
   - `web/src/lib/api/client.ts`
2. CI and workflow sprawl:
   - multiple overlapping pipelines with partially duplicated concerns.
3. Docker reproducibility risk:
   - compose defaults include development-mode runtime values and broad build context.

## Immediate Baseline Lock Actions Completed

1. Removed tracked non-template env files from repository working tree:
   - `.env.integration`, `.env.local`, `.env.master`, `.env.production`, `.env.secrets`, `.env.staging`, `.env.test`
   - `web/.env.development`, `web/.env.india`, `web/.env.local`, `web/.env.production`, `web/.env.staging`
2. Hardened `.gitignore` for env files:
   - ignore all `.env*` and `web/.env*` except approved templates
3. Added secret scanning enforcement:
   - script: `scripts/secret-scan.js`
   - npm script: `security:secrets:scan`
   - pre-commit hook runs secret scan
   - CI workflow: `.github/workflows/secret-scan.yml`
