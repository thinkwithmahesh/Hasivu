# HASIVU — UI/UX as built (reconciled with PRD & docs)

**Purpose:** Single source of truth for **what the web app actually presents today**, how that compares to **`docs/prd/03-ui-design-goals.md`**, **`docs/brief.md`**, and **`docs/USER_TRAINING_GUIDE.md`**, and what to treat as **product intent vs implementation backlog**.  
**Scope:** Next.js app under `web/` (App Router). **No functional changes** in this document—documentation only.  
**Tooling note:** GitNexus install/configure is **deferred** per current direction; re-run indexing later if you want graph-backed drift checks.

**Last reviewed (codebase snapshot):** 2026-05-09 — routes and tokens taken from `web/src/app/**` and `web/src/app/globals.css`.

---

## 1. Executive summary

| Area                      | PRD / training narrative                                                                        | As built (web)                                                                                                                                                                                                     | Match?                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **Positioning**           | RFID-integrated school meals, parent-first, institutional depth (`brief.md`)                    | Landing (`HybridLandingPage`) emphasizes nutrition, flexibility, parent/admin/kitchen personas; ordering paths exist                                                                                               | **Mostly aligned**                                                                                |
| **Visual system**         | System fonts; green/blue/orange palette in `03-ui-design-goals.md`                              | **Nunito** + **Instrument Serif**; token palette centered on warm orange `#e07020` and green `#207040` in `:root`                                                                                                  | **Partially aligned** (intentional brand evolution—update PRD or tokens to one canonical palette) |
| **IA / roles**            | Student, teacher, kitchen, admin, parent, RFID (`USER_TRAINING_GUIDE.md`)                       | Rich route set for parent, student, kitchen, vendor, school admin, ops pages; **no `teacher` App Router tree**; auth types still list `TEACHER` with `defaultRoute: /teacher/dashboard`                            | **Gaps** — training and `USER_ROLE_CONFIG` overstate teacher UI surface                           |
| **Interaction paradigms** | One-tap reorder, drag-drop calendar, gestures, AI-timed notifications (`03-ui-design-goals.md`) | Standard web patterns (menus, cart, checkout, dashboards); sophistication varies by screen                                                                                                                         | **Partial** — treat PRD items as **targets**, verify per epic                                     |
| **Accessibility**         | WCAG 2.1 AA, automated + manual (`03-ui-design-goals.md`)                                       | `AccessibilityProvider` (font size steps, high contrast / reduced motion hooks, live regions), skip link in root layout, `UnifiedErrorBoundary` + optional Sentry; Jest/Playwright a11y tracked in production plan | **Aligned in architecture**; **coverage** is ongoing (see `docs/quality/WCAG_2_1_AA_BACKLOG.md`)  |
| **i18n**                  | Training text implies localized markets over time                                               | **English-first**; Kannada/Hindi explicitly **deferred** (`docs/PRODUCTION_READINESS_100_PLAN.md` COULD #11)                                                                                                       | **Aligned with current product decision**; training URLs/branding may be stale                    |

---

## 2. Design system (as implemented)

**Source of truth:** `web/src/app/globals.css` (`:root` and `.dark`), plus `web/src/app/layout.tsx` for fonts and global chrome.

- **Typography:** Google fonts — **Nunito** (`--font-body`), **Instrument Serif** (`--font-hero`). This **differs** from `03-ui-design-goals.md`, which specifies system UI stacks for performance/familiarity.
- **Color tokens:** Warm neutrals (`--hasivu-bg-warm`, `--hasivu-text-primary`), primary orange `--hasivu-primary`, secondary green `--hasivu-secondary`, semantic success/danger/warning/info. shadcn HSL variables are mapped for components.
- **Shape & depth:** Documented radii (`--radius-sm` … `--radius-xl`) and warm shadows (`--shadow-sm` … `--shadow-glow`).
- **Theme:** `ThemeProvider` (`next-themes`) — `defaultTheme="light"`, `enableSystem`, class-based dark mode. PRD “high contrast mode” is partly addressed via `AccessibilityProvider` + `prefers-contrast` rather than only a separate theme flag.
- **Global shell:** `PaperShadersBackground`, `Toaster` (sonner) with HASIVU-styled defaults, `pb-safe-bottom` spacer for mobile nav patterns.

**Recommendation:** Either update **`docs/prd/03-ui-design-goals.md`** § Branding to match these tokens, or schedule a design-token pass to match the PRD hex values—**pick one canonical spec** to avoid QA/design drift.

---

## 3. Information architecture — routes (as implemented)

Below is a practical map of **`web/src/app/**` `page.tsx` routes\*\* (not every dynamic segment). Use it instead of training doc URLs until those docs are refreshed.

### 3.1 Public & marketing

| Path                             | Role                                                               |
| -------------------------------- | ------------------------------------------------------------------ |
| `/`                              | Hybrid landing — personas, features, FAQ, trust, demo entry points |
| `/login`, `/register`            | Entry variants                                                     |
| `/legal/privacy`, `/legal/terms` | Legal                                                              |
| `/docs`, `/support`              | Help / support surfaces                                            |

### 3.2 Auth

| Path                                                                            | Notes               |
| ------------------------------------------------------------------------------- | ------------------- |
| `/auth/login`, `/auth/login/parent`, `/student` variants under `auth/login/*`   | Role-specific login |
| `/auth/register`, `/auth/forgot-password`, `/auth/logout`, `/auth/login-safari` | Account lifecycle   |

### 3.3 Parent / commerce (group `(parent)`)

| Path                                        | Notes                                            |
| ------------------------------------------- | ------------------------------------------------ |
| `/children`                                 | Child profiles                                   |
| `/menu`                                     | Catalog (linked from landing + parent dashboard) |
| `/cart`, `/checkout`                        | Basket and checkout                              |
| `/payment-methods`                          | Payments                                         |
| `/orders`, `/orders/[orderId]/confirmation` | Order history / confirmation                     |

### 3.4 Dashboards (by role)

| Path                                                                                                                                              | Notes              |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `/dashboard`, `/dashboard/parent`, `/dashboard/student`, `/dashboard/kitchen`, `/dashboard/vendor`, `/dashboard/admin`, `/dashboard/school-admin` | Role home surfaces |
| `/student/profile`                                                                                                                                | Student profile    |

### 3.5 Operations & school ops

| Path                                                      | Notes                                           |
| --------------------------------------------------------- | ----------------------------------------------- |
| `/kitchen/*`, `/kitchen-management`                       | Kitchen workflows                               |
| `/inventory-management`, `/daily-menu`, `/menu`           | Menu / inventory                                |
| `/order-workflow`, `/administration`                      | Ops / admin tools                               |
| `/admin/users`, `/admin/schedule`, `/admin/feature-flags` | Admin consoles                                  |
| `/analytics`                                              | Analytics                                       |
| `/notifications`                                          | Notification center                             |
| `/rfid-verification`                                      | RFID                                            |
| `/vendor/*`                                               | Vendor orders, inventory, payments, forecasting |
| `/settings`                                               | Settings                                        |
| `/startwell`                                              | Program-specific surface                        |

**Not observed in App Router (2026-05-09):** `app/teacher/**`, `app/super-admin/**` — yet `web/src/types/auth.ts` `USER_ROLE_CONFIG` references `/teacher/dashboard` and `/super-admin/dashboard`. Treat those as **auth/config debt** or **future surfaces**, not as current UX.

---

## 4. PRD interaction goals vs likely implementation status

From **`docs/prd/03-ui-design-goals.md`**, map to **verification mindset** (no claim that every sub-bullet exists):

| PRD paradigm                    | As-built direction                             | Verification hint                              |
| ------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| One-touch reorder               | Parent/student flows + order history           | Inspect `orders`, `menu`, cart quick actions   |
| Visual meal planning / calendar | `admin/schedule`, kitchen schedule, daily menu | Check for drag-drop vs simpler forms           |
| Progressive disclosure          | shadcn Cards, Accordions on landing            | Spot-check menu item detail                    |
| Contextual notifications        | `/notifications` + backend                     | Contrast with “AI-driven timing” in PRD        |
| Gestural navigation             | Web-first                                      | Largely **out of scope** unless mobile wrapper |
| RFID in order tracking          | `/rfid-verification`, order confirmation       | Align copy with PRD “timeline” language        |

---

## 5. Training & brief vs product truth

- **`docs/USER_TRAINING_GUIDE.md`** describes mobile apps, `https://app.hasivu.edu.in`, teacher guides, and wallet steps at a **high level**. The **shipping web app** is the Next.js tree above; **deep-link URLs and mobile app steps should be audited** before external distribution.
- **`docs/brief.md`** stressors (parent time savings, RFID, payments) remain **directionally correct** for messaging; landing copy in `HybridLandingPage` is **consistent** with parent/school positioning but **does not enumerate RFID** in the first screenful—acceptable product choice, but note for marketing parity if RFID is a primary differentiator.

---

## 6. Accessibility & quality (as built + gates)

- **Runtime:** Skip link, semantic main landmark, focusable `#main-content`, `AccessibilityProvider` with font scaling and announcement helpers.
- **CI / quality docs:** `docs/PRODUCTION_READINESS_100_PLAN.md` (UX/a11y pillar), `docs/quality/WCAG_2_1_AA_BACKLOG.md`, Playwright a11y setup `docs/quality/PLAYWRIGHT_A11Y_CI_SETUP.md`.
- **i18n:** Explicitly **post-MVP deferral**; all copy audits should assume **English-only** until COULD #11 is rescoped.

---

## 7. Suggested next steps (documentation & product)

1. **Pick canonical visual spec:** Merge PRD § colors/typography with `globals.css`, or revert tokens to PRD—one source only.
2. **Fix role/route drift:** Either add `app/teacher/...` and `app/super-admin/...` or change `USER_ROLE_CONFIG` default routes to existing pages—avoid users landing on 404 after login.
3. **Refresh `USER_TRAINING_GUIDE.md`** screenshots and URLs against **staging** host actually used in deploy runbooks.
4. **Epic-level RTM:** Tie each **`03-ui-design-goals.md` bullet** to a route or explicit “not planned” in `docs/prd/epics/*`.

---

## 8. Related documents

- `docs/prd/03-ui-design-goals.md` — original UX vision
- `docs/prd/README.md` — PRD index
- `docs/brief.md` — business/problem framing
- `docs/USER_TRAINING_GUIDE.md` — operator-facing narratives (may lag code)
- `docs/PRODUCTION_READINESS_100_PLAN.md` — i18n defer, a11y CI
- `web/src/app/layout.tsx`, `web/src/app/globals.css` — **implementation truth**
