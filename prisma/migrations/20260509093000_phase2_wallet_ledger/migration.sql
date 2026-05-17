-- Phase 2B wallet ledger.
-- Feature remains disabled by default through WALLET_ENABLED=false.

CREATE TABLE "wallet_accounts" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'active',
    "available_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "pending_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wallet_ledger_entries" (
    "id" TEXT NOT NULL,
    "wallet_account_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "entry_type" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "balance_after" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'posted',
    "reference_type" TEXT,
    "reference_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallet_accounts_school_id_user_id_currency_key"
    ON "wallet_accounts"("school_id", "user_id", "currency");

CREATE INDEX "wallet_accounts_school_id_status_idx"
    ON "wallet_accounts"("school_id", "status");

CREATE INDEX "wallet_accounts_user_id_idx"
    ON "wallet_accounts"("user_id");

CREATE UNIQUE INDEX "wallet_ledger_entries_idempotency_key_key"
    ON "wallet_ledger_entries"("idempotency_key");

CREATE INDEX "wallet_ledger_entries_school_id_user_id_created_at_idx"
    ON "wallet_ledger_entries"("school_id", "user_id", "created_at");

CREATE INDEX "wallet_ledger_entries_reference_type_reference_id_idx"
    ON "wallet_ledger_entries"("reference_type", "reference_id");

CREATE INDEX "wallet_ledger_entries_status_idx"
    ON "wallet_ledger_entries"("status");

ALTER TABLE "wallet_ledger_entries"
    ADD CONSTRAINT "wallet_ledger_entries_wallet_account_id_fkey"
    FOREIGN KEY ("wallet_account_id") REFERENCES "wallet_accounts"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

