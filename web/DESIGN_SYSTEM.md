# HASIVU Product Design System

## Direction

HASIVU is a school-meal operations product, not a generic SaaS landing page. The visual system should communicate warm food trust, parent calmness, school accountability, and kitchen clarity.

The UI/UX Pro Max research pattern selected for HASIVU is **Trust & Authority + Data-Dense Operations**, adapted into persona shells:

- **Parent:** mobile-first ordering, calm paper surfaces, reassuring food/nutrition cues, clear allergy and cutoff messaging.
- **Student:** lightweight meal browsing, order review, RFID pickup status, and dietary needs visibility.
- **Admin / School Admin:** dense dashboards, fast scanning, strong hierarchy, filters first, low-animation productivity surfaces.
- **Kitchen Staff:** tablet-friendly boards, large targets, high contrast, allergy/error prevention, status changes that are obvious from a distance.
- **Vendor:** operational order demand, inventory readiness, forecasting, and settlement visibility.
- **Auth:** one consistent visual system for login, register, recovery, MFA, and logout.

## Palette

- **Saffron / meal warmth:** `#F59E0B`, `#EA580C`
- **Forest / nutrition and completion:** `#166534`, `#22C55E`
- **Paper / trust surfaces:** `#FFF7ED`, `#FFFBEB`, `#FAFAF9`
- **Ink / legibility:** `#1C1917`, `#44403C`
- **Critical allergy/error:** `#B91C1C`, with high-contrast text and icon support

Avoid unsupported blue/purple SaaS defaults unless a legacy component has not yet been migrated.

## Motion

Framer Motion is allowed only when it improves orientation or feedback. Use `web/src/design-system/motion.ts` for page, panel, card, modal, drawer, list item, status, and tap presets.

Rules:

- Every motion component must use `useReducedMotion()` or `useMotionPreset()`.
- Reduced motion disables transform-heavy animation and physics.
- Kitchen workflows use minimal motion; status changes may fade but should not bounce or slide aggressively.
- Prefer `LazyMotion` at route boundaries when adding new animated areas.

## Component Standards

- Live launch UI should use Tailwind, Radix primitives, and HASIVU `ui/*` components.
- MUI, Mantine, and Emotion are not allowed in live `web/src` imports.
- Public pages must not claim fake SOC 2, fake customer logos, fake uptime, fake ratings, or unverifiable vulnerability fixes.
- Public login/navigation exposes the PRD role set: Student, Parent, Admin/School Admin, Kitchen Staff, and Vendor.
- Role dashboards must be server-protected by cookie-backed middleware and client-protected by role-aware route guards.

## Accessibility

- Meet WCAG 2.1 AA for contrast, focus visibility, keyboard flow, and modal focus traps.
- Parent mobile flows must be thumb-friendly.
- Kitchen controls must be usable on tablets with gloved or hurried interaction.
- Visual status must never rely on color alone; use text and icons for allergies, payment state, and fulfillment state.
