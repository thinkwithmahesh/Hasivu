# Runbook: Realtime Auth Or Room Authorization Failure

**Use when:** Socket connections fail, clients receive room-denied errors, or realtime updates leak/appear missing.

## Immediate Response

1. Set `REALTIME_ENABLED=false`.
2. Confirm clients fall back to polling.
3. Verify no pilot ordering flow depends exclusively on websocket delivery.

## Diagnose

- Check `REALTIME_TOKEN_SECRET` matches backend token issuer and verifier.
- Confirm token lifetime is short and clock skew is reasonable.
- Confirm room names match `school:{schoolId}:admin`, `school:{schoolId}:kitchen`, `user:{userId}`, or authorized `order:{orderId}`.
- Confirm single-instance deployment. Horizontal scale requires a Socket.IO Redis adapter before production scale-out.

## Re-Enable Criteria

- Auth failure rate returns to baseline.
- No unauthorized room joins.
- Polling fallback verified.
- Support team knows the kill switch.
