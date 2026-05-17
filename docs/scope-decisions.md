# Scope Decisions — BMAD Audit

**Date:** 2026-05-02

Items identified by BMAD audit as outside PRD scope:

| File/Feature                                    | In PRD? | Decision                 | Rationale                                     |
| ----------------------------------------------- | ------- | ------------------------ | --------------------------------------------- |
| `src/services/fraud-detection.service.ts`       | No      | KEEP                     | Production safety — protects payment flow     |
| `src/services/ml/federated-learning.service.ts` | No      | DEFERRED to Phase 3      | Experimental ML feature — not needed for MVP  |
| `src/services/ml/automl.service.ts`             | No      | DEFERRED to Phase 3      | AI-powered recommendations (Phase 3 PRD item) |
| `src/services/api-key-rotation.service.ts`      | No      | KEEP                     | Security best practice                        |
| `web/src/app/blend/page.tsx`                    | No      | **REMOVED**              | Unclear purpose, no PRD mapping               |
| `web/src/app/sprrrint/page.tsx`                 | No      | **REMOVED**              | Unclear purpose, no PRD mapping               |
| `web/src/app/test-fixes/page.tsx`               | No      | **REMOVED**              | Test page, should not be in production        |
| `web/src/pages-backup/`                         | No      | **REMOVED**              | Dead Pages Router remnant                     |
| `web/next.config.optimized.js`                  | N/A     | **ARCHIVED** (`.backup`) | Only `next.config.js` is active               |
| `web/next.config.performance.js`                | N/A     | **ARCHIVED** (`.backup`) | Only `next.config.js` is active               |
