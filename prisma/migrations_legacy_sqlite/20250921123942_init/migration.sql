-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "cognito_user_id" TEXT,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'parent',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "school_id" TEXT,
    "parent_id" TEXT,
    "grade" TEXT,
    "section" TEXT,
    "profile_picture_url" TEXT,
    "preferences" TEXT NOT NULL DEFAULT '{}',
    "security_settings" TEXT NOT NULL DEFAULT '{}',
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "timezone" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "last_login_at" DATETIME,
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "device_tokens" TEXT NOT NULL DEFAULT '[]',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '{}',
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "principal_name" TEXT,
    "subscription_tier" TEXT NOT NULL DEFAULT 'BASIC',
    "operating_hours" TEXT NOT NULL DEFAULT '{}',
    "configuration" TEXT NOT NULL DEFAULT '{}',
    "active_vendors" TEXT NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "parent_children" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parent_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'parent',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parent_children_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parent_children_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT NOT NULL DEFAULT '{}',
    "user_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "last_activity" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "order_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivery_date" DATETIME NOT NULL,
    "delivered_at" DATETIME,
    "special_instructions" TEXT,
    "allergy_info" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" REAL NOT NULL,
    "total_price" REAL NOT NULL,
    "customizations" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "razorpay_order_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'created',
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "subscription_id" TEXT,
    "metadata" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "razorpay_payment_id" TEXT NOT NULL,
    "payment_order_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'created',
    "method" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "fees" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captured_at" DATETIME,
    "refunded_at" DATETIME,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_transactions_payment_order_id_fkey" FOREIGN KEY ("payment_order_id") REFERENCES "payment_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_refunds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "razorpay_refund_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" DATETIME,
    CONSTRAINT "payment_refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment_transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "original_price" DECIMAL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "available" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "nutritional_info" TEXT,
    "allergens" TEXT NOT NULL DEFAULT '[]',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "preparation_time" INTEGER,
    "portion_size" TEXT,
    "calories" INTEGER,
    "school_id" TEXT,
    "vendor_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "menu_items_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "menu_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approval_workflow" TEXT NOT NULL DEFAULT '{}',
    "approved_by" TEXT,
    "approved_at" DATETIME,
    "recurring_pattern" TEXT,
    "template_category" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "menu_plans_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_menus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "menu_plan_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "day_type" TEXT NOT NULL DEFAULT 'WEEKDAY',
    "special_event_info" TEXT,
    "available_quantity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" DATETIME,
    "notes" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_menus_menu_plan_id_fkey" FOREIGN KEY ("menu_plan_id") REFERENCES "menu_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "menu_item_slots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "daily_menu_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "available_from" DATETIME,
    "available_to" DATETIME,
    "planned_quantity" INTEGER,
    "available_quantity" INTEGER,
    "custom_price" DECIMAL,
    "is_special" BOOLEAN NOT NULL DEFAULT false,
    "is_limited" BOOLEAN NOT NULL DEFAULT false,
    "max_per_order" INTEGER,
    "preparation_deadline" DATETIME,
    "kitchen_notes" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "menu_item_slots_daily_menu_id_fkey" FOREIGN KEY ("daily_menu_id") REFERENCES "daily_menus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "menu_item_slots_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "menu_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "menu_plan_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "approval_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "approved_at" DATETIME,
    "rejected_at" DATETIME,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "menu_approvals_menu_plan_id_fkey" FOREIGN KEY ("menu_plan_id") REFERENCES "menu_plans" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "phone" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "whatsapp_message_id" TEXT,
    "template_name" TEXT,
    "message" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "error_message" TEXT,
    "sent_at" DATETIME,
    "delivered_at" DATETIME,
    "read_at" DATETIME,
    "failed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "whatsapp_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "whatsapp_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "components" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "analytics_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metrics" TEXT NOT NULL DEFAULT '[]',
    "dimensions" TEXT NOT NULL DEFAULT '[]',
    "filters" TEXT NOT NULL DEFAULT '{}',
    "dateRange" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '[]',
    "generated_at" DATETIME NOT NULL,
    "generated_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "rfid_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "card_number" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "issued_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME,
    "last_used_at" DATETIME,
    "deactivated_at" DATETIME,
    "deactivation_reason" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rfid_cards_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rfid_readers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "last_heartbeat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "configuration" TEXT NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rfid_readers_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "delivery_verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_id" TEXT,
    "student_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "reader_id" TEXT NOT NULL,
    "verified_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'verified',
    "location" TEXT,
    "delivery_photo" TEXT,
    "verification_notes" TEXT,
    "verification_data" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "delivery_verifications_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "delivery_verifications_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "rfid_cards" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "delivery_verifications_reader_id_fkey" FOREIGN KEY ("reader_id") REFERENCES "rfid_readers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "delivery_verifications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "method_type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_method_id" TEXT NOT NULL,
    "card_last4" TEXT,
    "card_brand" TEXT,
    "card_network" TEXT,
    "card_type" TEXT,
    "upi_handle" TEXT,
    "wallet_provider" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "subscription_id" TEXT,
    "payment_method_id" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "payment_type" TEXT NOT NULL,
    "razorpay_payment_id" TEXT,
    "razorpay_order_id" TEXT,
    "gateway_response" TEXT NOT NULL DEFAULT '{}',
    "failure_reason" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "paid_at" DATETIME,
    "refunded_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "plan_type" TEXT NOT NULL,
    "installment_count" INTEGER,
    "installment_interval" TEXT,
    "min_payment_amount" REAL,
    "partial_payment_enabled" BOOLEAN NOT NULL DEFAULT false,
    "minimum_partial_amount" REAL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_plans_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_retries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payment_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "retry_at" DATETIME NOT NULL,
    "retry_reason" TEXT NOT NULL,
    "retry_method" TEXT,
    "status" TEXT NOT NULL,
    "failure_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_retries_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reconciliation_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT NOT NULL,
    "record_date" DATETIME NOT NULL,
    "record_type" TEXT NOT NULL,
    "total_payments" REAL NOT NULL,
    "total_refunds" REAL NOT NULL,
    "total_fees" REAL NOT NULL,
    "net_settlement" REAL NOT NULL,
    "payment_count" INTEGER NOT NULL,
    "refund_count" INTEGER NOT NULL,
    "failed_payment_count" INTEGER NOT NULL,
    "reconciliation_status" TEXT NOT NULL,
    "discrepancy_amount" REAL,
    "discrepancy_reason" TEXT,
    "settlement_id" TEXT,
    "settlement_date" DATETIME,
    "settlement_amount" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reconciliation_records_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "student_id" TEXT,
    "subscription_plan_id" TEXT NOT NULL,
    "payment_method_id" TEXT,
    "status" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME,
    "next_billing_date" DATETIME,
    "billing_cycle" TEXT NOT NULL,
    "billing_amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "proration_enabled" BOOLEAN NOT NULL DEFAULT true,
    "proration_amount" REAL NOT NULL DEFAULT 0,
    "grace_period_days" INTEGER NOT NULL DEFAULT 3,
    "dunning_attempts" INTEGER NOT NULL DEFAULT 0,
    "max_dunning_attempts" INTEGER NOT NULL DEFAULT 3,
    "suspended_at" DATETIME,
    "trial_period_days" INTEGER NOT NULL DEFAULT 0,
    "trial_end_date" DATETIME,
    "is_trial_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscriptions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "plan_type" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "billing_cycle" TEXT NOT NULL,
    "meals_per_day" INTEGER NOT NULL DEFAULT 1,
    "meals_per_week" INTEGER,
    "meals_per_month" INTEGER,
    "benefits" TEXT NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "available_from" DATETIME,
    "available_to" DATETIME,
    "trial_period_days" INTEGER NOT NULL DEFAULT 0,
    "trial_price" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscription_plans_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "billing_cycles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscription_id" TEXT NOT NULL,
    "cycle_number" INTEGER NOT NULL,
    "cycle_start" DATETIME NOT NULL,
    "cycle_end" DATETIME NOT NULL,
    "billing_amount" REAL NOT NULL,
    "proration_amount" REAL NOT NULL DEFAULT 0,
    "total_amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "billing_date" DATETIME NOT NULL,
    "due_date" DATETIME NOT NULL,
    "paid_date" DATETIME,
    "payment_id" TEXT,
    "dunning_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_dunning_at" DATETIME,
    "next_dunning_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_cycles_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "billing_cycles_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATETIME NOT NULL,
    "subtotal" REAL NOT NULL,
    "tax_amount" REAL NOT NULL DEFAULT 0,
    "discount_amount" REAL NOT NULL DEFAULT 0,
    "total_amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "gst_number" TEXT,
    "gst_rate" REAL NOT NULL DEFAULT 0,
    "hsn_code" TEXT,
    "place_of_supply" TEXT,
    "status" TEXT NOT NULL,
    "sent_date" DATETIME,
    "paid_date" DATETIME,
    "payment_id" TEXT,
    "pdf_url" TEXT,
    "pdf_generated_at" DATETIME,
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent_at" DATETIME,
    "email_delivered" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoices_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_id" TEXT NOT NULL,
    "order_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" REAL NOT NULL,
    "total_price" REAL NOT NULL,
    "tax_rate" REAL NOT NULL DEFAULT 0,
    "tax_amount" REAL NOT NULL DEFAULT 0,
    "item_type" TEXT NOT NULL,
    "item_code" TEXT,
    "hsn_code" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoice_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_email_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoice_id" TEXT NOT NULL,
    "email_type" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sent_at" DATETIME NOT NULL,
    "delivered_at" DATETIME,
    "opened_at" DATETIME,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "subject" TEXT NOT NULL,
    "email_provider" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_email_logs_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "template_type" TEXT NOT NULL,
    "logo_url" TEXT,
    "header_color" TEXT,
    "accent_color" TEXT,
    "footer_text" TEXT,
    "html_template" TEXT NOT NULL,
    "css_styles" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invoice_templates_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT NOT NULL,
    "report_date" DATETIME NOT NULL,
    "report_type" TEXT NOT NULL,
    "total_payments" REAL NOT NULL,
    "total_refunds" REAL NOT NULL,
    "net_revenue" REAL NOT NULL,
    "average_order_value" REAL NOT NULL,
    "payment_count" INTEGER NOT NULL,
    "refund_count" INTEGER NOT NULL,
    "unique_customers" INTEGER NOT NULL,
    "new_customers" INTEGER NOT NULL,
    "payment_success_rate" REAL NOT NULL,
    "refund_rate" REAL NOT NULL,
    "chargeback_count" INTEGER NOT NULL,
    "card_payments" REAL NOT NULL,
    "upi_payments" REAL NOT NULL,
    "wallet_payments" REAL NOT NULL,
    "bank_transfers" REAL NOT NULL,
    "active_subscriptions" INTEGER NOT NULL,
    "new_subscriptions" INTEGER NOT NULL,
    "cancelled_subscriptions" INTEGER NOT NULL,
    "subscription_revenue" REAL NOT NULL,
    "revenue_growth_rate" REAL,
    "customer_growth_rate" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_analytics_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_failure_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT NOT NULL,
    "report_date" DATETIME NOT NULL,
    "total_failures" INTEGER NOT NULL,
    "insufficient_funds" INTEGER NOT NULL,
    "card_declined" INTEGER NOT NULL,
    "network_errors" INTEGER NOT NULL,
    "authentication_failed" INTEGER NOT NULL,
    "other_failures" INTEGER NOT NULL,
    "recovered_payments" INTEGER NOT NULL,
    "recovered_amount" REAL NOT NULL,
    "recovery_rate" REAL NOT NULL,
    "lost_revenue" REAL NOT NULL,
    "affected_customers" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_failure_analytics_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customer_payment_behavior" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "last_payment_date" DATETIME,
    "average_order_value" REAL NOT NULL,
    "total_order_value" REAL NOT NULL,
    "order_frequency" REAL NOT NULL,
    "preferred_payment_method" TEXT,
    "preferred_order_time" TEXT,
    "preferred_order_days" TEXT,
    "payment_success_rate" REAL NOT NULL,
    "failure_count" INTEGER NOT NULL,
    "chargeback_count" INTEGER NOT NULL,
    "risk_score" REAL NOT NULL,
    "customer_since" DATETIME NOT NULL,
    "total_orders" INTEGER NOT NULL,
    "loyalty_tier" TEXT,
    "has_active_subscription" BOOLEAN NOT NULL DEFAULT false,
    "subscription_value" REAL NOT NULL DEFAULT 0,
    "subscription_start_date" DATETIME,
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_payment_behavior_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "customer_payment_behavior_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscription_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT,
    "report_date" DATETIME NOT NULL,
    "report_type" TEXT NOT NULL DEFAULT 'daily',
    "active_subscriptions" INTEGER NOT NULL,
    "new_subscriptions" INTEGER NOT NULL,
    "cancelled_subscriptions" INTEGER NOT NULL,
    "suspended_subscriptions" INTEGER NOT NULL,
    "trial_subscriptions" INTEGER NOT NULL,
    "total_mrr" REAL NOT NULL,
    "avg_revenue_per_user" REAL NOT NULL,
    "churn_rate" REAL NOT NULL,
    "conversion_rate" REAL NOT NULL,
    "lifetime_value" REAL NOT NULL,
    "plan_breakdown" TEXT NOT NULL DEFAULT '{}',
    "cohort_analysis" TEXT NOT NULL DEFAULT '{}',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subscription_analytics_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "device_model" TEXT,
    "os_version" TEXT,
    "app_version" TEXT,
    "fcm_token" TEXT,
    "apns_token" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen" DATETIME,
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "notification_settings" TEXT NOT NULL DEFAULT '{}',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "message" TEXT,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "data" TEXT NOT NULL DEFAULT '{}',
    "image_url" TEXT,
    "action_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sent_at" DATETIME,
    "delivered_at" DATETIME,
    "read_at" DATETIME,
    "channels" TEXT NOT NULL DEFAULT '[]',
    "scheduled_for" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_parents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'parent',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "can_order" BOOLEAN NOT NULL DEFAULT true,
    "can_pickup" BOOLEAN NOT NULL DEFAULT true,
    "emergency_contact" BOOLEAN NOT NULL DEFAULT false,
    "contact_priority" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_parents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "student_parents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cognito_user_id_key" ON "users"("cognito_user_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_school_id_idx" ON "users"("school_id");

-- CreateIndex
CREATE INDEX "users_parent_id_idx" ON "users"("parent_id");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_cognito_user_id_idx" ON "users"("cognito_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");

-- CreateIndex
CREATE INDEX "schools_code_idx" ON "schools"("code");

-- CreateIndex
CREATE INDEX "schools_is_active_idx" ON "schools"("is_active");

-- CreateIndex
CREATE INDEX "parent_children_parent_id_idx" ON "parent_children"("parent_id");

-- CreateIndex
CREATE INDEX "parent_children_child_id_idx" ON "parent_children"("child_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_children_parent_id_child_id_key" ON "parent_children"("parent_id", "child_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_role_assignments_user_id_role_id_key" ON "user_role_assignments"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_by_id_idx" ON "audit_logs"("created_by_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_session_id_key" ON "auth_sessions"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_student_id_idx" ON "orders"("student_id");

-- CreateIndex
CREATE INDEX "orders_school_id_idx" ON "orders"("school_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_payment_status_idx" ON "orders"("payment_status");

-- CreateIndex
CREATE INDEX "orders_delivery_date_idx" ON "orders"("delivery_date");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_menu_item_id_idx" ON "order_items"("menu_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_orders_razorpay_order_id_key" ON "payment_orders"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_razorpay_payment_id_key" ON "payment_transactions"("razorpay_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_refunds_razorpay_refund_id_key" ON "payment_refunds"("razorpay_refund_id");

-- CreateIndex
CREATE INDEX "menu_items_category_idx" ON "menu_items"("category");

-- CreateIndex
CREATE INDEX "menu_items_available_idx" ON "menu_items"("available");

-- CreateIndex
CREATE INDEX "menu_items_featured_idx" ON "menu_items"("featured");

-- CreateIndex
CREATE INDEX "menu_items_school_id_idx" ON "menu_items"("school_id");

-- CreateIndex
CREATE INDEX "menu_items_sort_order_idx" ON "menu_items"("sort_order");

-- CreateIndex
CREATE INDEX "menu_items_created_at_idx" ON "menu_items"("created_at");

-- CreateIndex
CREATE INDEX "menu_plans_school_id_idx" ON "menu_plans"("school_id");

-- CreateIndex
CREATE INDEX "menu_plans_status_idx" ON "menu_plans"("status");

-- CreateIndex
CREATE INDEX "menu_plans_start_date_end_date_idx" ON "menu_plans"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "menu_plans_is_template_idx" ON "menu_plans"("is_template");

-- CreateIndex
CREATE INDEX "menu_plans_created_by_idx" ON "menu_plans"("created_by");

-- CreateIndex
CREATE INDEX "menu_plans_created_at_idx" ON "menu_plans"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "daily_menus_date_key" ON "daily_menus"("date");

-- CreateIndex
CREATE INDEX "daily_menus_menu_plan_id_idx" ON "daily_menus"("menu_plan_id");

-- CreateIndex
CREATE INDEX "daily_menus_date_idx" ON "daily_menus"("date");

-- CreateIndex
CREATE INDEX "daily_menus_day_type_idx" ON "daily_menus"("day_type");

-- CreateIndex
CREATE INDEX "daily_menus_is_active_idx" ON "daily_menus"("is_active");

-- CreateIndex
CREATE INDEX "daily_menus_is_published_idx" ON "daily_menus"("is_published");

-- CreateIndex
CREATE INDEX "menu_item_slots_daily_menu_id_idx" ON "menu_item_slots"("daily_menu_id");

-- CreateIndex
CREATE INDEX "menu_item_slots_menu_item_id_idx" ON "menu_item_slots"("menu_item_id");

-- CreateIndex
CREATE INDEX "menu_item_slots_category_idx" ON "menu_item_slots"("category");

-- CreateIndex
CREATE INDEX "menu_item_slots_is_visible_idx" ON "menu_item_slots"("is_visible");

-- CreateIndex
CREATE INDEX "menu_item_slots_display_order_idx" ON "menu_item_slots"("display_order");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_slots_daily_menu_id_menu_item_id_category_key" ON "menu_item_slots"("daily_menu_id", "menu_item_id", "category");

-- CreateIndex
CREATE INDEX "menu_approvals_menu_plan_id_idx" ON "menu_approvals"("menu_plan_id");

-- CreateIndex
CREATE INDEX "menu_approvals_approver_id_idx" ON "menu_approvals"("approver_id");

-- CreateIndex
CREATE INDEX "menu_approvals_status_idx" ON "menu_approvals"("status");

-- CreateIndex
CREATE INDEX "menu_approvals_approval_type_idx" ON "menu_approvals"("approval_type");

-- CreateIndex
CREATE INDEX "whatsapp_messages_phone_idx" ON "whatsapp_messages"("phone");

-- CreateIndex
CREATE INDEX "whatsapp_messages_status_idx" ON "whatsapp_messages"("status");

-- CreateIndex
CREATE INDEX "whatsapp_messages_whatsapp_message_id_idx" ON "whatsapp_messages"("whatsapp_message_id");

-- CreateIndex
CREATE INDEX "whatsapp_messages_created_at_idx" ON "whatsapp_messages"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_templates_name_key" ON "whatsapp_templates"("name");

-- CreateIndex
CREATE INDEX "whatsapp_templates_name_idx" ON "whatsapp_templates"("name");

-- CreateIndex
CREATE INDEX "whatsapp_templates_status_idx" ON "whatsapp_templates"("status");

-- CreateIndex
CREATE INDEX "whatsapp_templates_is_active_idx" ON "whatsapp_templates"("is_active");

-- CreateIndex
CREATE INDEX "analytics_reports_type_idx" ON "analytics_reports"("type");

-- CreateIndex
CREATE INDEX "analytics_reports_generated_at_idx" ON "analytics_reports"("generated_at");

-- CreateIndex
CREATE UNIQUE INDEX "rfid_cards_card_number_key" ON "rfid_cards"("card_number");

-- CreateIndex
CREATE INDEX "rfid_cards_student_id_idx" ON "rfid_cards"("student_id");

-- CreateIndex
CREATE INDEX "rfid_cards_school_id_idx" ON "rfid_cards"("school_id");

-- CreateIndex
CREATE INDEX "rfid_cards_is_active_idx" ON "rfid_cards"("is_active");

-- CreateIndex
CREATE INDEX "rfid_readers_school_id_idx" ON "rfid_readers"("school_id");

-- CreateIndex
CREATE INDEX "rfid_readers_is_active_idx" ON "rfid_readers"("is_active");

-- CreateIndex
CREATE INDEX "rfid_readers_status_idx" ON "rfid_readers"("status");

-- CreateIndex
CREATE INDEX "delivery_verifications_order_id_idx" ON "delivery_verifications"("order_id");

-- CreateIndex
CREATE INDEX "delivery_verifications_student_id_idx" ON "delivery_verifications"("student_id");

-- CreateIndex
CREATE INDEX "delivery_verifications_card_id_idx" ON "delivery_verifications"("card_id");

-- CreateIndex
CREATE INDEX "delivery_verifications_reader_id_idx" ON "delivery_verifications"("reader_id");

-- CreateIndex
CREATE INDEX "delivery_verifications_verified_at_idx" ON "delivery_verifications"("verified_at");

-- CreateIndex
CREATE INDEX "delivery_verifications_status_idx" ON "delivery_verifications"("status");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_razorpay_payment_id_idx" ON "payments"("razorpay_payment_id");

-- CreateIndex
CREATE INDEX "payments_created_at_idx" ON "payments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "payment_analytics_school_id_report_date_report_type_key" ON "payment_analytics"("school_id", "report_date", "report_type");

-- CreateIndex
CREATE UNIQUE INDEX "payment_failure_analytics_school_id_report_date_key" ON "payment_failure_analytics"("school_id", "report_date");

-- CreateIndex
CREATE UNIQUE INDEX "customer_payment_behavior_user_id_school_id_key" ON "customer_payment_behavior"("user_id", "school_id");

-- CreateIndex
CREATE INDEX "subscription_analytics_report_date_idx" ON "subscription_analytics"("report_date");

-- CreateIndex
CREATE INDEX "subscription_analytics_report_type_idx" ON "subscription_analytics"("report_type");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_analytics_school_id_report_date_report_type_key" ON "subscription_analytics"("school_id", "report_date", "report_type");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_device_id_key" ON "user_devices"("device_id");

-- CreateIndex
CREATE INDEX "user_devices_user_id_idx" ON "user_devices"("user_id");

-- CreateIndex
CREATE INDEX "user_devices_device_id_idx" ON "user_devices"("device_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_scheduled_for_idx" ON "notifications"("scheduled_for");

-- CreateIndex
CREATE INDEX "student_parents_student_id_idx" ON "student_parents"("student_id");

-- CreateIndex
CREATE INDEX "student_parents_parent_id_idx" ON "student_parents"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_parents_student_id_parent_id_key" ON "student_parents"("student_id", "parent_id");
