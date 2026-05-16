-- Inventory and procurement persistence.
-- Replaces live stub supplier / purchase-order endpoints with school-scoped durable tables.

CREATE TABLE "inventory_suppliers" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "tax_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_suppliers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "menu_item_id" TEXT,
    "supplier_id" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reserved_quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "min_stock" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "max_stock" DECIMAL(65,30),
    "reorder_point" DECIMAL(65,30),
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "location" TEXT,
    "batch_number" TEXT,
    "expiry_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "metadata" JSONB,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_purchase_orders" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_delivery" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "total_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "notes" TEXT,
    "metadata" JSONB,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventory_purchase_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_purchase_order_items" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "inventory_item_id" TEXT,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "total_price" DECIMAL(65,30) NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_purchase_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "inventory_reservations" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'reserved',
    "expires_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "inventory_suppliers_school_id_name_key"
    ON "inventory_suppliers"("school_id", "name");
CREATE INDEX "inventory_suppliers_school_id_status_idx"
    ON "inventory_suppliers"("school_id", "status");
CREATE INDEX "inventory_suppliers_deleted_at_idx"
    ON "inventory_suppliers"("deleted_at");

CREATE UNIQUE INDEX "inventory_items_school_id_sku_key"
    ON "inventory_items"("school_id", "sku");
CREATE INDEX "inventory_items_school_id_category_status_idx"
    ON "inventory_items"("school_id", "category", "status");
CREATE INDEX "inventory_items_school_id_menu_item_id_idx"
    ON "inventory_items"("school_id", "menu_item_id");
CREATE INDEX "inventory_items_school_id_supplier_id_idx"
    ON "inventory_items"("school_id", "supplier_id");
CREATE INDEX "inventory_items_expiry_date_idx"
    ON "inventory_items"("expiry_date");
CREATE INDEX "inventory_items_deleted_at_idx"
    ON "inventory_items"("deleted_at");

CREATE UNIQUE INDEX "inventory_purchase_orders_school_id_order_number_key"
    ON "inventory_purchase_orders"("school_id", "order_number");
CREATE INDEX "inventory_purchase_orders_school_id_supplier_id_idx"
    ON "inventory_purchase_orders"("school_id", "supplier_id");
CREATE INDEX "inventory_purchase_orders_school_id_status_idx"
    ON "inventory_purchase_orders"("school_id", "status");
CREATE INDEX "inventory_purchase_orders_order_date_idx"
    ON "inventory_purchase_orders"("order_date");
CREATE INDEX "inventory_purchase_orders_deleted_at_idx"
    ON "inventory_purchase_orders"("deleted_at");

CREATE INDEX "inventory_purchase_order_items_purchase_order_id_idx"
    ON "inventory_purchase_order_items"("purchase_order_id");
CREATE INDEX "inventory_purchase_order_items_inventory_item_id_idx"
    ON "inventory_purchase_order_items"("inventory_item_id");

CREATE UNIQUE INDEX "inventory_reservations_order_id_inventory_item_id_key"
    ON "inventory_reservations"("order_id", "inventory_item_id");
CREATE INDEX "inventory_reservations_school_id_status_idx"
    ON "inventory_reservations"("school_id", "status");
CREATE INDEX "inventory_reservations_expires_at_idx"
    ON "inventory_reservations"("expires_at");

ALTER TABLE "inventory_suppliers"
    ADD CONSTRAINT "inventory_suppliers_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_suppliers"
    ADD CONSTRAINT "inventory_suppliers_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_items"
    ADD CONSTRAINT "inventory_items_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_items"
    ADD CONSTRAINT "inventory_items_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "inventory_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_items"
    ADD CONSTRAINT "inventory_items_menu_item_id_fkey"
    FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_items"
    ADD CONSTRAINT "inventory_items_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_purchase_orders"
    ADD CONSTRAINT "inventory_purchase_orders_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_purchase_orders"
    ADD CONSTRAINT "inventory_purchase_orders_supplier_id_fkey"
    FOREIGN KEY ("supplier_id") REFERENCES "inventory_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_purchase_orders"
    ADD CONSTRAINT "inventory_purchase_orders_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_purchase_order_items"
    ADD CONSTRAINT "inventory_purchase_order_items_purchase_order_id_fkey"
    FOREIGN KEY ("purchase_order_id") REFERENCES "inventory_purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_purchase_order_items"
    ADD CONSTRAINT "inventory_purchase_order_items_inventory_item_id_fkey"
    FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "inventory_reservations"
    ADD CONSTRAINT "inventory_reservations_school_id_fkey"
    FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_reservations"
    ADD CONSTRAINT "inventory_reservations_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_reservations"
    ADD CONSTRAINT "inventory_reservations_inventory_item_id_fkey"
    FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
