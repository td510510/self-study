/* =====================================================================
   BÀI TẬP BUỔI 5 — SQL cơ bản: DDL, DML, SELECT
   CSDL: BookStore
   Cách làm: viết câu lệnh ngay dưới mỗi đề bài, chạy thử, đối chiếu
             kết quả mong đợi ghi trong chú thích.
   ===================================================================== */

USE BookStore;
GO

/* ---------------------------------------------------------------------
   NHÓM A — LÀM CÙNG GIẢNG VIÊN
   --------------------------------------------------------------------- */

-- A1. Xem toàn bộ sách
SELECT * FROM Sach;

-- A2. Chỉ tên và giá, sắp xếp giá giảm dần
SELECT TenSach, GiaBan FROM Sach ORDER BY GiaBan DESC;

-- A3. Ba cuốn đắt nhất
SELECT TOP 3 TenSach, GiaBan FROM Sach ORDER BY GiaBan DESC;

-- A4. Sách đang hết hàng          (kỳ vọng: 1 dòng — Lão Hạc)
SELECT TenSach, SoLuongTon FROM Sach WHERE SoLuongTon = 0;

-- A5. Sách chưa có ISBN           (kỳ vọng: 1 dòng — bản bìa cứng)
SELECT TenSach FROM Sach WHERE ISBN IS NULL;


/* ---------------------------------------------------------------------
   NHÓM B — TỰ LÀM (25 phút)
   --------------------------------------------------------------------- */

-- B1. Tên và giá các sách có giá từ 80.000 đến 200.000, giá tăng dần.
--     Gợi ý: BETWEEN


-- B2. Khách hàng ở Hà Nội hoặc TP.HCM: họ tên, email, thành phố.
--     Gợi ý: IN


-- B3. Sách có tên chứa chữ "sử" (không phân biệt hoa thường).
--     Gợi ý: LIKE N'%sử%'


-- B4. Khách hàng chưa có số điện thoại.
--     Gợi ý: IS NULL — KHÔNG dùng = NULL


-- B5. Tên sách kèm cột GiaTriTonKho = GiaBan * SoLuongTon,
--     chỉ lấy sách có giá trị tồn kho trên 10.000.000.
--     ⚠️ Bẫy: không dùng được bí danh trong WHERE — vì sao?


-- B6. Các đơn hàng đặt trong năm 2025 có trạng thái HoanThanh.
--     Gợi ý: viết 2 cách — YEAR(NgayDat) = 2025 và điều kiện dải.
--     Cách nào dùng được index? (sẽ hiểu rõ ở buổi 8)


-- B7. Tên sách và cột TinhTrangKho:
--     SoLuongTon = 0 -> N'Hết hàng'
--     SoLuongTon < 30 -> N'Sắp hết'
--     ngược lại -> N'Đủ hàng'
--     Gợi ý: CASE WHEN


-- B8. Lấy 5 sách ở TRANG THỨ 2 khi sắp xếp theo tên sách.
--     Gợi ý: ORDER BY ... OFFSET 5 ROWS FETCH NEXT 5 ROWS ONLY


-- B9. Danh sách các nhà xuất bản (không trùng lặp), bỏ qua giá trị NULL.


-- B10. Khách hàng đăng ký trong năm 2025, hiển thị họ tên và ngày đăng ký
--      theo định dạng dd/MM/yyyy.
--      Gợi ý: FORMAT()


/* ---------------------------------------------------------------------
   NHÓM C — DML AN TOÀN (20 phút)
   Nhớ QUY TRÌNH 3 BƯỚC: SELECT xem trước -> thực hiện -> SELECT kiểm tra
   --------------------------------------------------------------------- */

-- C1. Thêm một tác giả mới, in ra mã vừa sinh.
INSERT INTO TacGia (HoTen, QuocTich, NamSinh)
OUTPUT INSERTED.MaTacGia AS MaVuaTao, INSERTED.HoTen
VALUES (N'Haruki Murakami', N'Nhật Bản', 1949);

-- C2. Thêm một cuốn sách mới thuộc danh mục Khoa học (MaDanhMuc = 3).
INSERT INTO Sach (ISBN, TenSach, MaDanhMuc, GiaBan, SoLuongTon, NamXuatBan, NhaXuatBan, SoTrang)
VALUES ('978-604-1-00099-9', N'Vũ trụ trong vỏ hạt dẻ', 3, 175000, 40, 2022, N'NXB Trẻ', 224);

-- C3. Tăng giá 5% cho toàn bộ sách CNTT (MaDanhMuc = 5) — làm đủ 3 bước.
SELECT MaSach, TenSach, GiaBan FROM Sach WHERE MaDanhMuc = 5;    -- bước 1
-- viết UPDATE của bạn ở đây                                       -- bước 2
SELECT MaSach, TenSach, GiaBan FROM Sach WHERE MaDanhMuc = 5;    -- bước 3

-- C4. Nhập thêm 50 cuốn cho những sách đang hết hàng.


-- C5. Cập nhật số điện thoại cho khách hàng chưa có (đặt là '0900000000').


-- C6. Xóa cuốn sách đã thêm ở C2.


/* ---------------------------------------------------------------------
   NHÓM D — THÍ NGHIỆM AN TOÀN (làm chung, có kiểm soát)
   --------------------------------------------------------------------- */

-- D1. Tạo bảng nháp
DROP TABLE IF EXISTS Sach_Nhap;
SELECT * INTO Sach_Nhap FROM Sach;
SELECT COUNT(*) AS SoDong FROM Sach_Nhap;      -- 20

-- D2. Mô phỏng tai nạn: UPDATE quên WHERE
UPDATE Sach_Nhap SET GiaBan = 0;
SELECT TOP 5 TenSach, GiaBan FROM Sach_Nhap;   -- toàn bộ về 0

-- D3. Cách phòng tránh bằng transaction
DROP TABLE Sach_Nhap;
SELECT * INTO Sach_Nhap FROM Sach;

BEGIN TRANSACTION;
    UPDATE Sach_Nhap SET GiaBan = 0;
    SELECT COUNT(*) AS SoDongBiAnhHuong FROM Sach_Nhap WHERE GiaBan = 0;
    -- Nhìn thấy 20 dòng -> không đúng ý định -> hoàn tác
ROLLBACK TRANSACTION;

SELECT TOP 5 TenSach, GiaBan FROM Sach_Nhap;   -- giá vẫn nguyên vẹn
DROP TABLE Sach_Nhap;


/* ---------------------------------------------------------------------
   NHÓM E — DDL (tự làm)
   --------------------------------------------------------------------- */

-- E1. Tạo bảng PhieuNhapKho(MaPhieu, MaSach, SoLuongNhap, GiaNhap,
--     NgayNhap, NhaCungCap) với:
--       - MaPhieu là khóa chính tự tăng
--       - MaSach là khóa ngoại về Sach
--       - SoLuongNhap > 0, GiaNhap >= 0
--       - NgayNhap mặc định là hôm nay
--     Đặt tên đầy đủ cho mọi ràng buộc.


-- E2. Thêm cột GhiChu NVARCHAR(255) cho bảng vừa tạo.


-- E3. Thêm ràng buộc CHECK: NgayNhap không được ở tương lai.


-- E4. Chèn 3 phiếu nhập hợp lệ và 2 phiếu SAI (mỗi phiếu vi phạm một
--     ràng buộc khác nhau). Ghi lại thông báo lỗi.


-- E5. Xóa bảng PhieuNhapKho.
GO
