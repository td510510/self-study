# Đáp án — dành cho giảng viên

> ⚠️ **Không phát thư mục này cho học viên trước khi họ nộp bài.**
> Nếu dùng Git, cân nhắc để `dap-an/` trong `.gitignore` của repo phát cho lớp.

| File | Nội dung |
|------|----------|
| [buoi-03-dap-an.md](buoi-03-dap-an.md) | ERD trung tâm ngoại ngữ, phòng khám; phân tích lỗi thiết kế |
| [buoi-04-dap-an.md](buoi-04-dap-an.md) | Chuẩn hóa từng bước, bài toán BCNF hình thức, phân tích `NhaXuatBan` |
| [buoi-05-dap-an.sql](buoi-05-dap-an.sql) | SELECT/WHERE/CASE, DDL, ba cách sửa lỗi bí danh trong WHERE |
| [buoi-06-dap-an.sql](buoi-06-dap-an.sql) | JOIN, GROUP BY, và **giải thích chi tiết 3 bẫy JOIN** |
| [buoi-07-dap-an.sql](buoi-07-dap-an.sql) | Subquery, CTE (kể cả đệ quy), window function, 4 view |
| [buoi-08-dap-an.sql](buoi-08-dap-an.sql) | Stored procedure có transaction, phân tích thứ tự cột index, giải thích mức cô lập |
| [buoi-09-dap-an.js](buoi-09-dap-an.js) | CRUD + Aggregation MongoDB, thiết kế bucket pattern cho IoT, validator |

---

## Ghi chú sư phạm — những chỗ cần dành thời gian

| Buổi | Điểm học viên hay sai | Cách xử lý trong lớp |
|------|----------------------|---------------------|
| 1 | Quên tiền tố `N'...'` → tiếng Việt thành `?` | Demo lỗi ngay trên máy chiếu, để cả lớp thấy dấu `?` |
| 2 | `WHERE cot = NULL` | Cho chạy thử, chỉ ra 0 dòng, giải thích logic ba trạng thái |
| 3 | Gộp `KhoaHoc` và `Lop`; bỏ bảng trung gian N–N | Hỏi ngược: "một khóa mở 3 đợt thì lưu thế nào?" |
| 4 | Nhầm "dữ liệu trùng" với "vi phạm chuẩn hóa" (`ChiTietDonHang.DonGia`) | Nhấn mạnh: phải có **phụ thuộc hàm** mới là vi phạm |
| 5 | Dùng bí danh trong `WHERE` | Vẽ lại sơ đồ thứ tự thực thi lên bảng |
| 6 | `COUNT(*)` sau JOIN 1–N; `WHERE` phá `LEFT JOIN` | Chạy nhóm C của `bai-tap-buoi-06.sql`, để lớp tự đoán trước |
| 7 | `NOT IN` với `NULL`; lọc `ROW_NUMBER()` trực tiếp trong `WHERE` | Cho chạy câu A6 để thấy kết quả 0 dòng bất thường |
| 8 | Tạo index cho mọi cột; giao dịch quá dài | Cho xem `user_updates` cao mà `user_seeks` = 0 |
| 9 | Quên `$set`; nhúng mảng tăng vô hạn | Demo document bị mất trường sau update sai |
| 10 | "NoSQL hiện đại hơn nên tốt hơn" | Đưa 3 tình huống thực tế, để lớp tranh luận trước khi chốt |

---

## Kiểm tra nhanh trước mỗi buổi

```sql
-- Dữ liệu BookStore còn nguyên vẹn không?
USE BookStore;
SELECT 'DanhMuc' AS Bang, COUNT(*) AS SoDong FROM DanhMuc
UNION ALL SELECT 'TacGia',         COUNT(*) FROM TacGia
UNION ALL SELECT 'Sach',           COUNT(*) FROM Sach          -- 20
UNION ALL SELECT 'Sach_TacGia',    COUNT(*) FROM Sach_TacGia
UNION ALL SELECT 'KhachHang',      COUNT(*) FROM KhachHang     -- 15
UNION ALL SELECT 'DonHang',        COUNT(*) FROM DonHang       -- 25
UNION ALL SELECT 'ChiTietDonHang', COUNT(*) FROM ChiTietDonHang
UNION ALL SELECT 'DanhGia',        COUNT(*) FROM DanhGia;      -- 22
```

Nếu số liệu lệch (do buổi trước học viên đã `UPDATE`/`DELETE`), chạy lại
`thuc-hanh/00-schema-bookstore.sql` rồi `thuc-hanh/01-seed-bookstore.sql`.
