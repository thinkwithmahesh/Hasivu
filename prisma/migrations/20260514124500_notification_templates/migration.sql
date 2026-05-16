CREATE TABLE "notification_templates" (
  "id" TEXT NOT NULL,
  "school_id" TEXT,
  "template_key" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'in_app',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "variables" TEXT NOT NULL DEFAULT '[]',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_templates_school_id_template_key_channel_key" ON "notification_templates"("school_id", "template_key", "channel");
CREATE INDEX "notification_templates_template_key_idx" ON "notification_templates"("template_key");
CREATE INDEX "notification_templates_school_id_is_active_idx" ON "notification_templates"("school_id", "is_active");

ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
