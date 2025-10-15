-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channels" TEXT NOT NULL DEFAULT '[]',
    "content" TEXT NOT NULL,
    "variables" TEXT NOT NULL DEFAULT '[]',
    "conditions" TEXT NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" DATETIME,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "notification_delivery_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "notification_id" TEXT NOT NULL,
    "template_id" TEXT,
    "channel" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "recipient_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "sent_at" DATETIME,
    "delivered_at" DATETIME,
    "failed_at" DATETIME,
    "error_code" TEXT,
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT,
    "provider_message_id" TEXT,
    "processing_time_ms" INTEGER,
    "delivery_time_ms" INTEGER,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_delivery_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notification_delivery_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "school_id" TEXT,
    "report_date" DATETIME NOT NULL,
    "report_type" TEXT NOT NULL DEFAULT 'daily',
    "total_sent" INTEGER NOT NULL DEFAULT 0,
    "total_delivered" INTEGER NOT NULL DEFAULT 0,
    "total_read" INTEGER NOT NULL DEFAULT 0,
    "total_failed" INTEGER NOT NULL DEFAULT 0,
    "delivery_rate" REAL NOT NULL DEFAULT 0,
    "read_rate" REAL NOT NULL DEFAULT 0,
    "failure_rate" REAL NOT NULL DEFAULT 0,
    "channel_stats" TEXT NOT NULL DEFAULT '{}',
    "template_stats" TEXT NOT NULL DEFAULT '{}',
    "avg_delivery_time_ms" INTEGER,
    "avg_processing_time_ms" INTEGER,
    "unique_recipients" INTEGER NOT NULL DEFAULT 0,
    "repeat_engagement" INTEGER NOT NULL DEFAULT 0,
    "top_error_codes" TEXT NOT NULL DEFAULT '{}',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_analytics_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "template_id" TEXT,
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
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "notifications_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_notifications" ("action_url", "body", "channels", "created_at", "data", "delivered_at", "id", "image_url", "message", "priority", "read_at", "scheduled_for", "sent_at", "status", "title", "type", "updated_at", "user_id") SELECT "action_url", "body", "channels", "created_at", "data", "delivered_at", "id", "image_url", "message", "priority", "read_at", "scheduled_for", "sent_at", "status", "title", "type", "updated_at", "user_id" FROM "notifications";
DROP TABLE "notifications";
ALTER TABLE "new_notifications" RENAME TO "notifications";
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX "notifications_template_id_idx" ON "notifications"("template_id");
CREATE INDEX "notifications_status_idx" ON "notifications"("status");
CREATE INDEX "notifications_type_idx" ON "notifications"("type");
CREATE INDEX "notifications_scheduled_for_idx" ON "notifications"("scheduled_for");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "notification_templates_type_idx" ON "notification_templates"("type");

-- CreateIndex
CREATE INDEX "notification_templates_is_active_idx" ON "notification_templates"("is_active");

-- CreateIndex
CREATE INDEX "notification_templates_is_default_idx" ON "notification_templates"("is_default");

-- CreateIndex
CREATE INDEX "notification_templates_created_by_idx" ON "notification_templates"("created_by");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_notification_id_idx" ON "notification_delivery_logs"("notification_id");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_template_id_idx" ON "notification_delivery_logs"("template_id");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_channel_idx" ON "notification_delivery_logs"("channel");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_status_idx" ON "notification_delivery_logs"("status");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_recipient_id_idx" ON "notification_delivery_logs"("recipient_id");

-- CreateIndex
CREATE INDEX "notification_delivery_logs_created_at_idx" ON "notification_delivery_logs"("created_at");

-- CreateIndex
CREATE INDEX "notification_analytics_report_date_idx" ON "notification_analytics"("report_date");

-- CreateIndex
CREATE INDEX "notification_analytics_report_type_idx" ON "notification_analytics"("report_type");

-- CreateIndex
CREATE UNIQUE INDEX "notification_analytics_school_id_report_date_report_type_key" ON "notification_analytics"("school_id", "report_date", "report_type");
