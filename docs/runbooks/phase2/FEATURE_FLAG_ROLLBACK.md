# Runbook: Phase 2 Feature Flag Rollback

**Use when:** A flagged Phase 2 capability causes user impact, elevated errors, or operational uncertainty.

## Immediate Rollback

1. Set the affected flag to its safe value:
   - `REALTIME_ENABLED=false`
   - `WALLET_ENABLED=false`
   - `SUBSCRIPTIONS_ENABLED=false`
   - `MEAL_SCHEDULER_ENABLED=false`
   - `RECOMMENDATIONS_ENABLED=false`
   - `INVOICE_AUTO_SEND_ENABLED=false`
   - `SUBSCRIPTION_WALLET_OFFSET_ENABLED=false`
   - `WHATSAPP_MODE=disabled`
2. Restart the backend process or redeploy with the updated environment.
3. Verify the feature fails closed:

```bash
curl -i http://localhost:3000/api/v1/wallet
curl -i http://localhost:3000/api/v1/realtime/token
```

Expected: `401` if unauthenticated, or `404` with `FEATURE_DISABLED` after auth.

## Pilot Safety Verification

```bash
npm run type-check
cd web && npm run type-check
npm run test:required
```

For browser regression, run the Playwright pilot suite before re-enabling.

## Incident Notes

Record the flag, environment, time disabled, observed symptom, owner, and follow-up issue link.
