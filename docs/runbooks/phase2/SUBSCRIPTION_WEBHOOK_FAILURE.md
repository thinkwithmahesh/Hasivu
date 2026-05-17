# Runbook: Subscription Renewal Webhook Failure

**Use when:** Razorpay recurring webhook delivery fails, subscription state diverges, or renewal invoices are missing.

## Immediate Response

1. Keep `SUBSCRIPTIONS_ENABLED=false` unless recurring billing has been explicitly launched.
2. If launched, pause subscription creation and keep existing pilot one-time payments available.
3. Do not infer successful payment from client-side state.

## Diagnose

- Verify Razorpay webhook secret and signature validation.
- Check webhook idempotency keys and replay handling.
- Compare provider subscription state with local subscription and billing-cycle state.
- Check invoice generation for the affected renewal.

## Recovery Criteria

- Provider event replay succeeds idempotently.
- Local subscription state matches Razorpay.
- Invoices match captured payments.
- Dunning/retry state is visible to operations.
