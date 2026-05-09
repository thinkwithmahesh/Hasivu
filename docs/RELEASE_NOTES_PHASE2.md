# Hasivu Phase 2 Release Notes

**Status:** Code complete behind feature flags. Not all capabilities are production-enabled.

## Merged Behind Flags

- Foundation: feature flags, idempotency, and outbox.
- Billing: wallet ledger, invoice structure, subscription structure.
- Communications: WhatsApp dual-mode integration with fallback.
- Meal planning: scheduler calendar services and demand projection.
- Recommendations: safe rule-based recommendations with feedback logging.
- Realtime: Socket.IO server with polling fallback.

## Safe Defaults

- `INVOICE_ENABLED=true`
- `REALTIME_ENABLED=false`
- `WALLET_ENABLED=false`
- `SUBSCRIPTIONS_ENABLED=false`
- `WHATSAPP_MODE=disabled`
- `MEAL_SCHEDULER_ENABLED=false`
- `RECOMMENDATIONS_ENABLED=false`
- `INVOICE_AUTO_SEND_ENABLED=false`
- `SUBSCRIPTION_WALLET_OFFSET_ENABLED=false`

## Activation Order

1. Keep invoice read paths on.
2. Enable meal scheduler in staging only.
3. Enable recommendations in staging only.
4. Enable realtime only for single-instance deployments.
5. Enable WhatsApp sandbox after opt-in and template checks.
6. Enable wallet only after reconciliation checks.
7. Keep subscriptions off until Razorpay recurring contract tests pass.

## Explicitly Not Production-Ready Yet

- WhatsApp production mode without Meta approval.
- Razorpay recurring billing without webhook contract tests.
- Wallet offsets without reconciliation monitoring.
- Realtime horizontal scale without Redis adapter.
- ML recommendations beyond the rule-based engine.

## Required Sign-Off

- Engineering Lead: ********\_\_******** Date: **\_\_\_**
- Product Manager: ********\_\_\_******** Date: **\_\_\_**
- QA Lead: ************\_\_\_************ Date: **\_\_\_**
- Security Reviewer: ********\_******** Date: **\_\_\_**
