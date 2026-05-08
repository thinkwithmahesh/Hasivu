# Unit test CI remediation

## Current signal

**2026-05-04:** `npm run test:unit` is **green** — **26 suites**, **293 tests** (pattern matches `unit` per `package.json`). The **`unit-tests` job** in `.github/workflows/ci-cd.yml` should pass when this command passes locally on the same commit.

Historical note: remediation involved aligning mocks with `DatabaseService` / Prisma / Lambda auth patterns, removing duplicate or obsolete suites (e.g. legacy RFID Lambda packs that mocked the wrong DB client), and keeping `tests/unit/services/auth.service.test.ts` as the canonical auth service coverage.

## Gate today

- **`npm run test:required`** — small, high-value subset; **passes** and should stay mandatory.
- **`npm run test:a11y`** (web) — **passes**; blocks `build` via `accessibility-tests`.

## Recommended path (no silent skipping)

1. **Triage by suite** — Run `npx jest tests/unit/services/notification.service.test.ts --no-coverage` (and the next failing file) until the **largest** broken cluster is identified.  
2. **Fix mocks / async** — Prefer aligning tests with current service contracts over deleting coverage.  
3. **Optional interim** — If business requires a green pipeline before full repair: temporarily add a **documented** `jest` project or `testPathPattern` for “tier 1” unit tests **only** with a **deadline** to restore full `test:unit` — do **not** leave unbounded `testPathIgnorePatterns` without review.

## jcodemunch

Before editing `notification.service` or its tests, use **`find_references`** / **`search_text`** on the repo `local/hasivu-platform-f501c264` for blast radius.
