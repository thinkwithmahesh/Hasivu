-- Phase 2E: safe, rule-based recommendations.
-- Feature-flagged behind RECOMMENDATIONS_ENABLED=false.

CREATE TABLE IF NOT EXISTS "recommendation_runs" (
  "id" TEXT NOT NULL,
  "school_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "student_id" TEXT,
  "engine_version" TEXT NOT NULL,
  "mode" TEXT NOT NULL DEFAULT 'rule_based',
  "input_hash" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "explanation" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recommendation_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "recommendation_items" (
  "id" TEXT NOT NULL,
  "run_id" TEXT NOT NULL,
  "menu_item_id" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "reasons" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recommendation_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "recommendation_feedback" (
  "id" TEXT NOT NULL,
  "school_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "recommendation_item_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recommendation_feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "recommendation_runs_school_id_user_id_created_at_idx"
  ON "recommendation_runs"("school_id", "user_id", "created_at");
CREATE INDEX IF NOT EXISTS "recommendation_runs_student_id_created_at_idx"
  ON "recommendation_runs"("student_id", "created_at");
CREATE INDEX IF NOT EXISTS "recommendation_runs_input_hash_idx"
  ON "recommendation_runs"("input_hash");

CREATE UNIQUE INDEX IF NOT EXISTS "recommendation_items_run_id_menu_item_id_key"
  ON "recommendation_items"("run_id", "menu_item_id");
CREATE INDEX IF NOT EXISTS "recommendation_items_menu_item_id_idx"
  ON "recommendation_items"("menu_item_id");
CREATE INDEX IF NOT EXISTS "recommendation_items_rank_idx"
  ON "recommendation_items"("rank");

CREATE INDEX IF NOT EXISTS "recommendation_feedback_school_id_user_id_created_at_idx"
  ON "recommendation_feedback"("school_id", "user_id", "created_at");
CREATE INDEX IF NOT EXISTS "recommendation_feedback_recommendation_item_id_idx"
  ON "recommendation_feedback"("recommendation_item_id");
CREATE INDEX IF NOT EXISTS "recommendation_feedback_action_idx"
  ON "recommendation_feedback"("action");

ALTER TABLE "recommendation_items"
  ADD CONSTRAINT "recommendation_items_run_id_fkey"
  FOREIGN KEY ("run_id") REFERENCES "recommendation_runs"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recommendation_feedback"
  ADD CONSTRAINT "recommendation_feedback_recommendation_item_id_fkey"
  FOREIGN KEY ("recommendation_item_id") REFERENCES "recommendation_items"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
