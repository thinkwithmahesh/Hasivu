# Secrets and fresh Git history

## Committed environment templates (current tree)

Only these env templates are tracked:

| File              | Purpose                          |
| ----------------- | -------------------------------- |
| `.env.example`    | Root API / Docker / Prisma       |
| `web/.env.example`| Next.js BFF / public env template |

All other `.env*` files are **gitignored** (including `web/.env.development`, `web/.env.staging`, `web/.env.production`, `web/.env.local`, etc.).

## What we removed (2026-05-17 follow-up)

The following were **removed from Git tracking** (they must not be re-added):

- `web/.env.development`
- `web/.env.staging`
- `web/.env.production`
- `web/.env.india`

Those files contained **environment-specific URLs and predictable placeholder values** (fake API Gateway IDs, example `DATABASE_URL`, `NEXTAUTH_SECRET=production-hasivu-platform-secret-key-2025`, masked `rzp_live_xxxxxxxxxxxxxxxxxx`). They were **not** suitable for a public delivery repo even as examples.

## Credentials in published Git history

After the env cleanup commit, `main` was rewritten again (orphan root) so those `web/.env.*` files **do not appear in any commit** on the published branch.

**Operator confirmation (run after clone):**

```bash
git fetch origin main
git log --oneline -3
git ls-files '.env*' 'web/.env*'
# Expect exactly:
#   .env.example
#   web/.env.example

git log --all -- web/.env.production
# Expect: no commits (empty)
```

### Were “real” production secrets ever committed?

Audit of the pre-cleanup delivery commits found **placeholder / example values only**, for example:

- `DATABASE_URL=postgresql://hasivu_prod:prod_password@hasivu-prod-db...` (synthetic hostname/user)
- `NEXTAUTH_SECRET=production-hasivu-platform-secret-key-2025` (predictable string, not a rotated secret)
- `NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxxxx` (masked pattern)
- `AWS_SECRET_ACCESS_KEY=your-secret-access-key` (literal placeholder)

**No live Razorpay secret keys, no real JWT secrets, and no verified production database passwords** were identified in that audit. If your team ever replaced placeholders with real values in a **private** fork or unpushed branch, rotate those credentials regardless.

## Rotation checklist (before production)

| Action                                     | Owner | When                          |
| ------------------------------------------ | ----- | ----------------------------- |
| Rotate `JWT_SECRET` / `JWT_REFRESH_SECRET` | Ops   | Before prod deploy            |
| Rotate database passwords                  | Ops   | If real URLs were ever used   |
| Rotate Razorpay keys / webhook secret      | Ops   | If live keys were ever used   |
| Rotate AWS keys (if any)                   | Ops   | As applicable                 |
| Update GitHub Actions / VPS secrets        | Ops   | After rotation                |

## Verification commands

```bash
git ls-files '.env*' 'web/.env*'
git ls-files '*.bak' '*.log' 'dump.rdb'
```

Expected:

- Env: `.env.example` and `web/.env.example` only
- `.bak` / `.log` / `dump.rdb`: empty
