# WCAG 2.1 AA — automation and backlog

## Automated coverage today

| Layer            | Command                                 | CI                                                                                           |
| ---------------- | --------------------------------------- | -------------------------------------------------------------------------------------------- |
| Jest + jest-axe  | `cd web && npm run test:a11y`           | **Yes** — job `accessibility-tests` in `.github/workflows/ci-cd.yml` (**blocking** `build`). |
| Playwright + axe | `cd web && npm run test:accessibility`  | Run locally / in release pipeline when a server is up; heavier than Jest.                    |
| Custom script    | `cd web && npm run audit:accessibility` | Optional reporting (`scripts/accessibility-audit.js`).                                       |

## Resolved Jest issues (historical)

The suite in `web/src/components/accessibility/__tests__/accessibility.test.tsx` was updated for: skip-link pattern + `onClick` focus target, valid **axe** `runOnly` WCAG tags, modal **Escape** / tab order, hidden **role="alert"** queries, and **Alt+=** keyboard expectations.

## Manual audit checklist (sample)

- Keyboard-only pass on login, order flow, payment confirmation.
- Screen reader labels on forms, errors, and live regions.
- Focus order and visible focus styles.
- Color contrast on primary actions (not only jest-axe defaults).

## Definition of done (next tier)

1. Keep `cd web && npm run test:a11y` green on default branch.
2. Add **Playwright** a11y smoke on one critical path in CI (preview URL or ephemeral stack).
3. Track manual audit findings in issues linked from this doc.
