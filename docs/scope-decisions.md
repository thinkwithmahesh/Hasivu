# Product scope decisions (MVP vs PRD)

Formal descopes and deferrals for stakeholder alignment. PRD references are placeholders until the canonical PRD document ID is linked in-repo.

| Feature                       | PRD Reference                  | Decision                                                                                                                                           | Date       | Owner |
| ----------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ----- |
| React Native mobile app       | PRD §Mobile                    | DESCOPED — MVP is web-only                                                                                                                         | 2026-05-01 | PM    |
| Stripe payment gateway        | PRD §Payments                  | DESCOPED — Razorpay only for MVP                                                                                                                   | 2026-05-01 | PM    |
| WhatsApp notifications        | PRD §Comms                     | DESCOPED — Email + push for MVP                                                                                                                    | 2026-05-01 | PM    |
| 100k users / &lt;100ms NFR    | PRD §NFR                       | REVISED — Target: 5k concurrent web users, p95 API &lt; 500ms under nominal load until dedicated perf program                                      | 2026-05-01 | PM    |
| School-code onboarding        | PRD §Onboarding                | DEFERRED to Phase 2                                                                                                                                | 2026-05-01 | PM    |
| Kitchen order assign-to-staff | PRD (if any) / engineering gap | DEFERRED to Phase 2 — no assign route in Express; **Code removed:** UI + hook + API client removed in closure sprint. Backend route never existed. | 2026-05-01 | PM    |
