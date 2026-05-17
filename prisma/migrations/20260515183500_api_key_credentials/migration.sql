-- Phase 3 hardening: persisted API key credential storage for rotation/validation.
CREATE TABLE IF NOT EXISTS "api_key_credentials" (
  "id" TEXT NOT NULL,
  "key_hash" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "policy_type" TEXT NOT NULL DEFAULT 'default',
  "permissions" TEXT NOT NULL DEFAULT '[]',
  "metadata" TEXT NOT NULL DEFAULT '{}',
  "rotation_count" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "last_used_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "api_key_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "api_key_credentials_key_hash_key" ON "api_key_credentials"("key_hash");
CREATE INDEX IF NOT EXISTS "api_key_credentials_user_id_idx" ON "api_key_credentials"("user_id");
CREATE INDEX IF NOT EXISTS "api_key_credentials_is_active_expires_at_idx" ON "api_key_credentials"("is_active", "expires_at");
CREATE INDEX IF NOT EXISTS "api_key_credentials_policy_type_idx" ON "api_key_credentials"("policy_type");
