-- Phase 2C WhatsApp opt-in, template mappings, and richer message status.
-- WHATSAPP_MODE defaults to disabled; these tables support opt-in capture and fallback audit.

ALTER TABLE "whatsapp_messages"
    ADD COLUMN "school_id" TEXT,
    ADD COLUMN "notification_id" TEXT,
    ADD COLUMN "provider_payload" JSONB,
    ADD COLUMN "fallback_channel" TEXT,
    ADD COLUMN "fallback_triggered_at" TIMESTAMP(3);

CREATE TABLE "whatsapp_opt_ins" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "consent_text" TEXT NOT NULL,
    "consent_version" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_opt_ins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whatsapp_template_mappings" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "event_type" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "fallback_template_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_approval',
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_template_mappings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "whatsapp_messages_school_id_status_created_at_idx"
    ON "whatsapp_messages"("school_id", "status", "created_at");

CREATE UNIQUE INDEX "whatsapp_opt_ins_school_id_user_id_phone_key"
    ON "whatsapp_opt_ins"("school_id", "user_id", "phone");

CREATE INDEX "whatsapp_opt_ins_phone_status_idx"
    ON "whatsapp_opt_ins"("phone", "status");

CREATE INDEX "whatsapp_opt_ins_school_id_status_idx"
    ON "whatsapp_opt_ins"("school_id", "status");

CREATE UNIQUE INDEX "whatsapp_template_mappings_school_id_event_type_language_key"
    ON "whatsapp_template_mappings"("school_id", "event_type", "language");

CREATE INDEX "whatsapp_template_mappings_status_is_active_idx"
    ON "whatsapp_template_mappings"("status", "is_active");

