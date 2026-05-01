# Secrets Rotation Runbook

## Scope

Rotate all credentials exposed in repository history or local env files.

## Secrets to Rotate

1. `JWT_SECRET`
2. `JWT_REFRESH_SECRET`
3. DB credentials (`DATABASE_URL` password/user if exposed)
4. Razorpay keys and webhook secret
5. AWS access keys and session credentials

## Procedure

1. Rotate secret in upstream provider (AWS/Razorpay/DB).
2. Update secret manager / GitHub Actions secrets.
3. Redeploy affected environment.
4. Run smoke checks.

## Verification

1. Auth tokens issued and verified with new keys.
2. DB connectivity healthy.
3. Payment webhook signatures validate.
4. CI secret scan passes.
