# Bài tập Module 08 — SQL & JDBC

> Chuẩn bị: chạy `sql/01-schema.sql` rồi `sql/02-seed.sql` trên database `learndb`.

## Nhóm A — Thiết kế cơ sở dữ liệu

**A1. Thiết kế DB cho hệ thống blog**: users, posts, comments, tags, post_tags.
Yêu cầu: khóa chính/khóa ngoại đầy đủ, quan hệ n-n cho tags, soft delete (`deleted_at`), `created_at`/`updated_at`.
*Đạt khi*: vẽ được ERD và giải thích vì sao chọn từng kiểu dữ liệu.

**A2. Thiết kế DB cho hệ thống đặt phòng khách sạn**: rooms, room_types, bookings, guests, payments.
Ràng buộc nghiệp vụ: **không cho 2 booking trùng phòng, trùng khoảng ngày**. Gợi ý: dùng `CHECK` + ràng buộc `EXCLUDE USING gist` của Postgres.

**A3.** Cho bảng sai chuẩn sau, hãy chuẩn hóa về 3NF:
```
don_hang(id, ten_khach, sdt_khach, dia_chi_khach, san_pham_1, sl_1, san_pham_2, sl_2, tong_tien)
```

**A4.** Giải thích khi nào **cố ý** phi chuẩn hóa. Cho ví dụ trong schema shop ở module này.

## Nhóm B — Truy vấn (dùng schema có sẵn)

Viết SQL cho từng yêu cầu, **tự làm trước** rồi so với `sql/03-queries.sql`.

**B1.** 10 sản phẩm sắp hết hàng (stock < 10), sắp xếp tăng dần.
**B2.** Doanh thu từng tháng của năm 2026.
**B3.** Top 3 khách chi nhiều nhất (không tính đơn CANCELLED).
**B4.** Sản phẩm chưa bao giờ được bán.
**B5.** Khách mua từ 2 đơn trở lên.
**B6.** Với mỗi danh mục: số sản phẩm, giá trung bình, sản phẩm đắt nhất.
**B7.** Tỷ lệ đơn hủy theo tháng.
**B8.** Đơn hàng gần nhất của mỗi khách (window function).
**B9.** Doanh thu lũy kế theo ngày.
**B10.** Khách hàng "ngủ đông": không mua gì trong 60 ngày gần nhất nhưng trước đó có mua.
**B11.** Xếp hạng sản phẩm theo doanh thu trong từng danh mục (`RANK() OVER PARTITION BY`).
**B12.** Báo cáo phân loại khách: VIP / Thân thiết / Thường / Chưa mua.

## Nhóm C — Index & tối ưu

**C1.** Sinh 1 triệu dòng vào bảng `orders`:
```sql
INSERT INTO orders (user_id, total, status, created_at)
SELECT (random()*6+1)::int, (random()*10000000)::numeric(15,2),
       (ARRAY['PENDING','PAID','SHIPPED','CANCELLED'])[floor(random()*4+1)],
       NOW() - (random()*365 || ' days')::interval
FROM generate_series(1, 1000000);
```

**C2.** Chạy `EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 3;` — ghi lại thời gian và kiểu scan. Xóa index rồi chạy lại, so sánh.

**C3.** Tạo index tổ hợp `(status, created_at)` và kiểm chứng nó dùng được cho query nào, **không** dùng được cho query nào (quy tắc tiền tố trái).

**C4.** Tìm 3 query bị `Seq Scan` và sửa (thêm index hoặc viết lại query).

**C5.** Chứng minh index **không** được dùng khi: (a) có hàm bọc cột, (b) `LIKE '%abc'`, (c) tính toán trên cột. Sửa từng trường hợp.

**C6.** So sánh `COUNT(*)` với `EXISTS` khi chỉ cần biết "có tồn tại hay không".

## Nhóm D — Transaction

**D1.** Viết transaction chuyển tiền giữa 2 tài khoản; kiểm chứng rollback khi số dư không đủ.

**D2.** Mở 2 phiên `psql`, thử nghiệm:
- Phiên 1 `BEGIN; UPDATE ...` chưa commit → phiên 2 đọc thấy gì? (dirty read)
- Đặt `SET TRANSACTION ISOLATION LEVEL REPEATABLE READ` và lặp lại.

**D3.** Tạo deadlock giữa 2 phiên (mỗi phiên update 2 dòng theo thứ tự ngược nhau), quan sát thông báo của Postgres và sửa.

**D4.** Dùng `SELECT ... FOR UPDATE` để trừ tồn kho an toàn khi 2 phiên cùng mua sản phẩm cuối cùng.

**D5.** Cài **optimistic locking**: thêm cột `version`, `UPDATE ... WHERE id = ? AND version = ?`, xử lý khi 0 dòng bị ảnh hưởng.

## Nhóm E — JDBC

**E1.** Kết nối DB, in ra tên và phiên bản DB.

**E2.** Cài `UserRepository` bằng JDBC với: `save`, `findById` (trả `Optional`), `findAll(page,size)`, `update`, `deleteById`, `countAll`.
*Đạt khi*: dùng `PreparedStatement` + try-with-resources ở mọi nơi, bọc `SQLException` thành exception riêng có `cause`.

**E3.** Chứng minh SQL Injection với `Statement` nối chuỗi, rồi sửa bằng `PreparedStatement`.

**E4.** Insert 10.000 dòng theo 2 cách (từng dòng vs batch 500) và so sánh thời gian.

**E5.** Viết transaction JDBC: tạo đơn hàng + chi tiết + trừ tồn kho; nếu tồn kho không đủ thì rollback toàn bộ.

**E6.** Cấu hình HikariCP, đo thời gian 100 lần lấy connection có pool và không pool.

**E7.** Viết `RowMapper<T>` generic để không phải lặp code map `ResultSet` → object.

## Nhóm F — Tổng hợp (bắt buộc)

**F1. Tầng dữ liệu cho ứng dụng thư viện** (chuẩn bị trực tiếp cho Dự án 1):
```
books(id, isbn, title, author, category, total_copies, available_copies)
members(id, code, name, email, phone, joined_at, status)
loans(id, book_id, member_id, borrowed_at, due_date, returned_at, fee)
```
Yêu cầu:
- Script tạo bảng + index + ràng buộc.
- `BookRepository`, `MemberRepository`, `LoanRepository` bằng JDBC.
- Truy vấn: sách đang được mượn, thành viên đang giữ quá 3 cuốn, danh sách quá hạn kèm phí phạt, top 10 sách mượn nhiều nhất.
- Mượn sách phải là **một transaction**: tạo loan + giảm `available_copies`, rollback nếu hết sách.

*Đạt khi*: chạy 2 luồng cùng mượn cuốn sách cuối cùng, chỉ **một** luồng thành công.

---

## Câu hỏi phỏng vấn
1. `INNER JOIN` khác `LEFT JOIN` thế nào?
2. `WHERE` khác `HAVING` ra sao?
3. Index hoạt động thế nào? Khi nào index bị vô hiệu?
4. Index tổ hợp `(a, b)` dùng được cho query nào?
5. ACID là gì?
6. Các mức isolation? Dirty read / non-repeatable read / phantom read?
7. Optimistic vs pessimistic locking — khi nào dùng cái nào?
8. SQL Injection là gì, chống bằng cách nào?
9. `Statement` khác `PreparedStatement`?
10. Vì sao cần connection pool? Pool lớn có tốt hơn không?
11. `DELETE` khác `TRUNCATE` khác `DROP`?
12. Bạn xử lý thế nào khi một API bị chậm do query?
