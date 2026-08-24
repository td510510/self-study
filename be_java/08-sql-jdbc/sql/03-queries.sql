-- =====================================================================
-- Module 08 — 30 truy vấn từ dễ tới khó (có lời giải)
-- Hãy TỰ VIẾT trước khi đọc câu lệnh bên dưới.
-- =====================================================================

-- ============ MỨC 1: SELECT & WHERE ============

-- 1. Tất cả user đang ACTIVE, mới nhất trước
SELECT id, email, full_name, city FROM users
WHERE status = 'ACTIVE'
ORDER BY created_at DESC;

-- 2. Sản phẩm giá từ 1 tới 5 triệu
SELECT name, price FROM products
WHERE price BETWEEN 1000000 AND 5000000
ORDER BY price;

-- 3. User có email gmail hoặc tên chứa "An" (không phân biệt hoa thường)
SELECT * FROM users
WHERE email LIKE '%@gmail.com' OR LOWER(full_name) LIKE LOWER('%an%');

-- 4. User chưa cập nhật thành phố
SELECT id, full_name FROM users WHERE city IS NULL;

-- 5. Phân trang: 3 sản phẩm đắt nhất, trang 2
SELECT name, price FROM products ORDER BY price DESC LIMIT 3 OFFSET 3;

-- ============ MỨC 2: Hàm tổng hợp & GROUP BY ============

-- 6. Số user theo thành phố
SELECT COALESCE(city, '(chưa có)') AS city, COUNT(*) AS so_luong
FROM users GROUP BY city ORDER BY so_luong DESC;

-- 7. Giá trung bình / cao nhất / thấp nhất theo danh mục
SELECT c.name AS danh_muc, COUNT(*) AS so_sp,
       ROUND(AVG(p.price)) AS gia_tb, MAX(p.price) AS cao_nhat, MIN(p.price) AS thap_nhat
FROM products p JOIN categories c ON c.id = p.category_id
GROUP BY c.name ORDER BY gia_tb DESC;

-- 8. Thành phố có từ 2 user trở lên (HAVING lọc SAU khi gom nhóm)
SELECT city, COUNT(*) FROM users
WHERE city IS NOT NULL
GROUP BY city HAVING COUNT(*) >= 2;

-- 9. Tổng tồn kho theo danh mục
SELECT c.name, SUM(p.stock) AS ton_kho
FROM products p JOIN categories c ON c.id = p.category_id
GROUP BY c.name;

-- 10. Doanh thu theo trạng thái đơn
SELECT status, COUNT(*) AS so_don, SUM(total) AS doanh_thu
FROM orders GROUP BY status ORDER BY doanh_thu DESC NULLS LAST;

-- ============ MỨC 3: JOIN ============

-- 11. Đơn hàng kèm tên khách (INNER JOIN)
SELECT o.id, u.full_name, o.total, o.status
FROM orders o JOIN users u ON u.id = o.user_id
ORDER BY o.created_at DESC;

-- 12. TẤT CẢ user kèm số đơn (LEFT JOIN — giữ cả user chưa mua)
SELECT u.full_name, COUNT(o.id) AS so_don, COALESCE(SUM(o.total), 0) AS tong_chi
FROM users u LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id, u.full_name
ORDER BY tong_chi DESC;

-- 13. User CHƯA từng mua hàng
SELECT u.id, u.full_name FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;

-- 14. Chi tiết một đơn hàng (JOIN 3 bảng)
SELECT o.id AS don, p.name AS san_pham, oi.qty, oi.price, oi.qty * oi.price AS thanh_tien
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
WHERE o.id = 1;

-- 15. Sản phẩm chưa bao giờ được bán
SELECT p.sku, p.name FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.id
WHERE oi.product_id IS NULL;

-- 16. Top 5 sản phẩm bán chạy theo số lượng
SELECT p.name, SUM(oi.qty) AS da_ban, SUM(oi.qty * oi.price) AS doanh_thu
FROM order_items oi JOIN products p ON p.id = oi.product_id
GROUP BY p.id, p.name ORDER BY da_ban DESC LIMIT 5;

-- ============ MỨC 4: Subquery & CTE ============

-- 17. User có đơn > 5 triệu
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE total > 5000000);

-- 18. Sản phẩm đắt hơn giá trung bình toàn shop
SELECT name, price FROM products
WHERE price > (SELECT AVG(price) FROM products);

-- 19. Dùng CTE cho query nhiều tầng: khách VIP (đã chi > 5 triệu, không tính đơn hủy)
WITH chi_tieu AS (
    SELECT user_id, SUM(total) AS tong
    FROM orders WHERE status <> 'CANCELLED'
    GROUP BY user_id
)
SELECT u.full_name, u.city, c.tong
FROM users u JOIN chi_tieu c ON c.user_id = u.id
WHERE c.tong > 5000000
ORDER BY c.tong DESC;

-- 20. EXISTS: user có ít nhất một đơn PAID (thường nhanh hơn IN với dữ liệu lớn)
SELECT u.full_name FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.status = 'PAID');

-- 21. Subquery tương quan: đơn lớn nhất của mỗi user
SELECT u.full_name,
       (SELECT MAX(o.total) FROM orders o WHERE o.user_id = u.id) AS don_lon_nhat
FROM users u ORDER BY don_lon_nhat DESC NULLS LAST;

-- ============ MỨC 5: Window function ============

-- 22. Xếp hạng đơn hàng theo giá trị
SELECT o.id, u.full_name, o.total,
       RANK()       OVER (ORDER BY o.total DESC) AS hang,
       ROW_NUMBER() OVER (ORDER BY o.total DESC) AS stt
FROM orders o JOIN users u ON u.id = o.user_id;

-- 23. Đơn mới nhất của mỗi user
SELECT * FROM (
    SELECT o.*, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
    FROM orders o
) t WHERE rn = 1;

-- 24. Doanh thu lũy kế theo thời gian
SELECT created_at::date AS ngay, total,
       SUM(total) OVER (ORDER BY created_at) AS luy_ke
FROM orders WHERE status <> 'CANCELLED' ORDER BY created_at;

-- 25. So sánh đơn hiện tại với đơn trước của cùng user
SELECT user_id, id, total,
       LAG(total)  OVER (PARTITION BY user_id ORDER BY created_at) AS don_truoc,
       total - LAG(total) OVER (PARTITION BY user_id ORDER BY created_at) AS chenh_lech
FROM orders ORDER BY user_id, created_at;

-- 26. Tỷ trọng doanh thu mỗi đơn trên tổng
SELECT id, total,
       ROUND(100.0 * total / SUM(total) OVER (), 2) AS phan_tram
FROM orders WHERE status <> 'CANCELLED';

-- ============ MỨC 6: Báo cáo & thời gian ============

-- 27. Doanh thu theo tháng
SELECT TO_CHAR(created_at, 'YYYY-MM') AS thang,
       COUNT(*) AS so_don, SUM(total) AS doanh_thu, ROUND(AVG(total)) AS gia_tri_tb
FROM orders WHERE status <> 'CANCELLED'
GROUP BY 1 ORDER BY 1;

-- 28. Đơn trong 30 ngày gần nhất
SELECT * FROM orders WHERE created_at >= NOW() - INTERVAL '30 days';

-- 29. Tỷ lệ hủy đơn theo tháng (dùng FILTER)
SELECT TO_CHAR(created_at, 'YYYY-MM') AS thang,
       COUNT(*) AS tong,
       COUNT(*) FILTER (WHERE status = 'CANCELLED') AS huy,
       ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'CANCELLED') / COUNT(*), 1) AS ty_le_huy
FROM orders GROUP BY 1 ORDER BY 1;

-- 30. Báo cáo tổng hợp khách hàng
WITH thong_ke AS (
    SELECT u.id, u.full_name, u.city,
           COUNT(o.id) FILTER (WHERE o.status <> 'CANCELLED') AS so_don,
           COALESCE(SUM(o.total) FILTER (WHERE o.status <> 'CANCELLED'), 0) AS tong_chi,
           MAX(o.created_at) AS lan_mua_cuoi
    FROM users u LEFT JOIN orders o ON o.user_id = u.id
    GROUP BY u.id, u.full_name, u.city
)
SELECT *,
       CASE WHEN tong_chi >= 20000000 THEN 'VIP'
            WHEN tong_chi >= 5000000  THEN 'Thân thiết'
            WHEN so_don > 0           THEN 'Thường'
            ELSE 'Chưa mua' END AS phan_loai
FROM thong_ke ORDER BY tong_chi DESC;

-- ============ TỐI ƯU: EXPLAIN ============

-- Trước khi tạo index: quét toàn bảng (Seq Scan)
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 1;

-- So sánh index có/không (thử trên bảng lớn):
-- DROP INDEX idx_orders_user_id;  -> chạy lại EXPLAIN -> Seq Scan
-- CREATE INDEX idx_orders_user_id ON orders(user_id); -> Index Scan

-- Index KHÔNG dùng được vì có hàm bọc quanh cột:
EXPLAIN ANALYZE SELECT * FROM products WHERE LOWER(name) LIKE '%dell%';
-- Đã có idx_products_name_lower nhưng LIKE '%...' đầu chuỗi vẫn phải quét.
