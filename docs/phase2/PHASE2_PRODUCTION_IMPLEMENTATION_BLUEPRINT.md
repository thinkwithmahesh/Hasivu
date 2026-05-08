# Hasivu Phase 2 Production Implementation Blueprint

**Date:** 2026-05-09  
**Decision owner:** Engineering  
**Runtime:** Express + Next.js App Router + Prisma + PostgreSQL + Redis + Docker VPS  
**Status:** Implementation contract. This document intentionally replaces Phase 2 demo/stub behavior with production-grade boundaries, rollout gates, and fallback paths.

## A. Executive Scope Definition

### What Phase 2 Includes

Phase 2 promotes the previously quarantined services into real product modules without destabilizing the pilot launch path:

| Module                   | Business purpose                                                                                   | Phase 2 outcome                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Real-time updates        | Give kitchen/admin/parent users timely order, payment, schedule, and communication status changes. | Authenticated Socket.IO service with room-scoped events and polling fallback.            |
| Wallet                   | Let parents keep school meal credit, handle refunds, and reduce repeated small payment friction.   | Double-entry-style ledger with idempotent credit/debit/top-up/refund operations.         |
| Invoices                 | Produce auditable billing records for orders, subscriptions, and school finance teams.             | Immutable invoice generation, retrieval, sending, and payment linkage.                   |
| Subscriptions            | Support recurring meal plans with Razorpay recurring billing and webhook-driven state sync.        | Plan/subscription lifecycle, renewal, dunning, cancellation, invoice issuance.           |
| WhatsApp Business        | Add India-native parent communication without making Meta approval a launch blocker.               | Dual-mode integration: production WhatsApp when approved, fallback-first mode otherwise. |
| Meal scheduling calendar | Let admins plan daily/weekly menus, cutoffs, recurrence, exceptions, and kitchen demand.           | Calendar CRUD, recurrence, conflict validation, publication, demand projection.          |
| AI meal recommendations  | Improve menu discovery and planning while staying explainable and safe.                            | Rule-based baseline first; auditable recommendations, explanations, feedback, staged ML. |

### Explicitly Out of Scope

| Out of scope                                | Decision                                                                           |
| ------------------------------------------- | ---------------------------------------------------------------------------------- |
| React Native application                    | Rejected for Phase 2. Web-first remains canonical.                                 |
| Stripe secondary gateway                    | Rejected for Phase 2. Razorpay remains India-first billing path.                   |
| Federated learning / autonomous ML platform | Rejected as scope creep. Recommendations are controlled and auditable.             |
| Medical or therapeutic nutrition advice     | Rejected. The system may show preference/allergen/balanced-menu explanations only. |
| WhatsApp-only critical flows                | Rejected. Every user-critical flow must work via in-app and email fallback.        |
| External ERP/accounting sync                | Backlog only after invoice stability.                                              |
| Bank-like wallet withdrawals                | Rejected. Wallet is school meal credit only, not a stored-value banking product.   |

### Dependencies And Risks

| Dependency or risk                                                                                                                  | Mitigation                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Meta WhatsApp Business approval can be delayed by business verification, phone setup, display name approval, and template approval. | Ship `WHATSAPP_MODE=disabled/sandbox/production`; product flows use in-app/email first and WhatsApp as an optional channel.   |
| Razorpay recurring mandate behavior and webhook timing can vary.                                                                    | Treat Razorpay as source for gateway events, but local subscription state changes only through idempotent webhook processing. |
| Existing services named `wallet.service.ts`, `invoice.service.ts`, `subscription.service.ts`, and `websocket.service.ts` are stubs. | Replace them behind stable interfaces; do not route traffic to fake implementations.                                          |
| Meal recurrence and cutoff rules can create hidden edge cases.                                                                      | Store recurrence rules and exceptions explicitly; validate conflicts before publish.                                          |
| AI recommendations can appear authoritative.                                                                                        | Start with deterministic rules, confidence thresholds, explanations, and “not medical advice” boundaries.                     |
| WebSocket horizontal scaling requires shared state.                                                                                 | Use Redis adapter when more than one backend instance runs; fallback to polling remains supported.                            |

## B. Architecture Decisions

### Target Module Architecture

Use a modular Express backend with Prisma repositories and thin Next.js BFF/proxy routes. Next.js API routes must not own Phase 2 business logic.

| Module                    | Target files                                                                                                               | Integrates with                                          | Boundary                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `websocket.service.ts`    | `src/realtime/realtime.server.ts`, `src/services/websocket.service.ts`, `src/realtime/events.ts`                           | auth, orders, kitchen, payments, scheduler, WhatsApp     | Publishes domain events; never mutates business state.                                 |
| `wallet.service.ts`       | `src/services/wallet.service.ts`, `src/repositories/wallet.repository.ts`, `src/routes/wallet.routes.ts`                   | payments, orders, refunds, invoices                      | Owns wallet balances through ledger entries only.                                      |
| `invoice.service.ts`      | `src/services/invoice.service.ts`, `src/repositories/invoice.repository.ts`, `src/routes/invoice.routes.ts`                | payments, orders, subscriptions, email notifications     | Owns invoice numbering, immutability, send/download state.                             |
| `subscription.service.ts` | `src/services/subscription.service.ts`, `src/repositories/subscription.repository.ts`, `src/routes/subscription.routes.ts` | Razorpay gateway, invoices, notifications, wallet policy | Owns local subscription lifecycle; gateway state enters through webhooks.              |
| `whatsapp.service.ts`     | `src/services/whatsapp.service.ts`, `src/repositories/whatsapp.repository.ts`, `src/routes/whatsapp.routes.ts`             | notifications, orders, RFID, subscriptions, scheduler    | Owns WhatsApp provider communication, opt-in proof, message logs, fallback scheduling. |
| meal scheduler            | `src/modules/meal-scheduler/*`, `src/routes/meal-scheduler.routes.ts`                                                      | menus, kitchen, orders, notifications, recommendations   | Owns schedule publication, recurrence, cutoff, demand projection.                      |
| AI recommendations        | `src/modules/recommendations/*`, `src/routes/recommendation.routes.ts`                                                     | menu, orders, preferences, scheduler                     | Owns ranked recommendations and audit trail; does not create orders.                   |

### Domain Boundaries

- Auth service remains the identity and role authority.
- Menu service owns menu item facts: price, allergens, availability, nutrition metadata.
- Meal scheduler owns when/where menu items are offered.
- Order service owns cart-to-order conversion and order state.
- Payment service owns Razorpay one-time payment state.
- Subscription service owns recurring entitlement state and delegates money movement to Razorpay.
- Wallet service owns internal meal credit balances and never stores card/UPI credentials.
- Invoice service owns immutable billing records.
- Notification service orchestrates channels; WhatsApp service is one provider behind that boundary.
- Realtime service broadcasts events after domain state is committed.

### Anti-Corruption Layers

| External system                         | Adapter                                 | Rule                                                                                                                        |
| --------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Razorpay one-time and recurring billing | `src/integrations/razorpay/*`           | Convert Razorpay payloads into internal `PaymentEvent` and `SubscriptionBillingEvent`; verify signatures before processing. |
| WhatsApp Cloud API                      | `src/integrations/whatsapp/*`           | Convert template/message webhooks into internal message status events; never expose provider payloads directly to UI.       |
| Recommendation engine                   | `src/modules/recommendations/engines/*` | Start with `RuleBasedRecommendationEngine`; ML/LLM engines must implement same interface and confidence contract.           |
| Redis queue                             | `src/jobs/*`                            | Domain services enqueue commands, workers execute side effects, outbox records remain source of delivery attempts.          |

### Event And Async Design

Use a transactional outbox plus Redis-backed workers. Domain writes complete first; side effects follow from outbox events.

| Event                                 | Produced by              | Consumers                                                                       |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------------------- |
| `order.created.v1`                    | order service            | invoice service, realtime, notification service, kitchen demand updater         |
| `order.status.changed.v1`             | order/kitchen service    | realtime, WhatsApp/email fallback, parent in-app notification                   |
| `payment.captured.v1`                 | payment webhook          | invoice service, wallet refund/top-up finalizer, realtime                       |
| `subscription.renewal.failed.v1`      | subscription webhook/job | dunning worker, notification service, invoice service                           |
| `meal_schedule.published.v1`          | meal scheduler           | kitchen demand projector, parent notification, recommendation cache invalidator |
| `whatsapp.message.failed.v1`          | WhatsApp webhook/worker  | fallback worker, admin communication dashboard                                  |
| `recommendation.feedback.recorded.v1` | recommendation service   | evaluation job                                                                  |

Jobs:

- `subscription-renewal-sync`: scheduled every 15 minutes, reconciles due cycles with Razorpay.
- `dunning-worker`: retries failed renewals and triggers fallback notifications.
- `whatsapp-dispatch-worker`: sends approved template messages when WhatsApp is enabled.
- `notification-fallback-worker`: sends email/in-app fallback when WhatsApp is unavailable or failed.
- `meal-schedule-publisher`: publishes schedules at configured times.
- `recommendation-refresh-worker`: computes cached recommendations nightly and after schedule publication.

## C. Data Model And Schema Changes

The existing Prisma schema already includes `Subscription`, `SubscriptionPlan`, `BillingCycle`, `Invoice`, `InvoiceItem`, `WhatsAppMessage`, `WhatsAppTemplate`, `MenuPlan`, `DailyMenu`, and `MenuItemSlot`. Phase 2 should extend rather than duplicate them.

### Prisma-Style Additions And Extensions

```prisma
model WalletAccount {
  id              String   @id @default(uuid())
  schoolId        String   @map("school_id")
  userId          String   @map("user_id")
  currency        String   @default("INR")
  status          String   @default("active")
  availableBalance Decimal @default(0) @map("available_balance")
  pendingBalance   Decimal @default(0) @map("pending_balance")
  version         Int      @default(1)
  deletedAt       DateTime? @map("deleted_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @default(now()) @updatedAt @map("updated_at")

  ledgerEntries WalletLedgerEntry[]

  @@unique([schoolId, userId, currency])
  @@index([schoolId, status])
  @@index([userId])
  @@map("wallet_accounts")
}

model WalletLedgerEntry {
  id              String   @id @default(uuid())
  walletAccountId String   @map("wallet_account_id")
  schoolId        String   @map("school_id")
  userId          String   @map("user_id")
  direction       String   // credit | debit
  entryType       String   @map("entry_type") // top_up | order_payment | refund | adjustment | reversal
  amount          Decimal
  currency        String   @default("INR")
  balanceAfter    Decimal  @map("balance_after")
  status          String   @default("posted") // pending | posted | reversed | failed
  referenceType   String?  @map("reference_type")
  referenceId     String?  @map("reference_id")
  idempotencyKey  String   @map("idempotency_key")
  reason          String?
  metadata        Json?
  createdBy       String?  @map("created_by")
  createdAt       DateTime @default(now()) @map("created_at")

  walletAccount WalletAccount @relation(fields: [walletAccountId], references: [id], onDelete: Restrict)

  @@unique([idempotencyKey])
  @@index([schoolId, userId, createdAt])
  @@index([referenceType, referenceId])
  @@index([status])
  @@map("wallet_ledger_entries")
}

model PaymentIdempotencyKey {
  id             String   @id @default(uuid())
  schoolId       String   @map("school_id")
  key            String
  operation      String
  requestHash    String   @map("request_hash")
  responseBody   Json?    @map("response_body")
  status         String   @default("processing")
  expiresAt      DateTime @map("expires_at")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @default(now()) @updatedAt @map("updated_at")

  @@unique([schoolId, key, operation])
  @@index([expiresAt])
  @@map("payment_idempotency_keys")
}

model WhatsAppOptIn {
  id             String   @id @default(uuid())
  schoolId       String   @map("school_id")
  userId         String   @map("user_id")
  phone          String
  source         String   // registration | settings | admin_upload | paper_form
  consentText    String   @map("consent_text")
  consentVersion String   @map("consent_version")
  ipAddress      String?  @map("ip_address")
  userAgent      String?  @map("user_agent")
  status         String   @default("active") // active | revoked
  revokedAt      DateTime? @map("revoked_at")
  createdAt      DateTime @default(now()) @map("created_at")

  @@unique([schoolId, userId, phone])
  @@index([phone, status])
  @@index([schoolId, status])
  @@map("whatsapp_opt_ins")
}

model WhatsAppTemplateMapping {
  id                 String   @id @default(uuid())
  schoolId           String?  @map("school_id")
  eventType          String   @map("event_type")
  templateName       String   @map("template_name")
  language           String   @default("en")
  fallbackTemplateId String?  @map("fallback_template_id")
  status             String   @default("pending_approval")
  isActive           Boolean  @default(false) @map("is_active")
  metadata           Json?
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @default(now()) @updatedAt @map("updated_at")

  @@unique([schoolId, eventType, language])
  @@index([status, isActive])
  @@map("whatsapp_template_mappings")
}

model MealSchedule {
  id              String   @id @default(uuid())
  schoolId        String   @map("school_id")
  name            String
  status          String   @default("draft") // draft | published | archived
  timezone        String   @default("Asia/Kolkata")
  effectiveFrom   DateTime @map("effective_from")
  effectiveTo     DateTime? @map("effective_to")
  recurrenceRule  String?  @map("recurrence_rule")
  targetType      String   @map("target_type") // school | class | group
  targetId        String?  @map("target_id")
  cutoffMinutes   Int      @default(180) @map("cutoff_minutes")
  createdBy       String   @map("created_by")
  publishedBy     String?  @map("published_by")
  publishedAt     DateTime? @map("published_at")
  deletedAt       DateTime? @map("deleted_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @default(now()) @updatedAt @map("updated_at")

  slots      MealScheduleSlot[]
  exceptions MealScheduleException[]

  @@index([schoolId, status, effectiveFrom])
  @@index([targetType, targetId])
  @@map("meal_schedules")
}

model MealScheduleSlot {
  id             String   @id @default(uuid())
  mealScheduleId String   @map("meal_schedule_id")
  menuItemId     String   @map("menu_item_id")
  slot           String   // breakfast | lunch | snack
  serviceDate    DateTime @map("service_date")
  availableFrom  DateTime? @map("available_from")
  availableTo    DateTime? @map("available_to")
  plannedQuantity Int?    @map("planned_quantity")
  maxPerStudent   Int?    @map("max_per_student")
  priceOverride   Decimal? @map("price_override")
  kitchenNotes    String? @map("kitchen_notes")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @default(now()) @updatedAt @map("updated_at")

  schedule MealSchedule @relation(fields: [mealScheduleId], references: [id], onDelete: Cascade)

  @@unique([mealScheduleId, serviceDate, slot, menuItemId])
  @@index([serviceDate, slot])
  @@index([menuItemId])
  @@map("meal_schedule_slots")
}

model MealScheduleException {
  id             String   @id @default(uuid())
  mealScheduleId String   @map("meal_schedule_id")
  exceptionDate  DateTime @map("exception_date")
  exceptionType  String   @map("exception_type") // closed | modified | cutoff_override
  replacementSlotId String? @map("replacement_slot_id")
  reason         String
  createdBy      String   @map("created_by")
  createdAt      DateTime @default(now()) @map("created_at")

  schedule MealSchedule @relation(fields: [mealScheduleId], references: [id], onDelete: Cascade)

  @@unique([mealScheduleId, exceptionDate, exceptionType])
  @@index([exceptionDate])
  @@map("meal_schedule_exceptions")
}

model RecommendationRun {
  id             String   @id @default(uuid())
  schoolId       String   @map("school_id")
  userId         String?  @map("user_id")
  studentId      String?  @map("student_id")
  engineVersion  String   @map("engine_version")
  mode           String   @default("rule_based") // rule_based | ml
  inputHash      String   @map("input_hash")
  confidence     Float
  status         String   @default("completed")
  explanation    Json
  createdAt      DateTime @default(now()) @map("created_at")

  items RecommendationItem[]

  @@index([schoolId, userId, createdAt])
  @@index([studentId, createdAt])
  @@map("recommendation_runs")
}

model RecommendationItem {
  id              String   @id @default(uuid())
  recommendationRunId String @map("recommendation_run_id")
  menuItemId      String   @map("menu_item_id")
  rank            Int
  score           Float
  reasons         Json
  safeguards      Json?
  createdAt       DateTime @default(now()) @map("created_at")

  run RecommendationRun @relation(fields: [recommendationRunId], references: [id], onDelete: Cascade)

  @@unique([recommendationRunId, menuItemId])
  @@index([menuItemId])
  @@map("recommendation_items")
}

model RecommendationFeedback {
  id              String   @id @default(uuid())
  schoolId        String   @map("school_id")
  userId          String   @map("user_id")
  studentId       String?  @map("student_id")
  recommendationItemId String @map("recommendation_item_id")
  action          String   // accepted | dismissed | hidden | reported
  reason          String?
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([schoolId, userId, createdAt])
  @@index([recommendationItemId])
  @@map("recommendation_feedback")
}

model OutboxEvent {
  id             String   @id @default(uuid())
  schoolId       String?  @map("school_id")
  eventType      String   @map("event_type")
  aggregateType  String   @map("aggregate_type")
  aggregateId    String   @map("aggregate_id")
  payload        Json
  status         String   @default("pending")
  attempts       Int      @default(0)
  nextAttemptAt  DateTime? @map("next_attempt_at")
  lastError      String?  @map("last_error")
  createdAt      DateTime @default(now()) @map("created_at")
  processedAt    DateTime? @map("processed_at")

  @@index([status, nextAttemptAt])
  @@index([aggregateType, aggregateId])
  @@map("outbox_events")
}
```

### Existing Model Extensions

| Existing model                         | Required extension                                                                                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Subscription`                         | Add `razorpaySubscriptionId`, `razorpayPlanId`, `cancelAtCycleEnd`, `pausedAt`, `resumedAt`, `lastWebhookEventId`, `metadata Json?`, indexes on `schoolId/status/nextBillingDate`. |
| `SubscriptionPlan`                     | Add `razorpayPlanId`, `billingInterval`, `billingIntervalCount`, `metadata Json?`, index on `schoolId/isActive`.                                                                   |
| `BillingCycle`                         | Add `idempotencyKey`, `razorpayInvoiceId`, `razorpayPaymentId`, unique index on `idempotencyKey`.                                                                                  |
| `Invoice`                              | Add `sourceType`, `sourceId`, `idempotencyKey`, `voidedAt`, `voidReason`, unique index on `schoolId/idempotencyKey`.                                                               |
| `WhatsAppMessage`                      | Add `schoolId`, `notificationId`, `fallbackChannel`, `fallbackTriggeredAt`, `providerPayload Json?`, indexes on `schoolId/status/createdAt`.                                       |
| `DailyMenu`                            | Current `date @unique` must become `@@unique([schoolId, date])` to support multi-school schedules.                                                                                 |
| `MenuPlan`/`DailyMenu` metadata fields | Prefer Prisma `Json` over stringified JSON in a future migration; Phase 2 can add new Json fields without immediate destructive conversion.                                        |

Soft-delete policy:

- Business records with audit value (`Invoice`, `WalletLedgerEntry`, `Subscription`, `WhatsAppMessage`, `RecommendationRun`) are never hard deleted.
- Planning records (`MealSchedule`) use `deletedAt`.
- Ephemeral idempotency rows can expire after 30 to 90 days.

## D. API Design

All Phase 2 APIs live under Express `/api/v1/*`. Next.js routes may proxy but must not implement independent business behavior. All responses use:

```ts
type ApiSuccess<T> = { success: true; data: T; requestId: string };
type ApiFailure = {
  success: false;
  error: { code: string; message: string; details?: unknown };
  requestId: string;
};
```

### 1. WebSocket Auth And Event Channels

| Method | Path                      | Purpose                                                                                 |
| ------ | ------------------------- | --------------------------------------------------------------------------------------- |
| `GET`  | `/api/v1/realtime/token`  | Issue a 60-second one-use realtime connection token for the current authenticated user. |
| `GET`  | `/api/v1/realtime/events` | Polling fallback for events after `cursor`.                                             |

Auth:

- Requires httpOnly cookie session.
- Token claims: `sub`, `schoolId`, `role`, `rooms`, `exp`, `jti`.
- Rate limit: 30 token requests/user/minute.

WebSocket:

- Namespace: `/realtime`
- Auth: realtime token during handshake.
- Rooms:
  - `school:{schoolId}:admin`
  - `school:{schoolId}:kitchen`
  - `user:{userId}`
  - `student:{studentId}:parent`
  - `order:{orderId}`

Failure responses:

- `401 AUTH_REQUIRED`
- `403 REALTIME_ROOM_DENIED`
- `429 RATE_LIMITED`

### 2. Wallet Endpoints

| Method | Path                                     | Body                                             | Auth                        | Idempotency                |
| ------ | ---------------------------------------- | ------------------------------------------------ | --------------------------- | -------------------------- |
| `GET`  | `/api/v1/wallet`                         | none                                             | parent/admin scoped         | none                       |
| `GET`  | `/api/v1/wallet/ledger?cursor=&limit=`   | none                                             | owner/admin                 | none                       |
| `POST` | `/api/v1/wallet/top-ups`                 | `{ amount, currency, returnUrl }`                | parent                      | `Idempotency-Key` required |
| `POST` | `/api/v1/wallet/top-ups/:id/verify`      | `{ razorpayPaymentId, razorpaySignature }`       | parent                      | Razorpay payment id unique |
| `POST` | `/api/v1/wallet/debits`                  | `{ amount, referenceType, referenceId, reason }` | internal/order service only | `Idempotency-Key` required |
| `POST` | `/api/v1/wallet/credits`                 | `{ amount, referenceType, referenceId, reason }` | admin/system only           | `Idempotency-Key` required |
| `POST` | `/api/v1/wallet/ledger/:entryId/reverse` | `{ reason }`                                     | admin/system only           | entry reversal unique      |

Validation:

- Amount must be positive, INR only for launch.
- Debit cannot take available balance below zero.
- Parent can only access own wallet.
- Admin can access only same-school wallets.

Failures:

- `400 WALLET_AMOUNT_INVALID`
- `402 WALLET_INSUFFICIENT_FUNDS`
- `409 IDEMPOTENCY_CONFLICT`
- `409 WALLET_ENTRY_ALREADY_REVERSED`

### 3. Invoice Endpoints

| Method | Path                                   | Body                                  | Auth         | Idempotency                         |
| ------ | -------------------------------------- | ------------------------------------- | ------------ | ----------------------------------- |
| `POST` | `/api/v1/invoices/generate`            | `{ sourceType, sourceId, userId? }`   | admin/system | `Idempotency-Key` required          |
| `GET`  | `/api/v1/invoices`                     | query filters                         | parent/admin | none                                |
| `GET`  | `/api/v1/invoices/:invoiceId`          | none                                  | owner/admin  | none                                |
| `GET`  | `/api/v1/invoices/:invoiceId/download` | none                                  | owner/admin  | none                                |
| `POST` | `/api/v1/invoices/:invoiceId/send`     | `{ channels: ["email", "whatsapp"] }` | admin/owner  | message send idempotent per channel |
| `POST` | `/api/v1/invoices/:invoiceId/void`     | `{ reason }`                          | admin only   | void once                           |

Rules:

- Generated invoices are immutable except status/send metadata.
- Invoice number allocated from per-school sequence.
- Void creates audit entry; it does not delete invoice rows.

Failures:

- `404 INVOICE_NOT_FOUND`
- `409 INVOICE_ALREADY_EXISTS`
- `409 INVOICE_ALREADY_VOIDED`

### 4. Subscription Lifecycle Endpoints

| Method | Path                               | Body                                                           | Auth                                |
| ------ | ---------------------------------- | -------------------------------------------------------------- | ----------------------------------- |
| `GET`  | `/api/v1/subscription-plans`       | none                                                           | authenticated school user           |
| `POST` | `/api/v1/subscription-plans`       | `{ name, price, billingCycle, mealsPerWeek, trialPeriodDays }` | admin                               |
| `POST` | `/api/v1/subscriptions`            | `{ planId, studentId?, paymentMethodId?, returnUrl }`          | parent/admin                        |
| `GET`  | `/api/v1/subscriptions/:id`        | none                                                           | owner/admin                         |
| `POST` | `/api/v1/subscriptions/:id/cancel` | `{ cancelAtCycleEnd, reason }`                                 | owner/admin                         |
| `POST` | `/api/v1/subscriptions/:id/pause`  | `{ resumeAt?, reason }`                                        | admin/owner if policy enabled       |
| `POST` | `/api/v1/subscriptions/:id/resume` | `{ reason }`                                                   | admin/owner                         |
| `POST` | `/api/v1/webhooks/razorpay`        | raw Razorpay payload                                           | signature verified, no user session |

Idempotency:

- `POST /subscriptions` requires `Idempotency-Key`.
- Webhooks dedupe by Razorpay event id.
- Billing cycles dedupe by subscription id + cycle number.

Failures:

- `400 SUBSCRIPTION_POLICY_INVALID`
- `402 MANDATE_AUTH_REQUIRED`
- `409 SUBSCRIPTION_ALREADY_ACTIVE`
- `409 WEBHOOK_REPLAY_DETECTED`

Rate limits:

- Subscription create/cancel: 10/user/hour.
- Webhook endpoint: IP/provider signature-gated plus burst limit.

### 5. WhatsApp Endpoints

| Method | Path                                            | Body                                               | Auth                        |
| ------ | ----------------------------------------------- | -------------------------------------------------- | --------------------------- | -------- | ------------ |
| `POST` | `/api/v1/whatsapp/opt-in`                       | `{ phone, consentText, consentVersion, source }`   | user/admin                  |
| `POST` | `/api/v1/whatsapp/opt-out`                      | `{ phone, reason? }`                               | user/admin                  |
| `GET`  | `/api/v1/whatsapp/messages`                     | query filters                                      | admin/user scoped           |
| `POST` | `/api/v1/whatsapp/templates/:eventType/trigger` | `{ recipientUserId, variables, fallbackRequired }` | system/admin                |
| `POST` | `/api/v1/whatsapp/messages/:id/fallback`        | `{ channel: "email"                                | "in_app"                    | "sms" }` | admin/system |
| `GET`  | `/api/v1/webhooks/whatsapp`                     | Meta verification query                            | signed verify token         |
| `POST` | `/api/v1/webhooks/whatsapp`                     | provider webhook                                   | provider signature verified |

Feature behavior:

- If `WHATSAPP_MODE=disabled`, trigger returns `202` with `status=fallback_scheduled`.
- If template not approved, trigger returns `202` with fallback and records `template_unavailable`.
- No checkout/order flow waits on WhatsApp success.

Failures:

- `403 WHATSAPP_OPT_IN_REQUIRED`
- `409 WHATSAPP_TEMPLATE_NOT_APPROVED`
- `503 WHATSAPP_PROVIDER_UNAVAILABLE`

### 6. Meal Calendar Endpoints

| Method   | Path                                                     | Body                                                                                               | Auth                        |
| -------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------- |
| `GET`    | `/api/v1/meal-schedules?from=&to=&targetType=&targetId=` | none                                                                                               | admin/kitchen/parent scoped |
| `POST`   | `/api/v1/meal-schedules`                                 | `{ name, effectiveFrom, effectiveTo, recurrenceRule, targetType, targetId, slots, cutoffMinutes }` | admin                       |
| `GET`    | `/api/v1/meal-schedules/:id`                             | none                                                                                               | school scoped               |
| `PATCH`  | `/api/v1/meal-schedules/:id`                             | partial draft updates                                                                              | admin                       |
| `POST`   | `/api/v1/meal-schedules/:id/publish`                     | `{ notifyParents }`                                                                                | admin                       |
| `POST`   | `/api/v1/meal-schedules/:id/exceptions`                  | `{ date, exceptionType, replacementSlotId?, reason }`                                              | admin                       |
| `DELETE` | `/api/v1/meal-schedules/:id`                             | none                                                                                               | admin, draft only           |
| `GET`    | `/api/v1/meal-schedules/demand?from=&to=`                | none                                                                                               | admin/kitchen               |
| `GET`    | `/api/v1/meal-schedules/export?from=&to=&format=csv`     | none                                                                                               | admin/kitchen               |

Validation:

- `effectiveFrom` and slot dates use school timezone.
- A published schedule cannot be edited inside cutoff except by explicit admin override with audit reason.
- No duplicate item in same date/slot/target.
- Recurrence expansion capped to 180 days per request.

Failures:

- `409 SCHEDULE_CONFLICT`
- `409 CUTOFF_LOCKED`
- `400 RECURRENCE_INVALID`

### 7. AI Recommendation Endpoints

| Method | Path                                                   | Body                      | Auth                        |
| ------ | ------------------------------------------------------ | ------------------------- | --------------------------- |
| `GET`  | `/api/v1/recommendations/meals?studentId=&date=&slot=` | none                      | parent/student/admin scoped |
| `GET`  | `/api/v1/recommendations/:runId/explanation`           | none                      | owner/admin                 |
| `POST` | `/api/v1/recommendations/:itemId/feedback`             | `{ action, reason? }`     | user/admin                  |
| `POST` | `/api/v1/recommendations/admin/refresh`                | `{ schoolId, dateRange }` | admin/system                |
| `GET`  | `/api/v1/recommendations/admin/evaluation`             | query filters             | admin                       |

Rules:

- If confidence below threshold, response includes available/popular fallback with `mode=fallback`.
- Recommendations cannot claim disease prevention, treatment, or medical suitability.
- All explanations must cite deterministic factors: preference, allergen exclusion, availability, price, variety, past acceptance.

Failures:

- `404 RECOMMENDATION_NOT_FOUND`
- `422 RECOMMENDATION_INPUT_INSUFFICIENT`
- `503 RECOMMENDATION_ENGINE_DISABLED`

## E. WhatsApp Integration Strategy

### Dual-Mode Approach

| Mode                  | Env                                                   | Behavior                                                                                    |
| --------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Approved production   | `WHATSAPP_MODE=production`, approved templates active | Send WhatsApp template messages through Cloud API and track delivery/read/failure webhooks. |
| Pre-approval/degraded | `WHATSAPP_MODE=disabled` or `sandbox`                 | Capture opt-ins and queue/log intended messages, but deliver via email/in-app fallback.     |

### Approval Dependencies

- Business verification approval.
- Display name approval.
- Phone number setup and ownership.
- Template approval per language/category.
- Compliance with opt-in and category rules.

These dependencies must not block:

- placing orders
- payment completion
- RFID delivery verification
- subscription activation
- invoice issuance
- kitchen preparation workflow

### Opt-In Capture

- Capture during registration/settings/admin import.
- Store `phone`, consent text, consent version, source, IP, user agent, timestamp.
- Support opt-out and revocation.
- Admin upload requires proof source (`paper_form` or `school_consent_record`).

### Message Categories

Transactional only for Phase 2:

- order confirmed
- order status changed
- meal ready/picked up
- RFID delivery verified
- payment captured/failed
- subscription renewal failed
- invoice issued
- schedule published

Marketing/promotional messages remain out of scope.

### Retry And Fallback

| Condition                 | Action                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| WhatsApp disabled         | create message log as `fallback_scheduled`; send in-app + email.       |
| No opt-in                 | do not call WhatsApp; send in-app + email.                             |
| Template pending/rejected | do not call WhatsApp; send fallback and expose admin status.           |
| Provider 429/5xx          | retry with exponential backoff up to 3 attempts, then fallback.        |
| Delivery failed webhook   | mark failed, trigger fallback, show reason in admin communication log. |
| Read status absent        | no product action; read receipts are observability only.               |

### Admin Visibility

Admin communication view must show:

- intended channel
- actual channel
- template
- provider status
- fallback status
- error reason
- timestamps
- opt-in status

## F. Subscription And Billing Lifecycle

### Razorpay Recurring Billing Flow

1. Admin creates Hasivu `SubscriptionPlan`.
2. Backend creates/links Razorpay recurring plan and stores `razorpayPlanId`.
3. Parent starts subscription.
4. Backend creates Razorpay subscription/mandate authorization and returns checkout/auth URL.
5. Razorpay webhook activates subscription.
6. Backend marks local subscription active and creates first billing cycle/invoice.
7. Renewal webhooks drive payment success/failure state.
8. Dunning worker handles failed renewal retries and parent notifications.
9. Cancellation/pause/resume update local state first as `pending_gateway_sync`, then reconcile via webhook/API.

### States

Subscription:

- `draft`
- `pending_mandate`
- `active`
- `past_due`
- `paused`
- `cancel_pending`
- `cancelled`
- `suspended`
- `expired`

Billing cycle:

- `pending`
- `invoice_created`
- `payment_pending`
- `paid`
- `failed`
- `retrying`
- `written_off`

### Dunning

- Attempt 1: immediate email/in-app/WhatsApp-if-enabled.
- Attempt 2: after 1 day.
- Attempt 3: after 3 days.
- Suspension: after configured grace period.
- Admin override can extend grace period with audit reason.

### Wallet Interaction Rules

- Wallet may pay one-time meal orders.
- Wallet may receive refunds for failed/cancelled orders if school policy allows.
- Subscription recurring charges use Razorpay mandate by default.
- Wallet credit can offset subscription invoice only when `SUBSCRIPTION_WALLET_OFFSET_ENABLED=true` and parent explicitly opts in.
- Wallet ledger entries must reference invoice/order/subscription cycle id.

### Reconciliation And Idempotency

- Every Razorpay webhook stores provider event id.
- Duplicate event ids return `200` with `duplicate=true`.
- Conflicting gateway/local state creates a reconciliation task, not silent overwrite.
- Invoice generation uses source idempotency key: `invoice:{sourceType}:{sourceId}`.

## G. Meal Scheduling Calendar

### Capabilities

- Daily and weekly calendar views.
- Schedule by school/class/group.
- Support breakfast/lunch/snack slots.
- Link each slot to menu item and optional price override.
- Recurrence via RRULE-like string stored on `MealSchedule`.
- Exceptions for holidays, substitutions, closures, and cutoff overrides.
- Cutoff enforcement based on school timezone.
- Kitchen demand projection by date, slot, item, class/group.
- CSV export for kitchen prep.
- Audit trail for create/update/publish/exception/override.

### Conflict Validation

Reject schedule publish when:

- duplicate item/slot/date/target exists
- menu item inactive or not visible
- item allergen metadata missing for schools requiring allergen disclosure
- planned quantity is lower than already ordered quantity
- cutoff time is in the past without override reason
- recurrence expands beyond configured maximum window

### Kitchen Visibility

Kitchen users see:

- next 7 days demand
- today by slot/status
- allergen warnings
- prep deadlines
- last schedule update timestamp

## H. AI Meal Recommendations

### Goals

- Help parents find suitable available meals quickly.
- Help admins identify menu variety and demand patterns.
- Help students discover acceptable options without medical claims.

### Inputs

- Published schedule availability.
- Menu item tags, allergens, ingredients, price, meal type.
- Student preferences/allergen exclusions.
- Past orders and accepted/dismissed recommendations.
- School/class constraints.
- Time of day and cutoff status.

### Engine Strategy

Phase 2 starts with `RuleBasedRecommendationEngine`:

- exclude unavailable/cutoff-locked items
- exclude known allergens
- rank by preference match, variety, past acceptance, price fit, and freshness
- return confidence and reasons

ML/LLM enhancement can be added behind `RECOMMENDATION_ENGINE=ml` only after offline evaluation.

### Explainability

Allowed explanations:

- “Available for lunch today.”
- “Matches vegetarian preference.”
- “Avoids listed allergen: peanut.”
- “Adds variety compared with recent orders.”
- “Within usual meal budget.”

Disallowed:

- disease/medical treatment claims
- unsupported nutrition superiority claims
- hallucinated ingredient or calorie claims

### Low-Confidence Fallback

When confidence is below threshold:

- show popular available meals
- show admin-curated items
- label response as `fallback`
- do not personalize beyond explicit allergen exclusion

### Logging And Evaluation

Store:

- input hash
- engine version
- reasons
- confidence
- item ranks
- feedback action
- acceptance/conversion rate

## I. Real-Time Updates

### Where Real-Time Adds Value

- Kitchen order queue and status updates.
- Parent order status after payment/prep/RFID.
- Admin operational dashboard.
- Payment status during checkout.
- Meal schedule publication/change alerts.
- WhatsApp delivery/fallback status for admin troubleshooting.

### Connection Lifecycle

1. Browser calls `/api/v1/realtime/token`.
2. Browser connects to `/realtime` with one-use token.
3. Backend validates token and joins allowed rooms.
4. Backend emits `connection.ready.v1`.
5. Client maintains cursor for missed events.
6. On reconnect, client calls polling fallback with last cursor.

### Event Schema

```ts
export interface RealtimeEvent<TPayload = unknown> {
  id: string;
  schemaVersion: 'v1';
  type:
    | 'order.created'
    | 'order.status.changed'
    | 'payment.status.changed'
    | 'subscription.status.changed'
    | 'meal_schedule.published'
    | 'whatsapp.status.changed'
    | 'recommendation.refresh.completed';
  schoolId: string;
  room: string;
  aggregateId: string;
  occurredAt: string;
  payload: TPayload;
}
```

### Rate Protection

- Max 5 client-originated messages/second.
- Server-originated broadcasts only from outbox/verified service events.
- Payload size cap: 16 KB.
- Disconnect on unauthorized room join attempt.

## J. Rollout Plan

### Migration Order

1. Add additive Prisma tables/columns.
2. Deploy code with feature flags off.
3. Run migrations in staging.
4. Backfill invoice/source ids and wallet accounts for pilot users.
5. Dark launch workers with dry-run mode.
6. Enable admin-only read paths.
7. Enable one school at a time.
8. Enable parent-facing paths after E2E and support readiness.

### Feature Flags

| Flag                                 | Default                                  |
| ------------------------------------ | ---------------------------------------- |
| `REALTIME_ENABLED`                   | false                                    |
| `WALLET_ENABLED`                     | false                                    |
| `INVOICE_ENABLED`                    | true for admin read, false for auto-send |
| `SUBSCRIPTIONS_ENABLED`              | false                                    |
| `WHATSAPP_MODE`                      | disabled                                 |
| `MEAL_SCHEDULER_ENABLED`             | false                                    |
| `RECOMMENDATIONS_ENABLED`            | false                                    |
| `RECOMMENDATION_ENGINE`              | rule_based                               |
| `SUBSCRIPTION_WALLET_OFFSET_ENABLED` | false                                    |

### Environment Variables

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `WHATSAPP_MODE`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
- `WHATSAPP_APP_SECRET`
- `REDIS_URL`
- `REALTIME_TOKEN_SECRET`
- `JOB_WORKER_CONCURRENCY`
- `RECOMMENDATION_ENGINE`
- `RECOMMENDATION_MIN_CONFIDENCE`

### Staging Checklist

- Prisma migration applies cleanly.
- Webhook contract tests pass with recorded Razorpay/WhatsApp fixtures.
- Feature flags off: legacy pilot paths unchanged.
- Feature flags on for test school: all Phase 2 E2E pass.
- Queue workers process jobs and dead-letter failures.
- Admin can see communication and billing status.

### Rollback Strategy

- Feature flags off first.
- Stop workers.
- Keep additive schema; do not drop tables during incident rollback.
- Reverse route exposure in Next proxy if needed.
- Reconcile partially processed outbox events before re-enable.

## K. Testing Strategy

### Release-Blocking Tests

- Unit tests for services, repositories, validators, and event mappers.
- Integration tests with Postgres/Redis for wallet ledger concurrency.
- Razorpay webhook signature and idempotency tests.
- WhatsApp webhook verification and fallback tests.
- Meal schedule conflict/cutoff/recurrence tests.
- Recommendation safety and fallback tests.
- WebSocket auth, room authorization, reconnect, and polling fallback tests.
- E2E:
  - parent wallet top-up and order payment
  - subscription create/mandate return/webhook activation
  - invoice generation and retrieval
  - admin schedule publish and kitchen demand view
  - parent recommendation display and feedback
  - WhatsApp disabled mode fallback

### Non-Blocking But Required Before Scale

- Load test kitchen realtime updates during lunch peak.
- Long-running dunning/reconciliation soak test.
- Multi-school tenant isolation fuzz tests.
- Recommendation offline evaluation dashboard.

### Failure Injection

- Razorpay webhook duplicate/reordered events.
- WhatsApp 429/5xx and template rejected.
- Redis unavailable.
- DB transaction conflict in wallet debit.
- Worker crash after side effect but before outbox mark processed.

## L. Observability And Operations

### Structured Logs

Every Phase 2 log includes:

- `requestId`
- `schoolId`
- `userId` when available
- `module`
- `operation`
- `aggregateId`
- `providerEventId` when applicable
- `idempotencyKey` when applicable

### Metrics

| Metric                                  | Type    |
| --------------------------------------- | ------- |
| `wallet_ledger_post_total`              | counter |
| `wallet_debit_insufficient_funds_total` | counter |
| `invoice_generated_total`               | counter |
| `subscription_renewal_failed_total`     | counter |
| `subscription_dunning_attempt_total`    | counter |
| `whatsapp_message_sent_total`           | counter |
| `whatsapp_fallback_total`               | counter |
| `meal_schedule_publish_total`           | counter |
| `recommendation_served_total`           | counter |
| `realtime_connections_active`           | gauge   |
| `outbox_pending_total`                  | gauge   |
| `job_dead_letter_total`                 | counter |

### Alerts

- Webhook signature failures spike.
- Outbox pending > threshold for 10 minutes.
- Wallet ledger posting failures > 0.
- Subscription renewal failures above baseline.
- WhatsApp fallback rate > 30% in production mode.
- Realtime connection error rate > 5%.
- Meal schedule publish failure.

### Admin Troubleshooting Views

- Billing: subscription state, latest gateway events, invoices, dunning attempts.
- Communications: WhatsApp/email/in-app status and fallback trail.
- Scheduler: publish status, conflicts, demand projection.
- Recommendations: engine mode, confidence, feedback, disabled reasons.

## M. Security And Compliance

### Authorization Boundaries

- Parent: own wallet, invoices, subscriptions, recommendations, and child schedules.
- Student: own visible schedule/recommendations only.
- Kitchen: school schedule and order prep data, no billing/payment secrets.
- Admin: same-school management only.
- System/webhook: signature-verified, idempotent operations only.

### PII And Payment Boundaries

- Do not store card/UPI credentials.
- Store only Razorpay ids and verified payment status.
- Mask phone numbers in logs and admin tables by default.
- WhatsApp provider payloads stored as restricted audit data.
- Recommendation inputs must avoid unnecessary sensitive data.

### Webhook Security

- Verify Razorpay signature against raw body.
- Verify WhatsApp webhook signature/app secret and verify token.
- Reject replayed provider event ids.
- Store event processing result for audit.

### AI Safety

- No free-form LLM advice in parent-facing UI.
- Rule explanations generated from known structured fields only.
- Prompt injection controls apply before any future LLM engine: no user text can override safety policy.
- Admin-visible audit of recommendation inputs and reasons.

### Tenant Isolation

- Every Phase 2 table includes `schoolId` where data is school-scoped.
- Repository methods require `schoolId` and never infer it from request body alone.
- Cross-school admin reports require explicit super-admin role and audit event.

## N. Implementation Plan

### Phase 2A Foundation

Files/modules:

- `src/config/feature-flags.ts`
- `src/events/outbox.repository.ts`
- `src/events/domain-events.ts`
- `src/jobs/worker.ts`
- `src/middleware/idempotency.middleware.ts`
- `prisma/migrations/*_phase2_foundation`

Tasks:

- Add feature flag service.
- Add outbox and idempotency tables.
- Add shared API response/error shape.
- Add queue worker harness with Redis.

Tests:

- feature flag parsing
- idempotency conflict behavior
- outbox retry/dead-letter behavior

Risk:

- Low if additive and flags default off.

### Phase 2B Billing, Invoices, Wallet

Files/modules:

- `src/services/wallet.service.ts`
- `src/repositories/wallet.repository.ts`
- `src/routes/wallet.routes.ts`
- `src/services/invoice.service.ts`
- `src/repositories/invoice.repository.ts`
- `src/routes/invoice.routes.ts`
- `src/services/subscription.service.ts`
- `src/repositories/subscription.repository.ts`
- `src/routes/subscription.routes.ts`
- `src/integrations/razorpay/recurring-billing.gateway.ts`

Migration tasks:

- Add wallet tables.
- Extend subscription/invoice models.
- Add provider event id uniqueness.

Tests:

- concurrent wallet debit
- invoice idempotency
- subscription webhook state transitions
- dunning worker

Risk:

- Medium due to money movement. Roll out to internal school first.

### Phase 2C WhatsApp And Fallback Channels

Files/modules:

- `src/services/whatsapp.service.ts`
- `src/repositories/whatsapp.repository.ts`
- `src/routes/whatsapp.routes.ts`
- `src/integrations/whatsapp/cloud-api.client.ts`
- `src/jobs/whatsapp-dispatch.worker.ts`
- `src/jobs/notification-fallback.worker.ts`

Migration tasks:

- Add opt-in and template mapping tables.
- Extend message logs.

Tests:

- disabled mode fallback
- opt-in required
- template pending fallback
- webhook delivery/read/failure

Risk:

- Medium operationally, low product risk because fallback is mandatory.

### Phase 2D Meal Scheduler

Files/modules:

- `src/modules/meal-scheduler/meal-scheduler.service.ts`
- `src/modules/meal-scheduler/meal-scheduler.repository.ts`
- `src/modules/meal-scheduler/recurrence.ts`
- `src/routes/meal-scheduler.routes.ts`
- `web/src/app/admin/meal-calendar/*`
- `web/src/app/kitchen/schedule/*`

Migration tasks:

- Add schedule/slot/exception tables.
- Fix `DailyMenu` multi-school uniqueness in a safe migration.

Tests:

- recurrence expansion
- conflict validation
- cutoff lock
- publish event
- kitchen demand projection

Risk:

- Medium due to calendar edge cases.

### Phase 2E AI Recommendations

Files/modules:

- `src/modules/recommendations/recommendation.service.ts`
- `src/modules/recommendations/rule-based.engine.ts`
- `src/modules/recommendations/recommendation.repository.ts`
- `src/routes/recommendation.routes.ts`
- `web/src/components/recommendations/*`

Migration tasks:

- Add recommendation run/item/feedback tables.

Tests:

- allergen exclusion
- low-confidence fallback
- explanation safety
- feedback capture

Risk:

- Low if rule-based and feature-flagged.

### Phase 2F Realtime And Hardening

Files/modules:

- `src/realtime/realtime.server.ts`
- `src/realtime/events.ts`
- `src/services/websocket.service.ts`
- `web/src/hooks/useRealtimeEvents.ts`
- `web/src/services/realtime.service.ts`

Migration tasks:

- None required beyond outbox unless event audit table is chosen.

Tests:

- authenticated connection
- room authorization
- reconnect and polling fallback
- event schema contract

Risk:

- Medium if multiple backend instances. Require Redis adapter before production scale-out.

## O. Code Output Expectations

### 1. Folder/Module Structure

```text
src/
  config/
    feature-flags.ts
  events/
    domain-events.ts
    outbox.repository.ts
    outbox-dispatcher.ts
  integrations/
    razorpay/
      recurring-billing.gateway.ts
      razorpay-webhook.verifier.ts
    whatsapp/
      cloud-api.client.ts
      whatsapp-webhook.verifier.ts
  jobs/
    worker.ts
    dunning.worker.ts
    whatsapp-dispatch.worker.ts
    notification-fallback.worker.ts
    recommendation-refresh.worker.ts
  modules/
    meal-scheduler/
      meal-scheduler.service.ts
      meal-scheduler.repository.ts
      recurrence.ts
      validators.ts
    recommendations/
      recommendation.service.ts
      recommendation.repository.ts
      rule-based.engine.ts
      safety-policy.ts
  realtime/
    realtime.server.ts
    events.ts
    rooms.ts
  repositories/
    wallet.repository.ts
    invoice.repository.ts
    subscription.repository.ts
    whatsapp.repository.ts
  routes/
    wallet.routes.ts
    invoice.routes.ts
    subscription.routes.ts
    whatsapp.routes.ts
    meal-scheduler.routes.ts
    recommendation.routes.ts
  services/
    wallet.service.ts
    invoice.service.ts
    subscription.service.ts
    whatsapp.service.ts
    websocket.service.ts
```

### 2. TypeScript Interface Definitions

```ts
export interface IdempotentCommand<TPayload> {
  schoolId: string;
  actorUserId: string;
  idempotencyKey: string;
  payload: TPayload;
}

export interface WalletDebitRequest {
  walletAccountId: string;
  amount: string;
  currency: 'INR';
  referenceType: 'order' | 'invoice' | 'subscription_cycle';
  referenceId: string;
  reason: string;
}

export interface InvoiceGenerationRequest {
  schoolId: string;
  userId: string;
  sourceType: 'order' | 'subscription_cycle' | 'wallet_top_up';
  sourceId: string;
  dueDate: string;
}

export interface SubscriptionCreateRequest {
  schoolId: string;
  userId: string;
  studentId?: string;
  planId: string;
  returnUrl: string;
}

export interface WhatsAppTriggerRequest {
  schoolId: string;
  recipientUserId: string;
  eventType:
    | 'order_confirmed'
    | 'order_ready'
    | 'rfid_delivered'
    | 'payment_failed'
    | 'subscription_renewal_failed'
    | 'invoice_issued'
    | 'schedule_published';
  variables: Record<string, string>;
  fallbackRequired: boolean;
}

export interface MealScheduleCreateRequest {
  schoolId: string;
  name: string;
  effectiveFrom: string;
  effectiveTo?: string;
  recurrenceRule?: string;
  targetType: 'school' | 'class' | 'group';
  targetId?: string;
  cutoffMinutes: number;
  slots: Array<{
    serviceDate: string;
    slot: 'breakfast' | 'lunch' | 'snack';
    menuItemId: string;
    plannedQuantity?: number;
    maxPerStudent?: number;
    priceOverride?: string;
  }>;
}

export interface MealRecommendation {
  menuItemId: string;
  rank: number;
  score: number;
  confidence: number;
  reasons: string[];
  mode: 'personalized' | 'fallback';
}
```

### 3. DB Schema Examples

Use the Prisma models in section C as the implementation source. Generate migrations in this order:

1. `phase2_foundation_outbox_idempotency`
2. `phase2_wallet_ledger`
3. `phase2_subscription_invoice_extensions`
4. `phase2_whatsapp_opt_in`
5. `phase2_meal_scheduler`
6. `phase2_recommendations`

### 4. Endpoint Stubs

```ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature-flag.middleware';
import { validateBody } from '../middleware/validation.middleware';

export const walletRoutes = Router();

walletRoutes.use(requireAuth);
walletRoutes.use(requireFeature('WALLET_ENABLED'));

walletRoutes.get('/', async (req, res, next) => {
  try {
    const wallet = await req.container.walletService.getWalletForUser({
      schoolId: req.user.schoolId,
      userId: req.user.id,
    });
    res.json({ success: true, data: wallet, requestId: req.id });
  } catch (error) {
    next(error);
  }
});

walletRoutes.post(
  '/debits',
  validateBody('walletDebit'),
  async (req, res, next) => {
    try {
      const result = await req.container.walletService.debit({
        schoolId: req.user.schoolId,
        actorUserId: req.user.id,
        idempotencyKey: req.header('Idempotency-Key') ?? '',
        payload: req.body,
      });
      res.status(201).json({ success: true, data: result, requestId: req.id });
    } catch (error) {
      next(error);
    }
  }
);
```

### 5. Event Contracts

```ts
export type DomainEvent =
  | {
      type: 'wallet.ledger.posted.v1';
      schoolId: string;
      aggregateId: string;
      payload: {
        walletAccountId: string;
        entryId: string;
        direction: 'credit' | 'debit';
        amount: string;
      };
    }
  | {
      type: 'subscription.renewal.failed.v1';
      schoolId: string;
      aggregateId: string;
      payload: {
        subscriptionId: string;
        billingCycleId: string;
        attempt: number;
        nextAttemptAt?: string;
      };
    }
  | {
      type: 'meal_schedule.published.v1';
      schoolId: string;
      aggregateId: string;
      payload: {
        scheduleId: string;
        from: string;
        to: string;
        notifyParents: boolean;
      };
    }
  | {
      type: 'whatsapp.message.failed.v1';
      schoolId: string;
      aggregateId: string;
      payload: {
        messageId: string;
        reason: string;
        fallbackChannel: 'email' | 'in_app' | 'sms';
      };
    };
```

### 6. Webhook Handler Skeletons

```ts
export async function handleRazorpayWebhook(
  rawBody: Buffer,
  signature: string
) {
  const event = razorpayWebhookVerifier.verify(rawBody, signature);

  return idempotencyService.runOnce({
    schoolId: event.schoolId,
    key: event.providerEventId,
    operation: 'razorpay_webhook',
    execute: async () => {
      switch (event.type) {
        case 'subscription.activated':
          return subscriptionService.markActivatedFromGateway(event);
        case 'payment.captured':
          return paymentService.markCapturedFromGateway(event);
        case 'payment.failed':
          return subscriptionService.recordRenewalFailure(event);
        default:
          return webhookAuditService.recordIgnored(event);
      }
    },
  });
}

export async function handleWhatsAppWebhook(
  rawBody: Buffer,
  signature: string
) {
  const event = whatsappWebhookVerifier.verify(rawBody, signature);

  return whatsappService.recordProviderStatus({
    providerMessageId: event.messageId,
    status: event.status,
    occurredAt: event.occurredAt,
    providerPayload: event.raw,
  });
}
```

### 7. Feature Flag Definitions

```ts
export const phase2FeatureFlags = {
  REALTIME_ENABLED: { defaultValue: false, owner: 'platform' },
  WALLET_ENABLED: { defaultValue: false, owner: 'payments' },
  INVOICE_ENABLED: { defaultValue: true, owner: 'payments' },
  INVOICE_AUTO_SEND_ENABLED: { defaultValue: false, owner: 'payments' },
  SUBSCRIPTIONS_ENABLED: { defaultValue: false, owner: 'payments' },
  WHATSAPP_MODE: {
    defaultValue: 'disabled',
    allowedValues: ['disabled', 'sandbox', 'production'],
  },
  MEAL_SCHEDULER_ENABLED: { defaultValue: false, owner: 'menu' },
  RECOMMENDATIONS_ENABLED: { defaultValue: false, owner: 'product' },
  RECOMMENDATION_ENGINE: {
    defaultValue: 'rule_based',
    allowedValues: ['rule_based', 'ml'],
  },
  SUBSCRIPTION_WALLET_OFFSET_ENABLED: {
    defaultValue: false,
    owner: 'payments',
  },
} as const;
```

### 8. Acceptance Test Checklist

- Wallet debits are atomic under concurrent checkout attempts.
- Duplicate wallet top-up verification does not double-credit.
- Invoice generation is idempotent for the same source.
- Razorpay duplicate/reordered webhooks do not corrupt subscription state.
- WhatsApp disabled mode sends email/in-app fallback and records status.
- WhatsApp production mode rejects non-opted-in recipients.
- Meal schedule conflicts are blocked before publish.
- Cutoff-locked schedule edits require override reason and audit event.
- Kitchen demand updates after schedule publish and order placement.
- Recommendation responses never include medical claims.
- Low-confidence recommendations fall back to popular available items.
- WebSocket connection denies unauthorized rooms.
- Realtime polling fallback returns missed events after reconnect.
- Feature flags off preserve all pilot routes and Playwright journeys.
