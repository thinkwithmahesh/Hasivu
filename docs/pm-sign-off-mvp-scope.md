# Hasivu MVP Launch Scope — PM Sign-Off

**Product:** Hasivu School Meal Ordering Platform  
**Version:** MVP 1.0  
**Date:** ****\_\_\_****  
**Prepared by:** Engineering Lead  
**Sign-off required from:** Product Manager

---

## Purpose

This document records formal scope decisions for the Hasivu MVP launch. Each row reflects an item that appeared in broader product expectations but is **not** part of the agreed first release, or is **revised** to a realistic target. Signing confirms the organization accepts the MVP boundary and will plan follow-up work for deferred items.

---

## Scope decisions

| Feature                         | PRD / expectation                   | Decision                                     | Rationale                                                                                                                                                                               | PM sign-off (initials + date) |
| ------------------------------- | ----------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| React Native mobile app         | Mobile app in roadmap               | **DESCOPED** — web-only MVP                  | Pilot schools launch on a **phone-friendly website**; a separate installable app is planned after learning from the first cohort.                                                       | ****\_****                    |
| Stripe payment gateway          | Multiple payment brands             | **DESCOPED** — Razorpay only for MVP         | India-first checkout and school finance workflows are built around **one** payment partner for launch; other brands can be evaluated later if schools expand internationally.           | ****\_****                    |
| WhatsApp notifications          | Messaging channel                   | **DESCOPED** — email and push for MVP        | WhatsApp for businesses needs provider approval and setup time; **email** (and push where enabled) covers urgent parent communication for launch.                                       | ****\_****                    |
| Large-scale performance target  | Very high user / speed targets      | **REVISED** — see `docs/scope-decisions.md`  | The original headline numbers were **not** load-tested on this stack; the team committed to a **written, achievable** capacity target for MVP and a separate performance program later. | ****\_****                    |
| School-code self onboarding     | Self-serve school join              | **DEFERRED** to Phase 2                      | Pilot schools are onboarded **with help from your team**; self-serve codes come after processes are stable.                                                                             | ****\_****                    |
| Kitchen “assign order to staff” | Engineering gap / optional workflow | **DEFERRED or implemented under Day 1 gate** | Either the feature is **built and tested** before go-live or it is **explicitly out** of MVP; no button should claim a capability that is not live.                                     | ****\_****                    |

---

## What **is** in scope for MVP launch

- Parent sign-in and meal browsing
- Shopping cart and checkout with **Razorpay** (test on staging; live keys only when you intentionally switch)
- Kitchen staff viewing orders and **updating order status** on the live workflow board
- School admin experiences already in the pilot build
- **Email** notifications when mail settings are turned on and verified
- **Web only** — the site is built to work well on phones through the browser

---

## Acknowledgement

By signing below, I confirm that:

1. I have reviewed the scope decisions above.
2. I accept that descoped and deferred items will **not** be available at MVP launch.
3. I will prioritize Phase 2 planning for deferred items within ******\_\_\_****** (e.g. 90 days post-launch — fill in).

---

**Product Manager name:** **************\_\_\_**************

**Signature:** **************\_\_\_**************

**Date:** **************\_\_\_**************

---

**Engineering Lead name:** **************\_\_\_**************

**Date:** **************\_\_\_**************
