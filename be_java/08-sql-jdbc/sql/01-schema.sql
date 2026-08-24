-- =====================================================================
-- Module 08 — Schema mẫu (PostgreSQL 14+)
-- Chạy: psql -U postgres -d learndb -f 01-schema.sql
-- =====================================================================

DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ---------------------------------------------------------------- users
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(100) NOT NULL,
    age         INT CHECK (age >= 0 AND age <= 150),
    city        VARCHAR(100),
    status      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
COMMENT ON TABLE users IS 'Người dùng hệ thống';

-- ----------------------------------------------------------- categories
CREATE TABLE categories (
    id     BIGSERIAL PRIMARY KEY,
    name   VARCHAR(100) NOT NULL UNIQUE,
    parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL   -- danh mục lồng nhau
);

-- ------------------------------------------------------------- products
CREATE TABLE products (
    id          BIGSERIAL PRIMARY KEY,
    sku         VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(200) NOT NULL,
    category_id BIGINT       NOT NULL REFERENCES categories(id),
    price       NUMERIC(15,2) NOT NULL CHECK (price >= 0),   -- TIỀN: NUMERIC, không FLOAT
    stock       INT          NOT NULL DEFAULT 0 CHECK (stock >= 0),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------------------- orders
CREATE TABLE orders (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total       NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
    status      VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------- order_items
CREATE TABLE order_items (
    order_id   BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),
    qty        INT    NOT NULL CHECK (qty > 0),
    price      NUMERIC(15,2) NOT NULL,      -- lưu giá TẠI THỜI ĐIỂM MUA (phi chuẩn hóa có chủ đích)
    PRIMARY KEY (order_id, product_id)      -- khóa chính tổ hợp
);

-- ---------------------------------------------------------------- INDEX
-- Khóa ngoại: Postgres KHÔNG tự tạo index cho FK -> phải tự tạo
CREATE INDEX idx_orders_user_id        ON orders(user_id);
CREATE INDEX idx_products_category_id  ON products(category_id);
CREATE INDEX idx_order_items_product   ON order_items(product_id);

-- Cột hay lọc/sắp xếp
CREATE INDEX idx_orders_status_created ON orders(status, created_at DESC);
CREATE INDEX idx_users_city            ON users(city) WHERE city IS NOT NULL;  -- partial index
CREATE INDEX idx_products_name_lower   ON products(LOWER(name));               -- index biểu thức

-- --------------------------------------------------------------- VIEW
CREATE OR REPLACE VIEW v_order_summary AS
SELECT o.id            AS order_id,
       u.full_name     AS customer,
       u.city,
       o.status,
       o.created_at,
       COUNT(oi.product_id) AS item_count,
       COALESCE(SUM(oi.qty * oi.price), 0) AS computed_total
FROM orders o
JOIN users u ON u.id = o.user_id
LEFT JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, u.full_name, u.city, o.status, o.created_at;

-- ------------------------------------------------------------- TRIGGER
-- Tự cập nhật updated_at mỗi lần UPDATE
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
