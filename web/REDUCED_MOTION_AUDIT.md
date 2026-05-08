# Reduced motion audit — Hasivu web (Phase 2)

**Graphify:** not present in workspace MCP servers. **jcodemunch:** requires indexed `repo`; not used here. **Sequential thinking:** used for planning.

Global baseline: `src/app/globals.css` includes `@media (prefers-reduced-motion: reduce)` with `animation-duration`, `transition-duration`, `animation-iteration-count`, and `scroll-behavior: auto` on `*`.


| File                                                      | Component / area   | Animation                                     | Status                                                                                                                                                                        |
| --------------------------------------------------------- | ------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/characters/HasivuFriend.tsx`              | All characters     | Framer variants / `motion.div`                | ✅ `useReducedMotion()` first; static `Image` when reduced; GroupScene hidden                                                                                                  |
| `src/app/(parent)/orders/[orderId]/confirmation/page.tsx` | Order success      | Meera, confetti, springs, stagger             | ✅ `useReducedMotion()` before state; instant variants + static checkmark when reduced                                                                                         |
| `src/components/dashboard/ParentDashboard.tsx`            | Parent dashboard   | Section motion, hovers, bar chart             | ✅ `useReducedMotion()` before `useState`; chart uses `duration: 0.001` when reduced; child tiles use plain `<button>` when reduced; urgency badge pulse disabled when reduced |
| `src/components/sections/admin/StudentManagement.tsx`     | Student list       | Stagger list                                  | ✅ `useReducedMotion()` first; instant variants when reduced                                                                                                                   |
| `src/components/orders/OrderCard.tsx`                     | Order card         | Enter / progress                              | ✅ Guards with `reduced`                                                                                                                                                       |
| `src/components/ui/button.tsx`                            | Buttons            | Scale / spin                                  | ✅ `motion-reduce:` utilities                                                                                                                                                  |
| `src/components/ui/input.tsx`                             | Inputs             | Transitions                                   | ✅ `motion-reduce:transition-none`                                                                                                                                             |
| `src/components/landing/StartwellInspiredLandingPage.tsx` | Marketing          | `animate-pulse`, `animate-float`, transitions | ⚠️ Relies on global CSS blanket + per-class transitions; **do not edit** per Phase 1 lock unless product approves                                                             |
| `src/components/rfid/ParentDashboard.tsx`                 | Legacy RFID parent | `AnimatePresence` / motion                    | ✅ `useReducedMotion()` first; tab panels instant + `duration: 0.001` when reduced; loading skeleton no `animate-pulse`; toggle tracks skip transition when reduced            |
| `src/components/staff/StaffTasksManagement.tsx`           | Staff tasks        | Motion / spinners                             | ✅ `useReducedMotion()` in shell + `TaskCard`; list cards disable `layout`, instant enter/exit, `Loader2` no spin when reduced                                                 |
| `src/components/OnboardingFlow.tsx`                       | Onboarding steps   | Step slide + dots + completion                 | ✅ Phase 3: directional `custom` slide variants; progress dots spring (scale 1 when reduced); completion `GroupScene` celebrate→breathe + static `Image` when reduced; `/parent/menu` CTA |


## Fixes applied this pass

1. `**globals.css`** — extended reduced-motion block with `scroll-behavior: auto !important`.
2. `**ParentDashboard.tsx`** — brand tokens (gray → Hasivu), header surface + `shadow-warm-sm`, `OrderingCutoffUrgency` + `CutoffCountdown` (framer `animate` on `useMotionValue`), Aarav on “Today’s Orders” card, reduced-motion-safe child selector buttons, nutrition bar chart instant final height when reduced.
3. `**rfid/ParentDashboard.tsx`** + `**StaffTasksManagement.tsx`** — `useReducedMotion()` guards on tab/panel motion, task card list motion, loading spin/pulse, and settings toggles (RFID).

## Scan command (reference)

```bash
rg "motion\\.|animate|AnimatePresence|useAnimation|transition|keyframes|@keyframes|animation:" \
  -g '*.tsx' -g '*.ts' -g '*.css' web/src
```

## Phase 3 Additions — 2026-05-02

**Globals verification (Rule 1):** `globals.css` `@media (prefers-reduced-motion: reduce)` includes `animation-duration: 0.01ms !important` and `animation-iteration-count: 1 !important` — no file change.

| File | Component / area | Animation type | Status | Action taken |
| --- | --- | --- | --- | --- |
| `src/components/rfid/RFIDVerificationSystem.tsx` | Scanner + transactions | Framer rings / list motion / spin | ✅ FIXED | `useReducedMotion` in `RFIDScannerAnimation` + `RealTimeMonitor`; scanning rings off when reduced; `TransactionHistory` uses plain `div`; `RefreshCw` spin gated |
| `src/components/rfid/DeliveryTracking.tsx` | Order list + detail | Framer + pulse + spin | ✅ FIXED | `useReducedMotion` first; order rows + detail panel instant when reduced; loading pulse + refresh spin gated |
| `src/components/rfid/RFIDScanIndicator.tsx` | Scan UI | Framer loops + spin | ✅ FIXED | `useReducedMotion` first; pulses/rotate/overlay/signal bars instant or static when reduced |
| `src/components/rfid/ParentDashboard.tsx` | (prior pass) | Tabs | ✅ FIXED | (unchanged this session) |
| `src/components/staff/StaffScheduling.tsx` | Calendar cells | Framer enter + Loader2 | ✅ FIXED | `useReducedMotion` first; `CalendarView` `reducedMotion` prop; schedule cell motion instant when reduced; loader spin gated |
| `src/components/staff/StaffTasksManagement.tsx` | (prior pass) | Task cards | ✅ FIXED | (unchanged this session) |
| `src/components/staff/StaffManagementSystem.tsx` | Staff cards expand | Framer height | ✅ FIXED | Removed `framer-motion` expand panel — plain `div` (kitchen-adjacent tool; no motion) |
| `src/components/sections/kitchen/ByMealView.tsx` | Production view | `animate-fade-in-up` | ✅ FIXED | Class removed (Rule 4: no entrance motion) |
| `src/components/sections/kitchen/ByClassView.tsx` | Dispatch view | `animate-fade-in-up` | ✅ FIXED | Class removed |
| `src/components/onboarding/EnhancedOnboardingFlow.tsx` | Step shell + welcome grid | Framer x-slide + hover + progress | ✅ FIXED | `useReducedMotion` first; `slideDirection` on next/prev/skip; outer step `variants` instant when reduced; welcome `whileHover` only when not reduced; progress bar + nav + CTA loader gated |
| `src/components/ui/dialog.tsx` | Overlay | Radix `animate-in` | ✅ COVERED BY GLOBAL + existing backdrop | No change (B.4: backdrop already present) |
| `src/components/landing/StartwellInspiredLandingPage.tsx` | Marketing | `animate-*` | ✅ COVERED BY GLOBAL | Phase 1 lock — no edit |
| `src/components/landing/ProductionLandingPage.tsx` etc. | Marketing / landings | `animate-*` / blob | ✅ COVERED BY GLOBAL | No code change this sprint |
| `src/components/meal-ordering/*`, `OrderCard`, `MealCard`, `CategoryTabs`, `MealOrderingInterface`, `OrderSummary` | Parent meal flows | `animate-*` / motion | ✅ COVERED BY GLOBAL or ✅ prior FIXED | Do not touch per sprint lock / already guarded |
| `src/components/dashboard/parent/ParentDashboard.tsx` | Spinner | `animate-spin` | ✅ COVERED BY GLOBAL | No change |
| `src/app/login/page.tsx`, `register`, `auth/login/*`, `docs`, `orders`, `menu` | Loaders | `animate-spin` / pulse | ✅ COVERED BY GLOBAL | No change |
| `src/components/ui/skeleton.tsx`, `toast.tsx`, `select.tsx`, `sheet.tsx`, `tooltip.tsx`, `hover-card.tsx` | Primitives | `animate-in` | ✅ COVERED BY GLOBAL | No change |
| `src/contexts/*auth*.tsx` | Loading spinners | CSS spin | ✅ COVERED BY GLOBAL | No change |
| `src/components/payments/*`, `notifications/*` (non-modal core) | Dashboards | pulse / spin | ✅ COVERED BY GLOBAL | No change; payment iframes not modified |
| Destructive / Stripe payment dialogs | — | — | ⚠️ DEFERRED | Per spec: no character integration; wrappers not opened this sprint |