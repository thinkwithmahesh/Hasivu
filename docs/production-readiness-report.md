# Production readiness report — Hasivu School Meal Ordering

This file holds the **technical** summary. The **executive** summary for school leadership is maintained for distribution as plain prose (see program manager pack); both reflect the same **CONDITIONAL GO → GO** gate described in `docs/launch-gate-execution-plan.md`.

---

## Technical summary (CTO / lead engineer)

### Score progression

| Milestone                    |      Overall | Note                                                                                                                              |
| ---------------------------- | -----------: | --------------------------------------------------------------------------------------------------------------------------------- |
| Initial readiness assessment | **49** / 100 | Ordering and menu routes not exposed on the running API image; several web and security gaps.                                     |
| Post-remediation closure     | **74** / 100 | **+25**; code-level P0/P1 items closed; ADR-001 **ACCEPTED** (Express default, Lambda optional, Next forwards when Lambda unset). |
| **Gate to GO**               |    _Pending_ | **+6** operational only: staging smoke PASS, `assignOrder` resolved, PM sign-off on scope.                                        |

### Fixes by domain (grouped)

- **UI ↔ API:** Mounted orders, menus, and RFID on the API; aligned kitchen **status** calls with `PUT`; real menu fetch hook; `/cart` page; Axios refresh-on-401.
- **Security / session:** Session cookie for CSRF alignment; rate limits tuned (per-account key where applicable).
- **Auth:** Next `/api/auth/login` and `/api/auth/refresh` forward to Express when Lambda URLs absent (`web/src/app/api/_utils/proxy.ts` + route handlers).
- **Payments:** Prior cycle closed Razorpay HMAC / webhook / raw body (out of scope to re-litigate here).
- **DevOps:** `prisma migrate deploy` step present in deploy jobs (jobs still gated by `if: false` until secrets confirmed).
- **PRD alignment:** `docs/scope-decisions.md` lists descopes; PM sign-off doc: `docs/pm-sign-off-mvp-scope.md`.

### Remaining conditions (file-level)

| ID     | Condition                | Evidence                                                                                                                                                |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **C1** | Runtime smoke on staging | Not executed in engineering closure; run `docs/staging-smoke-test-runbook.md`.                                                                          |
| **C2** | `assignOrder`            | `web/src/services/api.ts` **307–309** → `PATCH …/assign`; no route in `src/routes/orders.routes.ts`; **Day 1** in `docs/launch-gate-execution-plan.md`. |
| **C3** | PM governance            | `docs/pm-sign-off-mvp-scope.md` + table in `docs/scope-decisions.md`.                                                                                   |

### Architecture (ADR-001)

Single written decision: **Express** hosts canonical auth; **Next** handlers proxy to Express unless **Lambda** URLs are explicitly configured. See `docs/adr/ADR-001-auth-runtime.md`.

### Tech debt register (non-blocking unless noted)

| Item                        | Severity                  | Reference                                               |
| --------------------------- | ------------------------- | ------------------------------------------------------- |
| Kitchen `assignOrder`       | **P1 until Day 1 option** | `api.ts` **307–309**                                    |
| Sentry not wired by default | Risk accepted             | `docs/observability-decision.md` — needs named sign-off |
| Narrow required Jest slice  | Process                   | `jest.required.config.js`                               |
| Rollback / on-call          | Ops                       | Document outside repo or in internal wiki               |

### Recommended first two weeks post-launch

1. **Week 1:** Watch error logs, payment webhooks, and kitchen status changes daily; hotfix channel for schools.
2. **Week 2:** Pick one of — Sentry wiring, assign workflow implementation, or first performance sampling on staging — based on support tickets.

---

_For the one-page principal-facing narrative, distribute the executive summary section from the program deliverable (same folder / release pack) without this technical appendix._
