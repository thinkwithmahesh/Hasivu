# Hasivu Production Dirty Tree Cleanup Plan

**Status:** Active release-engineering plan  
**Goal:** Move the repository from a large dirty tree to production-ready, reviewable, reversible commits without losing user work.

## Current Risk Snapshot

- Dirty paths: approximately 190
- GitNexus changed symbols: 737
- GitNexus affected execution flows: 42
- GitNexus risk: CRITICAL if merged as one batch
- jcodemunch status: healthy, incremental indexing works

## Cleanup Rule

Do not use `git add -A` for this phase. Every commit must be lane-scoped, independently reviewed, and followed by the relevant verification gate.

## Lane 0: Local Noise

**Scope**

- `.DS_Store`
- `docs/.DS_Store`
- local scratch folders such as `.gemini-scratch/`

**Action**

- Remove from tracking if tracked.
- Add ignore rules if missing.
- Do not mix with application changes.

**Verification**

- `git status --short`
- Confirm no source files included in the same commit.

## Lane 1: Release Documentation And Agent Metadata

**Scope**

- `AGENTS.md`
- `claude.md`
- release/readiness docs
- as-built UI/UX docs

**Action**

- Review for accuracy.
- Commit as documentation only.

**Verification**

- Markdown renders.
- No production claims without matching evidence.

## Lane 2: Backend Canonical Services

**Scope**

- `src/services/*.ts`
- `src/services/analytics/*.ts`
- `src/app.ts`
- `src/routes/*.ts`

**Action**

- Split by domain: inventory, kitchen, RFID, WhatsApp, notifications, payments, analytics, audit/security.
- For route handlers, run GitNexus route/API impact before committing.
- Confirm feature-flag behavior where relevant.

**Verification**

- `npm run type-check`
- `npm run test:required`
- GitNexus `detect_changes` on staged files.

## Lane 3: Next.js API Proxy Routes

**Scope**

- `web/src/app/api/inventory/**`
- `web/src/app/api/rfid/**`
- `web/src/app/api/whatsapp/**`
- `web/src/app/api/menus/**`

**Action**

- Verify every API route proxies to canonical Express APIs or fails closed.
- No static success payloads for production routes.
- Commit by API family.

**Verification**

- `cd web && npm run type-check`
- Targeted curl/smoke tests for each family.
- GitNexus API impact for existing handlers before changes.

## Lane 4: Parent/Auth/Order Functional UX

**Scope**

- parent dashboard pages
- auth pages/forms
- menu/cart/order flows
- child management and quick reorder

**Action**

- Preserve session persistence and role routing.
- Remove fake navigation targets.
- Verify blank confirmation/order-history regressions stay fixed.

**Verification**

- `cd web && npm run type-check`
- Targeted Playwright parent journey.

## Lane 5: Kitchen/RFID/Notification Operations UX

**Scope**

- kitchen components
- RFID components
- notification/WhatsApp components

**Action**

- Ensure buttons have real actions or explicit disabled/fail-closed states.
- No silent click handlers.
- No live-looking simulated production data.

**Verification**

- `cd web && npm run type-check`
- Targeted browser QA for kitchen and RFID journeys.

## Lane 6: Payment/Billing/Subscription UX

**Scope**

- payment dashboards
- subscription management
- billing history
- payment analytics

**Action**

- Use real APIs where available.
- Where subscriptions/recurring billing are not enabled, fail closed with clear copy.
- No demo constants in runtime components.

**Verification**

- `cd web && npm run type-check`
- Payment/checkout E2E smoke.
- GitNexus impact for changed payment symbols.

## Lane 7: Design System And Token Migration

**Scope**

- `web/src/app/globals.css`
- `web/tailwind.config.js`
- `web/src/components/ui/**`
- broad class-name/token updates

**Action**

- Treat as a separate visual migration.
- Do not mix with functional API/backend changes.
- Use browser screenshots for representative pages.

**Verification**

- `cd web && npm run type-check`
- Visual smoke on login, parent dashboard, kitchen, checkout, admin.

## Lane 8: Migrations And Seed/Data Integrity

**Scope**

- `prisma/migrations/**`

**Action**

- Review ordering and reversibility.
- Run migrate status before commit.
- Confirm production deploy uses `prisma migrate deploy`, not `db push`.

**Verification**

- `npx prisma migrate status`
- Migration dry-run in staging database before production.

## Iteration Gate For Every Lane

Each lane commit must include:

1. `npm run type-check`
2. `cd web && npm run type-check`
3. `npm run test:required`
4. `npm run jcodemunch:index --silent`
5. GitNexus `detect_changes` for staged or all changes, depending on lane size

For frontend behavior lanes, add targeted Browser/Playwright verification before merge.

## Merge Readiness Definition

The repo is production-merge-ready when:

- Dirty tree is zero or contains only explicitly deferred local work.
- Each lane has an auditable commit.
- All feature flags default safe.
- All runtime routes either use real backing services or intentionally fail closed.
- Docker rebuild is healthy.
- 41/41 Playwright pilot regression passes.
- Operational secret rotation and Git history scrub status are documented.
