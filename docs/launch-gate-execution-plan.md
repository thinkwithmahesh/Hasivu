# Launch gate execution plan (5 working days)

**Goal:** Clear **CONDITION 1** (runtime smoke), **CONDITION 2** (`assignOrder`), **CONDITION 3** (PM scope sign-off), then move verdict to **GO** for staging deploy.

---

## Day 1 — CONDITION 2: `assignOrder` resolution

| Field         | Value                                               |
| ------------- | --------------------------------------------------- |
| **Owner**     | **Engineer**                                        |
| **Condition** | Code: `kitchenApi.assignOrder` vs backend route gap |

**Decision by end of Day 1 (choose one):**

| Option            | Action                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Implement** | Add `PUT /api/kitchen/orders/:id/assign` (or agreed path) in `src/routes/orders.routes.ts`, persist assignment, authz for kitchen/school admin + `schoolId`; update `web/src/services/api.ts` to match; `npm run type-check` + `npm run test:required` green. |
| **B — Descope**   | Remove or hide assign UI; document in `docs/scope-decisions.md` (row already added for “Kitchen order assign-to-staff”); add `// DEFERRED` on `kitchenApi.assignOrder` in `web/src/services/api.ts`.                                                          |

**Deliverable:** Merged PR + short note in this file under “Day 1 log” which option shipped.

---

## Day 2 — Staging environment (CONDITION 1 prep)

| Field     | Value      |
| --------- | ---------- |
| **Owner** | **DevOps** |

**Checklist:**

- [ ] GitHub Actions / deployment secrets: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_URL`, Razorpay test keys (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`), `NEXT_PUBLIC_API_URL` (Next → API), `NEXT_PUBLIC_DEFAULT_SCHOOL_ID` if used for demos
- [ ] Staging containers or VMs: API **:3001**, web **:3000** healthy
- [ ] `GET http://[STAGING_BACKEND]:3001/health/ready` → **200**, dependencies green
- [ ] `npx prisma migrate deploy` against staging DB → **success** (no drift)

---

## Day 3 — CONDITION 1: Smoke test execution

| Field     | Value        |
| --------- | ------------ |
| **Owner** | **Engineer** |

**Deliverable:** Execute `docs/staging-smoke-test-runbook.md`; fill `docs/staging-smoke-test-results.md` with **PASS** or **FAIL** + details. Any failure → `launch-blocker` issue before Day 5.

---

## Day 4 — CONDITION 3 + observability

| Field     | Value                         |
| --------- | ----------------------------- |
| **Owner** | **PM** + **Engineering Lead** |

**Deliverables:**

1. **`docs/pm-sign-off-mvp-scope.md`** — PM completes signature block and table initials/dates for the five (plus assign row if Option B) scope lines.
2. **`docs/observability-decision.md`** — Engineering Lead adds name + date to sign-off table **or** Sentry is wired and one test event is verified in the Sentry project.

---

## Day 5 — Final gate + staging CI

| Field     | Value                                      |
| --------- | ------------------------------------------ |
| **Owner** | **PM** + **Engineering Lead** + **DevOps** |

**Checklist:**

- [ ] All three **conditions** above marked satisfied (smoke PASS, assign resolved, PM sign-off on file)
- [ ] `docs/adr/ADR-001-auth-runtime.md` — add a one-line “Launch gate cleared [date]” under Migration Notes or Status if you maintain history there
- [ ] `.github/workflows/ci-cd.yml` — flip **`if: false` → `if: true`** **only** for **`deploy-staging`** (~line 403 region), per org policy; **leave production** `if: false` until business approval
- [ ] Run staging deploy workflow; confirm **`prisma migrate deploy`** step succeeds in the Actions log
- [ ] If all pass: record **verdict GO** for staging in this doc + release channel

**Production deploy:** separate manual approval / environment protection in GitHub — not auto-flipped on Day 5 unless explicitly decided.

---

## Day logs (fill during execution)

### Day 1 log

- Option chosen (A / B): \***\*\_\_\_\*\***
- PR link: \***\*\_\_\_\*\***

### Day 3 log

- Smoke result: PASS / FAIL
- Results file updated: yes / no

### Day 5 log

- Staging deploy workflow run: \***\*\_\_\_\*\***
- Verdict: CONDITIONAL GO / GO
