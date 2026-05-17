# Hasivu Pilot Launch Checklist

**Target:** Single-school pilot, approximately 200 families  
**Platform:** Docker VPS + Supabase Postgres  
**Status:** Conditional GO after automated gates pass and operational security rotation is completed

---

## Automated Gates

Run before any staging or pilot deployment:

```bash
bash docs/pilot/verify.sh
```

Required result:

- [ ] 0 moderate/high/critical npm vulnerabilities in root
- [ ] 0 moderate/high/critical npm vulnerabilities in `web/`
- [ ] No committed `.env*` files except `.env.example` and `.env.integration`
- [ ] Razorpay checkout domain present in frontend CSP
- [ ] Cookie-only auth, with no browser-readable auth token storage
- [ ] Backend `/health/live`, `/health/ready`, and `/metrics` are responding
- [ ] Frontend `/api/status` is responding
- [ ] Root and web TypeScript checks pass
- [ ] Required backend tests pass
- [ ] Root and web circular dependency checks pass
- [ ] All five role dashboards exist
- [ ] Checkout, cart, RFID, and scope decision docs exist
- [ ] Docker production compose validates
- [ ] Sentry and runbooks are present
- [ ] Playwright role journeys pass

---

## Operational Gates

These require human action and must be completed before public access.

### Secret Rotation

- [ ] Generate new `JWT_SECRET`: `openssl rand -base64 48`
- [ ] Generate new `JWT_REFRESH_SECRET`: `openssl rand -base64 48`
- [ ] Rotate Razorpay API keys in Razorpay dashboard
- [ ] Rotate PostgreSQL password in the hosting dashboard
- [ ] Rotate Redis auth password
- [ ] Rotate Sentry DSN or formally accept no-Sentry launch risk
- [ ] Update GitHub staging secrets with all rotated values
- [ ] Rebuild Docker with the rotated values

### Git History Remediation

- [ ] Create a backup branch before history rewrite
- [ ] Remove historical `.env*` content using `git filter-repo`
- [ ] Review rewritten history locally
- [ ] Force push with lease only after review: `git push origin main --force-with-lease`
- [ ] Notify collaborators to re-clone or hard-reset after the rewrite

### Infrastructure

- [ ] VPS provisioned with Docker and Caddy or Nginx
- [ ] Supabase project created
- [ ] `DATABASE_URL` set for pooled application connections
- [ ] `DIRECT_DATABASE_URL` set for migrations
- [ ] `npx prisma migrate deploy` run against production database
- [ ] Pilot school data seeded
- [ ] Staging smoke test runbook executed

### Sign-Offs

- [ ] Engineering Lead sign-off: ********\_\_\_******** Date: **\_\_\_**
- [ ] Product Manager sign-off: ********\_\_\_\_******** Date: **\_\_\_**
- [ ] School admin has completed login and order-flow smoke test

---

## Pilot Monitoring Plan

Monitor daily during week 1:

- `/health/ready` status for DB and Redis dependency health
- Sentry error volume, if Sentry is configured
- Order success rate, target greater than 95%
- Payment completion rate, target greater than 90%
- Kitchen workflow completion and cancellation trends

Escalate to the on-call engineer if any metric drops below target.

---

## Pilot Success Criteria

Evaluate after four weeks:

- [ ] At least 10 parent accounts registered and ordering
- [ ] At least 100 orders placed successfully
- [ ] Zero payment failures caused by platform bugs
- [ ] Kitchen staff workflow rating at least 4 out of 5
- [ ] Parent NPS at least 7 out of 10
- [ ] Zero security incidents

If all criteria are met, proceed to Phase 2 planning for WhatsApp, WebSocket live push, i18n, and richer scheduling.
