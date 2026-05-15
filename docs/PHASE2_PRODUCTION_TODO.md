# Phase 2/3 Production TODO

Last updated: 2026-05-15

This is the active cleanup ledger for the post-Phase-2 tree. GitNexus and
jcodemunch are both used for risk discovery: GitNexus for execution-flow impact,
jcodemunch for fast local symbol/text checks against the refreshed code index.

## P0 - Merge Safety

- [ ] Keep the dirty tree reviewable: split backend service changes, Prisma
      migrations, Next API proxies, and UI refactors into separate commits.
- [ ] Remove accidental filesystem artifacts before commit: `.DS_Store`,
      `docs/.DS_Store`, and scratch output that is not intentionally documented.
- [ ] Run migration dry-run against a disposable database before merge.
- [ ] Re-run GitNexus `detect_changes` after each commit-sized slice.
- [ ] Re-run jcodemunch index after each large backend or web slice:
      `npm run jcodemunch:index`.

## P0 - Active Runtime Stub Removal

- [x] Replace the password reset email placeholder in `AuthService` with the
      existing notification/email pipeline or fail closed with a structured error
      when mail is not configured.
- [x] Verify `PaymentGatewayService` is not in the production path; if it is
      active, replace the mock gateway branch with the canonical Razorpay provider.
- [x] Replace frontend feature-flag and vendor-search mock hooks with API-backed
      data or explicit unavailable states.
- [x] Replace backend analytics dashboard/report mock outputs with persisted
      order/user/metric calculations.
- [x] Replace payment-order repository fake CRUD methods with real Prisma
      `payment_orders` access.
- [x] Replace API-key rotation demo validation with persisted hashed credential
      storage, rotation, revocation, and stats.
- [x] Replace mobile RFID tracking placeholders with delivery verification and
      notification data enrichment.
- [x] Replace Lambda JWT revocation logging and auth rate-limit placeholders
      with Redis-backed state.
- [x] Replace `hasivu-api.service` empty-shell behavior with canonical API
      calls or deliberate fail-closed responses.
- [x] Replace analytics query execution empty success responses with persisted
      `analyticsMetric` reads, filtering, ordering, pagination, and period grouping.
- [x] Replace popular menu-item analytics fake rows with real `order_items`
      aggregation joined to menu item names.
- [x] Replace legacy Lambda CSRF format-only validation with signed, expiring
      HMAC tokens that fail closed when no production secret is configured.
- [x] Replace data-warehouse audit/classification/privacy stubs with
      deterministic database-backed audit summaries, rule-based classification, and
      privacy-preserving anonymization/k-anonymity utilities.
- [x] Replace parent mobile push-notification simulation with FCM-backed push
      delivery when configured, and explicit failed device delivery when no provider
      key exists.

## P1 - Legacy / Low-Risk Stub Triage

- [ ] Classify ML services under `src/services/ml/*` as either active Phase 2
      modules or legacy compatibility. Active modules need real deterministic logic;
      legacy modules should be quarantined and not mounted.
- [ ] Classify advanced analytics research modules under `src/functions/analytics/*`
      as product-enabled or quarantined. They still contain simulation-oriented
      internals and should not be treated as production user-facing features until
      explicitly enabled and tested.
- [ ] Convert database-performance "optimization stub" methods into measured
      recommendations or remove the automatic-optimization promise.
- [x] Review API-key rotation service demo methods and route exposure.
- [ ] Replace leftover `default-school-id` fallbacks with authenticated tenant
      context or explicit validation failures.

## P1 - Verification Coverage

- [ ] Add API tests for inventory CRUD and low-stock alerts.
- [ ] Add notification template route tests, including tenant isolation.
- [ ] Add payment analytics route/service tests against real persisted metrics.
- [ ] Add disabled-route tests for any newly mounted Phase 2 route.
- [ ] Run the full 41-test Playwright pilot regression before final commit.

## P2 - Rollout Readiness

- [ ] Keep risky flags disabled by default in every environment.
- [ ] Confirm outbox/dead-letter visibility before enabling async features.
- [ ] Confirm WhatsApp remains sandbox/disabled until Meta approval, templates,
      opt-in proof, and webhook signature tests are complete.
- [ ] Confirm wallet remains disabled until reconciliation tests and anomaly
      alerts are present.
- [ ] Confirm realtime is not enabled in multi-instance production until the
      Redis Socket.IO adapter is wired.

## Tooling Commands

- GitNexus impact:
  `npx gitnexus status` and MCP `detect_changes(scope="all")`
- jcodemunch refresh:
  `npm run jcodemunch:index`
- jcodemunch text search:
  `npm run jcodemunch:search -- "mock implementation"`
- jcodemunch symbol blast:
  `npm run jcodemunch:blast -- AuthService`
