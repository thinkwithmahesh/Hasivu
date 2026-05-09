# Runbook: Wallet Ledger Mismatch

**Use when:** Wallet balance does not match posted ledger entries, duplicate idempotency keys appear, or a debit/credit incident is suspected.

## Immediate Response

1. Set `WALLET_ENABLED=false`.
2. Set `SUBSCRIPTION_WALLET_OFFSET_ENABLED=false`.
3. Freeze manual wallet adjustments.
4. Preserve request IDs, idempotency keys, affected user IDs, and ledger entry IDs.

## Investigation

Compare wallet balance to ledger entries:

```sql
SELECT
  wallet_account_id,
  SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END) AS ledger_balance
FROM wallet_ledger_entries
WHERE status = 'posted'
GROUP BY wallet_account_id;
```

Check for:

- Same idempotency key with different request body.
- Ledger entry created without wallet version increment.
- Wallet balance update without ledger entry.

## Recovery Rule

Any manual correction must be a new compensating ledger entry. Never edit historical posted entries.
