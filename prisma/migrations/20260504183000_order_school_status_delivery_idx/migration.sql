-- Compound index for school-scoped order lists by status and delivery date (dashboard / kitchen queries)
CREATE INDEX IF NOT EXISTS "orders_school_id_status_delivery_date_idx" ON "orders" ("school_id", "status", "delivery_date");
