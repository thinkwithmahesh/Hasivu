-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
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
    "last_login_at" TIMESTAMP(3),
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "device_tokens" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_children" (
    "id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "child_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'parent',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_children_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_role_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" TEXT NOT NULL DEFAULT '{}',
    "user_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "assigned_staff_id" TEXT,
    "assigned_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total_amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivery_date" TIMESTAMP(3) NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "special_instructions" TEXT,
    "allergy_info" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "customizations" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "id" TEXT NOT NULL,
    "razorpay_order_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'created',
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "subscription_id" TEXT,
    "metadata" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "razorpay_payment_id" TEXT NOT NULL,
    "payment_order_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'created',
    "method" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "fees" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "captured_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_refunds" (
    "id" TEXT NOT NULL,
    "razorpay_refund_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "original_price" DECIMAL(65,30),
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_plans" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approval_workflow" TEXT NOT NULL DEFAULT '{}',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "recurring_pattern" TEXT,
    "template_category" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_menus" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "menu_plan_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "day_type" TEXT NOT NULL DEFAULT 'WEEKDAY',
    "special_event_info" TEXT,
    "available_quantity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "notes" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_slots" (
    "id" TEXT NOT NULL,
    "daily_menu_id" TEXT NOT NULL,
    "menu_item_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "available_from" TIMESTAMP(3),
    "available_to" TIMESTAMP(3),
    "planned_quantity" INTEGER,
    "available_quantity" INTEGER,
    "custom_price" DECIMAL(65,30),
    "is_special" BOOLEAN NOT NULL DEFAULT false,
    "is_limited" BOOLEAN NOT NULL DEFAULT false,
    "max_per_order" INTEGER,
    "preparation_deadline" TIMESTAMP(3),
    "kitchen_notes" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_item_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_approvals" (
    "id" TEXT NOT NULL,
    "menu_plan_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "approval_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "phone" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "whatsapp_message_id" TEXT,
    "template_name" TEXT,
    "message" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "components" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "metrics" TEXT NOT NULL DEFAULT '[]',
    "dimensions" TEXT NOT NULL DEFAULT '[]',
    "filters" TEXT NOT NULL DEFAULT '{}',
    "dateRange" TEXT NOT NULL,
    "data" TEXT NOT NULL DEFAULT '[]',
    "generated_at" TIMESTAMP(3) NOT NULL,
    "generated_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfid_cards" (
    "id" TEXT NOT NULL,
    "card_number" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "deactivated_at" TIMESTAMP(3),
    "deactivation_reason" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfid_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rfid_readers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "last_heartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "configuration" TEXT NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rfid_readers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_verifications" (
    "id" TEXT NOT NULL,
    "order_id" TEXT,
    "student_id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "reader_id" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'verified',
    "location" TEXT,
    "delivery_photo" TEXT,
    "verification_notes" TEXT,
    "verification_data" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_id" TEXT,
    "subscription_id" TEXT,
    "payment_method_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "payment_type" TEXT NOT NULL,
    "razorpay_payment_id" TEXT,
    "razorpay_order_id" TEXT,
    "gateway_response" TEXT NOT NULL DEFAULT '{}',
    "failure_reason" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "paid_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_plans" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "plan_type" TEXT NOT NULL,
    "installment_count" INTEGER,
    "installment_interval" TEXT,
    "min_payment_amount" DOUBLE PRECISION,
    "partial_payment_enabled" BOOLEAN NOT NULL DEFAULT false,
    "minimum_partial_amount" DOUBLE PRECISION,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_retries" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "retry_at" TIMESTAMP(3) NOT NULL,
    "retry_reason" TEXT NOT NULL,
    "retry_method" TEXT,
    "status" TEXT NOT NULL,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_retries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_records" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "record_date" TIMESTAMP(3) NOT NULL,
    "record_type" TEXT NOT NULL,
    "total_payments" DOUBLE PRECISION NOT NULL,
    "total_refunds" DOUBLE PRECISION NOT NULL,
    "total_fees" DOUBLE PRECISION NOT NULL,
    "net_settlement" DOUBLE PRECISION NOT NULL,
    "payment_count" INTEGER NOT NULL,
    "refund_count" INTEGER NOT NULL,
    "failed_payment_count" INTEGER NOT NULL,
    "reconciliation_status" TEXT NOT NULL,
    "discrepancy_amount" DOUBLE PRECISION,
    "discrepancy_reason" TEXT,
    "settlement_id" TEXT,
    "settlement_date" TIMESTAMP(3),
    "settlement_amount" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "student_id" TEXT,
    "subscription_plan_id" TEXT NOT NULL,
    "payment_method_id" TEXT,
    "status" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "next_billing_date" TIMESTAMP(3),
    "billing_cycle" TEXT NOT NULL,
    "billing_amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "proration_enabled" BOOLEAN NOT NULL DEFAULT true,
    "proration_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grace_period_days" INTEGER NOT NULL DEFAULT 3,
    "dunning_attempts" INTEGER NOT NULL DEFAULT 0,
    "max_dunning_attempts" INTEGER NOT NULL DEFAULT 3,
    "suspended_at" TIMESTAMP(3),
    "trial_period_days" INTEGER NOT NULL DEFAULT 0,
    "trial_end_date" TIMESTAMP(3),
    "is_trial_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "plan_type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "billing_cycle" TEXT NOT NULL,
    "meals_per_day" INTEGER NOT NULL DEFAULT 1,
    "meals_per_week" INTEGER,
    "meals_per_month" INTEGER,
    "benefits" TEXT NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "available_from" TIMESTAMP(3),
    "available_to" TIMESTAMP(3),
    "trial_period_days" INTEGER NOT NULL DEFAULT 0,
    "trial_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_cycles" (
    "id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "cycle_number" INTEGER NOT NULL,
    "cycle_start" TIMESTAMP(3) NOT NULL,
    "cycle_end" TIMESTAMP(3) NOT NULL,
    "billing_amount" DOUBLE PRECISION NOT NULL,
    "proration_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" TEXT NOT NULL,
    "billing_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_date" TIMESTAMP(3),
    "payment_id" TEXT,
    "dunning_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_dunning_at" TIMESTAMP(3),
    "next_dunning_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "invoice_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "gst_number" TEXT,
    "gst_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hsn_code" TEXT,
    "place_of_supply" TEXT,
    "status" TEXT NOT NULL,
    "sent_date" TIMESTAMP(3),
    "paid_date" TIMESTAMP(3),
    "payment_id" TEXT,
    "pdf_url" TEXT,
    "pdf_generated_at" TIMESTAMP(3),
    "email_sent" BOOLEAN NOT NULL DEFAULT false,
    "email_sent_at" TIMESTAMP(3),
    "email_delivered" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "order_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "item_type" TEXT NOT NULL,
    "item_code" TEXT,
    "hsn_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_email_logs" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "email_type" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "subject" TEXT NOT NULL,
    "email_provider" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_templates" (
    "id" TEXT NOT NULL,
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
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_analytics" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL,
    "report_type" TEXT NOT NULL,
    "total_payments" DOUBLE PRECISION NOT NULL,
    "total_refunds" DOUBLE PRECISION NOT NULL,
    "net_revenue" DOUBLE PRECISION NOT NULL,
    "average_order_value" DOUBLE PRECISION NOT NULL,
    "payment_count" INTEGER NOT NULL,
    "refund_count" INTEGER NOT NULL,
    "unique_customers" INTEGER NOT NULL,
    "new_customers" INTEGER NOT NULL,
    "payment_success_rate" DOUBLE PRECISION NOT NULL,
    "refund_rate" DOUBLE PRECISION NOT NULL,
    "chargeback_count" INTEGER NOT NULL,
    "card_payments" DOUBLE PRECISION NOT NULL,
    "upi_payments" DOUBLE PRECISION NOT NULL,
    "wallet_payments" DOUBLE PRECISION NOT NULL,
    "bank_transfers" DOUBLE PRECISION NOT NULL,
    "active_subscriptions" INTEGER NOT NULL,
    "new_subscriptions" INTEGER NOT NULL,
    "cancelled_subscriptions" INTEGER NOT NULL,
    "subscription_revenue" DOUBLE PRECISION NOT NULL,
    "revenue_growth_rate" DOUBLE PRECISION,
    "customer_growth_rate" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_failure_analytics" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL,
    "total_failures" INTEGER NOT NULL,
    "insufficient_funds" INTEGER NOT NULL,
    "card_declined" INTEGER NOT NULL,
    "network_errors" INTEGER NOT NULL,
    "authentication_failed" INTEGER NOT NULL,
    "other_failures" INTEGER NOT NULL,
    "recovered_payments" INTEGER NOT NULL,
    "recovered_amount" DOUBLE PRECISION NOT NULL,
    "recovery_rate" DOUBLE PRECISION NOT NULL,
    "lost_revenue" DOUBLE PRECISION NOT NULL,
    "affected_customers" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_failure_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_payment_behavior" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "last_payment_date" TIMESTAMP(3),
    "average_order_value" DOUBLE PRECISION NOT NULL,
    "total_order_value" DOUBLE PRECISION NOT NULL,
    "order_frequency" DOUBLE PRECISION NOT NULL,
    "preferred_payment_method" TEXT,
    "preferred_order_time" TEXT,
    "preferred_order_days" TEXT,
    "payment_success_rate" DOUBLE PRECISION NOT NULL,
    "failure_count" INTEGER NOT NULL,
    "chargeback_count" INTEGER NOT NULL,
    "risk_score" DOUBLE PRECISION NOT NULL,
    "customer_since" TIMESTAMP(3) NOT NULL,
    "total_orders" INTEGER NOT NULL,
    "loyalty_tier" TEXT,
    "has_active_subscription" BOOLEAN NOT NULL DEFAULT false,
    "subscription_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subscription_start_date" TIMESTAMP(3),
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_payment_behavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_analytics" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "report_date" TIMESTAMP(3) NOT NULL,
    "report_type" TEXT NOT NULL DEFAULT 'daily',
    "active_subscriptions" INTEGER NOT NULL,
    "new_subscriptions" INTEGER NOT NULL,
    "cancelled_subscriptions" INTEGER NOT NULL,
    "suspended_subscriptions" INTEGER NOT NULL,
    "trial_subscriptions" INTEGER NOT NULL,
    "total_mrr" DOUBLE PRECISION NOT NULL,
    "avg_revenue_per_user" DOUBLE PRECISION NOT NULL,
    "churn_rate" DOUBLE PRECISION NOT NULL,
    "conversion_rate" DOUBLE PRECISION NOT NULL,
    "lifetime_value" DOUBLE PRECISION NOT NULL,
    "plan_breakdown" TEXT NOT NULL DEFAULT '{}',
    "cohort_analysis" TEXT NOT NULL DEFAULT '{}',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "device_model" TEXT,
    "os_version" TEXT,
    "app_version" TEXT,
    "fcm_token" TEXT,
    "apns_token" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen" TIMESTAMP(3),
    "notifications_enabled" BOOLEAN NOT NULL DEFAULT true,
    "notification_settings" TEXT NOT NULL DEFAULT '{}',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
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
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "channels" TEXT NOT NULL DEFAULT '[]',
    "scheduled_for" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_parents" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'parent',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "can_order" BOOLEAN NOT NULL DEFAULT true,
    "can_pickup" BOOLEAN NOT NULL DEFAULT true,
    "emergency_contact" BOOLEAN NOT NULL DEFAULT false,
    "contact_priority" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_parents_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "orders_assigned_staff_id_idx" ON "orders"("assigned_staff_id");

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
CREATE INDEX "daily_menus_school_id_idx" ON "daily_menus"("school_id");

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
CREATE INDEX "payment_retries_payment_id_idx" ON "payment_retries"("payment_id");

-- CreateIndex
CREATE INDEX "payment_retries_retry_at_idx" ON "payment_retries"("retry_at");

-- CreateIndex
CREATE INDEX "payment_retries_payment_id_retry_at_idx" ON "payment_retries"("payment_id", "retry_at");

-- CreateIndex
CREATE INDEX "billing_cycles_subscription_id_idx" ON "billing_cycles"("subscription_id");

-- CreateIndex
CREATE INDEX "billing_cycles_payment_id_idx" ON "billing_cycles"("payment_id");

-- CreateIndex
CREATE INDEX "billing_cycles_status_idx" ON "billing_cycles"("status");

-- CreateIndex
CREATE INDEX "billing_cycles_billing_date_idx" ON "billing_cycles"("billing_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_school_id_idx" ON "invoices"("school_id");

-- CreateIndex
CREATE INDEX "invoices_user_id_idx" ON "invoices"("user_id");

-- CreateIndex
CREATE INDEX "invoices_payment_id_idx" ON "invoices"("payment_id");

-- CreateIndex
CREATE INDEX "invoices_status_due_date_idx" ON "invoices"("status", "due_date");

-- CreateIndex
CREATE INDEX "invoices_invoice_date_idx" ON "invoices"("invoice_date");

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

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_children" ADD CONSTRAINT "parent_children_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_children" ADD CONSTRAINT "parent_children_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_staff_id_fkey" FOREIGN KEY ("assigned_staff_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_order_id_fkey" FOREIGN KEY ("payment_order_id") REFERENCES "payment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_plans" ADD CONSTRAINT "menu_plans_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_menus" ADD CONSTRAINT "daily_menus_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_menus" ADD CONSTRAINT "daily_menus_menu_plan_id_fkey" FOREIGN KEY ("menu_plan_id") REFERENCES "menu_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_slots" ADD CONSTRAINT "menu_item_slots_daily_menu_id_fkey" FOREIGN KEY ("daily_menu_id") REFERENCES "daily_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_item_slots" ADD CONSTRAINT "menu_item_slots_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_approvals" ADD CONSTRAINT "menu_approvals_menu_plan_id_fkey" FOREIGN KEY ("menu_plan_id") REFERENCES "menu_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfid_cards" ADD CONSTRAINT "rfid_cards_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rfid_readers" ADD CONSTRAINT "rfid_readers_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_verifications" ADD CONSTRAINT "delivery_verifications_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_verifications" ADD CONSTRAINT "delivery_verifications_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "rfid_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_verifications" ADD CONSTRAINT "delivery_verifications_reader_id_fkey" FOREIGN KEY ("reader_id") REFERENCES "rfid_readers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_verifications" ADD CONSTRAINT "delivery_verifications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_retries" ADD CONSTRAINT "payment_retries_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_records" ADD CONSTRAINT "reconciliation_records_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_cycles" ADD CONSTRAINT "billing_cycles_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_cycles" ADD CONSTRAINT "billing_cycles_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_email_logs" ADD CONSTRAINT "invoice_email_logs_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_templates" ADD CONSTRAINT "invoice_templates_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_analytics" ADD CONSTRAINT "payment_analytics_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_failure_analytics" ADD CONSTRAINT "payment_failure_analytics_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payment_behavior" ADD CONSTRAINT "customer_payment_behavior_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_payment_behavior" ADD CONSTRAINT "customer_payment_behavior_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_analytics" ADD CONSTRAINT "subscription_analytics_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_parents" ADD CONSTRAINT "student_parents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

