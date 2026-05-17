# Runbook: Outbox Backlog Or Dead Letter Growth

**Use when:** Outbox pending events grow continuously, events move to `dead_letter`, or async notifications stop.

## Diagnose

```bash
npx prisma studio
```

Inspect `outbox_events` grouped by `status`, `event_type`, `attempts`, and `last_error`.

## Immediate Response

1. Disable the producing feature flag if the backlog is growing.
2. Identify whether the failing consumer is notification, realtime, WhatsApp fallback, billing, or recommendations.
3. Do not manually mark events as processed unless the downstream side effect is confirmed complete.
4. Requeue only idempotent events.

## Recovery Criteria

- Pending count is draining.
- Dead-letter count is stable.
- `last_error` has a known fix or accepted operational explanation.
- Pilot routes still pass required regression checks.
