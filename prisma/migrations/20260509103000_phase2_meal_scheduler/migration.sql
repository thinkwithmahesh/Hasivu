-- Phase 2D: meal scheduling calendar.
-- Feature-flagged behind MEAL_SCHEDULER_ENABLED=false.

CREATE TABLE IF NOT EXISTS "meal_schedules" (
  "id" TEXT NOT NULL,
  "school_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "effective_from" TIMESTAMP(3) NOT NULL,
  "effective_to" TIMESTAMP(3),
  "recurrence_rule" TEXT,
  "target_type" TEXT NOT NULL,
  "target_id" TEXT,
  "cutoff_minutes" INTEGER NOT NULL DEFAULT 120,
  "created_by" TEXT NOT NULL,
  "published_by" TEXT,
  "published_at" TIMESTAMP(3),
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meal_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meal_schedule_slots" (
  "id" TEXT NOT NULL,
  "schedule_id" TEXT NOT NULL,
  "service_date" TIMESTAMP(3) NOT NULL,
  "slot" TEXT NOT NULL,
  "menu_item_id" TEXT NOT NULL,
  "planned_quantity" INTEGER,
  "max_per_student" INTEGER,
  "price_override" DECIMAL(65,30),
  "kitchen_notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meal_schedule_slots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meal_schedule_exceptions" (
  "id" TEXT NOT NULL,
  "schedule_id" TEXT NOT NULL,
  "service_date" TIMESTAMP(3) NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "payload" JSONB,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "meal_schedule_exceptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "meal_schedules_school_id_status_effective_from_idx"
  ON "meal_schedules"("school_id", "status", "effective_from");
CREATE INDEX IF NOT EXISTS "meal_schedules_school_id_target_type_target_id_idx"
  ON "meal_schedules"("school_id", "target_type", "target_id");
CREATE INDEX IF NOT EXISTS "meal_schedules_deleted_at_idx"
  ON "meal_schedules"("deleted_at");

CREATE UNIQUE INDEX IF NOT EXISTS "meal_schedule_slots_schedule_id_service_date_slot_menu_item_id_key"
  ON "meal_schedule_slots"("schedule_id", "service_date", "slot", "menu_item_id");
CREATE INDEX IF NOT EXISTS "meal_schedule_slots_service_date_slot_idx"
  ON "meal_schedule_slots"("service_date", "slot");
CREATE INDEX IF NOT EXISTS "meal_schedule_slots_menu_item_id_idx"
  ON "meal_schedule_slots"("menu_item_id");

CREATE UNIQUE INDEX IF NOT EXISTS "meal_schedule_exceptions_schedule_id_service_date_action_key"
  ON "meal_schedule_exceptions"("schedule_id", "service_date", "action");
CREATE INDEX IF NOT EXISTS "meal_schedule_exceptions_service_date_idx"
  ON "meal_schedule_exceptions"("service_date");

ALTER TABLE "meal_schedule_slots"
  ADD CONSTRAINT "meal_schedule_slots_schedule_id_fkey"
  FOREIGN KEY ("schedule_id") REFERENCES "meal_schedules"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meal_schedule_exceptions"
  ADD CONSTRAINT "meal_schedule_exceptions_schedule_id_fkey"
  FOREIGN KEY ("schedule_id") REFERENCES "meal_schedules"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
