/* =====================================================================
   ĐÁP ÁN BUỔI 5 — SQL cơ bản
   ⚠️ Dành cho giảng viên
   ===================================================================== */

USE BookStore;
GO

/* ---------------------- NHÓM B ---------------------- */

-- B1. Sách giá 80.000–200.000, giá tăng dần
SELECT TenSach, GiaBan
FROM Sach
WHERE GiaBan BETWEEN 80000 AND 200000
ORDER BY GiaBan ASC;

-- B2. Khách hàng ở Hà Nội hoặc TP.HCM
SELECT HoTen, Email, ThanhPho
FROM KhachHang
WHERE ThanhPho IN (N'Hà Nội', N'TP.HCM')
ORDER BY ThanhPho, HoTen;

-- B3. Sách có tên chứa "sử"
-- (Collation mặc định của SQL Server không phân biệt hoa/thường -> không cần LOWER)
SELECT TenSach FROM Sach WHERE TenSach LIKE N'%sử%';

-- B4. Khách hàng chưa có số điện thoại
SELECT HoTen, Email FROM KhachHang WHERE SoDienThoai IS NULL;

-- B5. Giá trị tồn kho > 10 triệu
--     ⚠️ Không dùng được bí danh trong WHERE vì SELECT chạy SAU WHERE
SELECT TenSach, GiaBan, SoLuongTon, GiaBan * SoLuongTon AS GiaTriTonKho
FROM Sach
WHERE GiaBan * SoLuongTon > 10000000
ORDER BY GiaTriTonKho DESC;     -- ORDER BY thì DÙNG ĐƯỢC bí danh

-- B6. Đơn hàng năm 2025, trạng thái HoanThanh — hai cách viết
-- Cách 1: dễ đọc nhưng KHÔNG dùng được index (bọc hàm quanh cột)
SELECT MaDonHang, NgayDat, TrangThai
FROM DonHang
WHERE YEAR(NgayDat) = 2025 AND TrangThai = N'HoanThanh';

-- Cách 2: điều kiện dải — DÙNG ĐƯỢC index ✅ (xem lại buổi 8)
SELECT MaDonHang, NgayDat, TrangThai
FROM DonHang
WHERE NgayDat >= '2025-01-01' AND NgayDat < '2026-01-01'
  AND TrangThai = N'HoanThanh';

-- B7. Phân loại tình trạng kho
SELECT TenSach, SoLuongTon,
       CASE WHEN SoLuongTon = 0  THEN N'Hết hàng'
            WHEN SoLuongTon < 30 THEN N'Sắp hết'
            ELSE N'Đủ hàng' END AS TinhTrangKho
FROM Sach
ORDER BY SoLuongTon;

-- B8. Trang 2, mỗi trang 5 sách, sắp xếp theo tên
SELECT TenSach, GiaBan
FROM Sach
ORDER BY TenSach
OFFSET 5 ROWS FETCH NEXT 5 ROWS ONLY;

-- B9. Danh sách nhà xuất bản không trùng
SELECT DISTINCT NhaXuatBan FROM Sach WHERE NhaXuatBan IS NOT NULL ORDER BY NhaXuatBan;

-- B10. Khách đăng ký năm 2025
SELECT HoTen, FORMAT(NgayDangKy, 'dd/MM/yyyy') AS NgayDangKy
FROM KhachHang
WHERE NgayDangKy >= '2025-01-01' AND NgayDangKy < '2026-01-01'
ORDER BY NgayDangKy;


/* ---------------------- NHÓM C ---------------------- */

-- C3. UPDATE tăng giá 5% sách CNTT (bước 2)
UPDATE Sach SET GiaBan = ROUND(GiaBan * 1.05, 0) WHERE MaDanhMuc = 5;

-- C4. Nhập thêm 50 cuốn cho sách hết hàng
SELECT MaSach, TenSach, SoLuongTon FROM Sach WHERE SoLuongTon = 0;   -- xem trước
UPDATE Sach SET SoLuongTon = SoLuongTon + 50 WHERE SoLuongTon = 0;
SELECT MaSach, TenSach, SoLuongTon FROM Sach WHERE MaSach IN (8);    -- kiểm tra

-- C5. Điền số điện thoại mặc định
UPDATE KhachHang SET SoDienThoai = '0900000000' WHERE SoDienThoai IS NULL;

-- C6. Xóa sách đã thêm
DELETE FROM Sach WHERE ISBN = '978-604-1-00099-9';
SELECT @@ROWCOUNT AS SoDongDaXoa;


/* ---------------------- NHÓM E — DDL ---------------------- */

-- E1
DROP TABLE IF EXISTS PhieuNhapKho;
CREATE TABLE PhieuNhapKho (
    MaPhieu     INT IDENTITY(1,1) NOT NULL,
    MaSach      INT           NOT NULL,
    SoLuongNhap INT           NOT NULL,
    GiaNhap     DECIMAL(12,2) NOT NULL,
    NgayNhap    DATE          NOT NULL CONSTRAINT DF_PNK_Ngay
                DEFAULT CAST(SYSDATETIME() AS DATE),
    NhaCungCap  NVARCHAR(150) NULL,
    CONSTRAINT PK_PhieuNhapKho   PRIMARY KEY (MaPhieu),
    CONSTRAINT FK_PNK_Sach       FOREIGN KEY (MaSach) REFERENCES Sach(MaSach),
    CONSTRAINT CK_PNK_SoLuong    CHECK (SoLuongNhap > 0),
    CONSTRAINT CK_PNK_GiaNhap    CHECK (GiaNhap >= 0)
);
GO

-- E2
ALTER TABLE PhieuNhapKho ADD GhiChu NVARCHAR(255) NULL;
GO

-- E3
ALTER TABLE PhieuNhapKho
ADD CONSTRAINT CK_PNK_NgayNhap CHECK (NgayNhap <= CAST(GETDATE() AS DATE));
GO

-- E4a. Ba phiếu hợp lệ
INSERT INTO PhieuNhapKho (MaSach, SoLuongNhap, GiaNhap, NhaCungCap) VALUES
    (1, 100, 55000, N'Công ty Phát hành sách A'),
    (2,  50, 60000, N'Công ty Phát hành sách A'),
    (3,  30, 130000, N'NXB Thế Giới');

-- E4b. Hai phiếu SAI — chạy từng câu, đọc thông báo lỗi
INSERT INTO PhieuNhapKho (MaSach, SoLuongNhap, GiaNhap) VALUES (9999, 10, 50000);
-- ❌ Msg 547: FOREIGN KEY constraint "FK_PNK_Sach" — sách 9999 không tồn tại

INSERT INTO PhieuNhapKho (MaSach, SoLuongNhap, GiaNhap) VALUES (1, -5, 50000);
-- ❌ Msg 547: CHECK constraint "CK_PNK_SoLuong" — số lượng phải > 0

INSERT INTO PhieuNhapKho (MaSach, SoLuongNhap, GiaNhap, NgayNhap)
VALUES (1, 10, 50000, '2099-01-01');
-- ❌ Msg 547: CHECK constraint "CK_PNK_NgayNhap" — ngày ở tương lai

-- E5
DROP TABLE PhieuNhapKho;
GO


/* ---------------------- BÀI TẬP VỀ NHÀ ---------------------- */

-- Bài 4. Giải thích lỗi và sửa
/*  SAI:
    SELECT TenSach, GiaBan * SoLuongTon AS TongGiaTri
    FROM Sach WHERE TongGiaTri > 5000000 ORDER BY TongGiaTri DESC;

    NGUYÊN NHÂN: thứ tự thực thi là FROM -> WHERE -> SELECT -> ORDER BY.
    Khi WHERE chạy, bí danh TongGiaTri (do SELECT tạo ra) CHƯA TỒN TẠI.
    ORDER BY chạy SAU SELECT nên dùng được bí danh.
*/
-- SỬA cách 1: lặp lại biểu thức
SELECT TenSach, GiaBan * SoLuongTon AS TongGiaTri
FROM Sach
WHERE GiaBan * SoLuongTon > 5000000
ORDER BY TongGiaTri DESC;

-- SỬA cách 2: dùng bảng dẫn xuất (đẹp hơn khi biểu thức phức tạp)
SELECT TenSach, TongGiaTri
FROM (SELECT TenSach, GiaBan * SoLuongTon AS TongGiaTri FROM Sach) AS t
WHERE TongGiaTri > 5000000
ORDER BY TongGiaTri DESC;

-- SỬA cách 3: CROSS APPLY (kỹ thuật hay, giới thiệu trước cho buổi 7)
SELECT s.TenSach, v.TongGiaTri
FROM Sach s
CROSS APPLY (SELECT s.GiaBan * s.SoLuongTon AS TongGiaTri) AS v
WHERE v.TongGiaTri > 5000000
ORDER BY v.TongGiaTri DESC;


-- Bài 5. Email không hợp lệ
SELECT MaKH, HoTen, Email
FROM KhachHang
WHERE
    -- không có @ nào, hoặc có nhiều hơn 1 dấu @
    LEN(Email) - LEN(REPLACE(Email, '@', '')) <> 1
    -- hoặc không có dấu . nào sau dấu @
 OR CHARINDEX('.', Email, CHARINDEX('@', Email)) = 0
    -- hoặc @ đứng đầu / cuối
 OR Email LIKE '@%' OR Email LIKE '%@';
-- Với dữ liệu mẫu: 0 dòng (mọi email đều hợp lệ).
-- Để kiểm chứng, chèn thử email sai — nhưng ràng buộc CK_KH_Email sẽ chặn trước:
-- INSERT INTO KhachHang (HoTen, Email) VALUES (N'Test', 'khong-hop-le');
GO
