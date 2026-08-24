-- =====================================================================
-- Module 08 — Dữ liệu mẫu
-- Chạy sau 01-schema.sql:  psql -U postgres -d learndb -f 02-seed.sql
-- =====================================================================

INSERT INTO users (email, password, full_name, age, city, status) VALUES
('an@example.com',    'hash1', 'Nguyễn Văn An',   25, 'Hà Nội',   'ACTIVE'),
('binh@example.com',  'hash2', 'Trần Thị Bình',   34, 'TP.HCM',   'ACTIVE'),
('cuong@example.com', 'hash3', 'Lê Văn Cường',    17, 'Hà Nội',   'ACTIVE'),
('dung@example.com',  'hash4', 'Phạm Thị Dung',   42, 'Đà Nẵng',  'ACTIVE'),
('em@example.com',    'hash5', 'Hoàng Văn Em',    29, 'TP.HCM',   'INACTIVE'),
('phuc@example.com',  'hash6', 'Vũ Minh Phúc',    31, 'Hải Phòng','ACTIVE'),
('giang@example.com', 'hash7', 'Đỗ Thu Giang',    22, NULL,       'ACTIVE');

INSERT INTO categories (name, parent_id) VALUES
('Máy tính', NULL),
('Phụ kiện', NULL),
('Linh kiện', NULL);
INSERT INTO categories (name, parent_id) VALUES
('Laptop', 1), ('Màn hình', 1);

INSERT INTO products (sku, name, category_id, price, stock) VALUES
('LT-DELL-01', 'Laptop Dell Inspiron 15',  4, 22000000, 12),
('LT-MAC-01',  'MacBook Air M3',           4, 35000000,  5),
('MN-LG-24',   'Màn hình LG 24 inch',      5,  3500000, 30),
('KB-KEY-01',  'Bàn phím cơ Keychron K2',  2,  1200000, 45),
('MS-LOGI-01', 'Chuột không dây Logitech', 2,   450000, 80),
('HP-SONY-01', 'Tai nghe Sony WH-1000XM5', 2,  8900000,  8),
('CB-HDMI-01', 'Cáp HDMI 2m',              2,   120000, 200),
('SSD-SAM-01', 'Ổ cứng SSD Samsung 1TB',   3,  1800000, 25),
('RAM-KING-01','RAM Kingston 16GB',        3,  1500000, 40);

INSERT INTO orders (user_id, status, created_at) VALUES
(1, 'PAID',      '2026-01-15 10:00+07'),
(2, 'SHIPPED',   '2026-01-20 14:30+07'),
(1, 'CANCELLED', '2026-02-03 09:15+07'),
(3, 'PAID',      '2026-02-10 16:45+07'),
(4, 'PENDING',   '2026-03-01 11:20+07'),
(2, 'PAID',      '2026-03-12 08:00+07'),
(6, 'DELIVERED', '2026-03-15 13:10+07'),
(1, 'PAID',      '2026-03-20 17:30+07');

INSERT INTO order_items (order_id, product_id, qty, price) VALUES
(1, 4, 1, 1200000), (1, 5, 2, 450000),
(2, 1, 1, 22000000),
(3, 6, 1, 8900000),
(4, 3, 2, 3500000), (4, 7, 3, 120000),
(5, 2, 1, 35000000), (5, 4, 1, 1200000),
(6, 8, 2, 1800000),
(7, 9, 2, 1500000), (7, 5, 1, 450000),
(8, 3, 1, 3500000);

-- Cập nhật tổng tiền đơn hàng từ chi tiết
UPDATE orders o
SET total = COALESCE((SELECT SUM(oi.qty * oi.price) FROM order_items oi WHERE oi.order_id = o.id), 0);

-- Kiểm tra
SELECT 'users' AS bang, COUNT(*) FROM users
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders',   COUNT(*) FROM orders
UNION ALL SELECT 'items',    COUNT(*) FROM order_items;
