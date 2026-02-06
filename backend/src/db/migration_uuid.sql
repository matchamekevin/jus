-- ============================================================
-- MIGRATION : Conversion de tous les IDs SERIAL vers UUID
-- ============================================================
-- Activer l'extension uuid si pas déjà fait
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1) USERS : id SERIAL → UUID
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS uid UUID DEFAULT uuid_generate_v4();
UPDATE users SET uid = uuid_generate_v4() WHERE uid IS NULL;

-- ============================================================
-- 2) PRODUCTS : id SERIAL → UUID
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS uid UUID DEFAULT uuid_generate_v4();
UPDATE products SET uid = uuid_generate_v4() WHERE uid IS NULL;

-- ============================================================
-- 3) PRODUCT_VARIANTS : id SERIAL → UUID
-- ============================================================
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS uid UUID DEFAULT uuid_generate_v4();
UPDATE product_variants SET uid = uuid_generate_v4() WHERE uid IS NULL;

-- ============================================================
-- 4) DELIVERIES : id SERIAL → UUID
-- ============================================================
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS uid UUID DEFAULT uuid_generate_v4();
UPDATE deliveries SET uid = uuid_generate_v4() WHERE uid IS NULL;

-- ============================================================
-- 5) ORDERS : id SERIAL → UUID
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS uid UUID DEFAULT uuid_generate_v4();
UPDATE orders SET uid = uuid_generate_v4() WHERE uid IS NULL;

-- ============================================================
-- 6) ORDER_ITEMS : id SERIAL → UUID
-- ============================================================
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS uid UUID DEFAULT uuid_generate_v4();
UPDATE order_items SET uid = uuid_generate_v4() WHERE uid IS NULL;

-- ============================================================
-- 7) PAYMENTS : id SERIAL → UUID
-- ============================================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS uid UUID DEFAULT uuid_generate_v4();
UPDATE payments SET uid = uuid_generate_v4() WHERE uid IS NULL;

-- ============================================================
-- 8) PROMOS : id SERIAL → UUID
-- ============================================================
ALTER TABLE promos ADD COLUMN IF NOT EXISTS uid UUID DEFAULT uuid_generate_v4();
UPDATE promos SET uid = uuid_generate_v4() WHERE uid IS NULL;

-- ============================================================
-- Index sur les colonnes uid
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uid ON users(uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_uid ON products(uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_uid ON product_variants(uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_uid ON deliveries(uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_uid ON orders(uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_items_uid ON order_items(uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_uid ON payments(uid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_promos_uid ON promos(uid);
