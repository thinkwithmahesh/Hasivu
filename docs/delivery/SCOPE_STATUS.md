# HASIVU pilot — scope status

| Area                       | Status    | Notes                                                      |
| -------------------------- | --------- | ---------------------------------------------------------- |
| **Parent ordering**        | Completed | Menu, cart, checkout, orders, children                     |
| **Student profile / RFID** | Completed | Profile, RFID verification UI; pickup flow testable        |
| **Kitchen dashboard**      | Completed | Queue, kitchen-management, inventory/menu routes           |
| **Admin dashboard**        | Completed | Users, schedule, feature flags, analytics entry            |
| **Vendor dashboard**       | Partial   | Dashboard + orders/inventory/forecasting; some sample data |
| **Menu management**        | Completed | Daily menu, admin menu paths                               |
| **Payments**               | Completed | Razorpay test keys; webhook path in backend                |
| **Notifications**          | Partial   | Email/backend service; no WhatsApp pilot                   |
| **Analytics**              | Partial   | BI/Lambda analytics quarantined; basic admin analytics UI  |
| **Deployment**             | Completed | Docker compose dev/prod, VPS scripts, runbooks             |

## Deferred (not pilot)

| Feature                           | Decision                           |
| --------------------------------- | ---------------------------------- |
| WhatsApp Business                 | Phase 2 — `WHATSAPP_MODE=disabled` |
| Wallet / subscriptions / invoices | Phase 2 — feature flags off        |
| Realtime WebSocket                | Phase 2 — polling fallback         |
| i18n (Hindi/Kannada)              | Post-MVP                           |
| React Native app                  | Not in this repo path              |
| Calendar drag-drop scheduler      | PRD target; not implemented        |
| `legacy/` serverless Lambdas      | Quarantined                        |

## Known limitations

- Some dashboards use demo/sample metrics until wired to live analytics APIs.
- Teacher/super-admin roles removed from product; legacy JWT values may map to admin/school-admin.
- Playwright a11y CI requires reachable preview URL (see `docs/quality/PLAYWRIGHT_A11Y_CI_SETUP.md`).

## External services

| Service              | Required for pilot                |
| -------------------- | --------------------------------- |
| PostgreSQL           | Yes (Docker or Supabase)          |
| Redis                | Yes (Docker)                      |
| Razorpay             | Yes (test keys for payment E2E)   |
| SMTP / email         | Optional for notifications        |
| Sentry               | Optional                          |
| AWS Lambda / Cognito | Not required (legacy quarantined) |

## Manual steps before production

1. Rotate any secret ever committed in old history (see `docs/delivery/SECRETS_AND_HISTORY.md`).
2. Set production env via secret manager — never commit `.env.production`.
3. Run `prisma migrate deploy` against production DB.
4. Complete `docs/pilot/PILOT_LAUNCH_CHECKLIST.md` sign-off.
