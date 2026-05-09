-- Phase 2A foundation: idempotency and transactional outbox.
-- Additive only; all Phase 2 features remain disabled by default.

CREATE TABLE "payment_idempotency_keys" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "request_hash" TEXT NOT NULL,
    "response_body" JSONB,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_idempotency_keys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outbox_events" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "event_type" TEXT NOT NULL,
    "aggregate_type" TEXT NOT NULL,
    "aggregate_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_idempotency_keys_school_id_key_operation_key"
    ON "payment_idempotency_keys"("school_id", "key", "operation");

CREATE INDEX "payment_idempotency_keys_expires_at_idx"
    ON "payment_idempotency_keys"("expires_at");

CREATE INDEX "outbox_events_status_next_attempt_at_idx"
    ON "outbox_events"("status", "next_attempt_at");

CREATE INDEX "outbox_events_aggregate_type_aggregate_id_idx"
    ON "outbox_events"("aggregate_type", "aggregate_id");

