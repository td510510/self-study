-- product_db thuộc về DUY NHẤT product-service. Service khác muốn dữ liệu thì gọi API.

CREATE TABLE products (
    id          BIGSERIAL    PRIMARY KEY,
    sku         VARCHAR(50)  NOT NULL UNIQUE,
    name        VARCHAR(200) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    price       BIGINT       NOT NULL CHECK (price > 0),          -- VND, số nguyên: không dùng số thực cho tiền
    stock       INT          NOT NULL CHECK (stock >= 0),         -- lưới an toàn cuối cùng: DB từ chối tồn kho âm
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    version     BIGINT       NOT NULL DEFAULT 0,                  -- optimistic locking khi admin sửa
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category ON products (category) WHERE active;
CREATE INDEX idx_products_price    ON products (price)    WHERE active;

-- Mỗi dòng: một sản phẩm được giữ cho một đơn hàng.
-- UNIQUE (order_id, product_id) là thứ biến "reserve" thành IDEMPOTENT: cùng một orderId
-- không thể giữ kho hai lần, kể cả khi hai request trùng nhau tới cùng lúc.
CREATE TABLE stock_reservations (
    id           BIGSERIAL   PRIMARY KEY,
    order_id     BIGINT      NOT NULL,
    product_id   BIGINT      NOT NULL REFERENCES products (id),
    quantity     INT         NOT NULL CHECK (quantity > 0),
    unit_price   BIGINT      NOT NULL,                             -- chốt giá tại thời điểm đặt
    status       VARCHAR(20) NOT NULL,                             -- RESERVED | RELEASED
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    released_at  TIMESTAMPTZ,
    CONSTRAINT uq_reservation_order_product UNIQUE (order_id, product_id)
);

CREATE INDEX idx_reservations_order ON stock_reservations (order_id);
