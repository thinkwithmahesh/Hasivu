-- Durable analytics metric storage for MetricTrackingService.

CREATE TABLE "analytics_metrics" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_metrics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analytics_metrics_name_created_at_idx"
    ON "analytics_metrics"("name", "created_at");
CREATE INDEX "analytics_metrics_created_at_idx"
    ON "analytics_metrics"("created_at");
