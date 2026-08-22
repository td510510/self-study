/* =====================================================================
   ĐÁP ÁN BUỔI 7 — Subquery, CTE, View, Window Function
   ⚠️ Dành cho giảng viên
   ===================================================================== */

USE BookStore;
GO

/* ---------------------- NHÓM A — SUBQUERY ---------------------- */

-- A3. Khách hàng đã mua sách của "Nguyễn Nhật Ánh"
-- Cách 1: IN
SELECT kh.HoTen, kh.Email
FROM KhachHang kh
WHERE kh.MaKH IN (
    SELECT dh.MaKH
    FROM DonHang dh
    JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
    JOIN Sach_TacGia stg   ON ct.MaSach = stg.MaSach
    JOIN TacGia tg         ON stg.MaTacGia = tg.MaTacGia
    WHERE tg.HoTen = N'Nguyễn Nhật Ánh'
);

-- Cách 2: EXISTS (thường nhanh hơn — dừng ngay khi tìm thấy dòng đầu tiên)
SELECT kh.HoTen, kh.Email
FROM KhachHang kh
WHERE EXISTS (
    SELECT 1
    FROM DonHang dh
    JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
    JOIN Sach_TacGia stg   ON ct.MaSach = stg.MaSach
    JOIN TacGia tg         ON stg.MaTacGia = tg.MaTacGia
    WHERE dh.MaKH = kh.MaKH AND tg.HoTen = N'Nguyễn Nhật Ánh'
);

-- A4. Sách chưa từng được đánh giá — 3 cách
-- (a) LEFT JOIN + IS NULL
SELECT s.TenSach FROM Sach s
LEFT JOIN DanhGia dg ON s.MaSach = dg.MaSach
WHERE dg.MaDanhGia IS NULL;

-- (b) NOT EXISTS  ✅ khuyến nghị — an toàn với NULL
SELECT s.TenSach FROM Sach s
WHERE NOT EXISTS (SELECT 1 FROM DanhGia dg WHERE dg.MaSach = s.MaSach);

-- (c) NOT IN — chạy đúng ở đây vì DanhGia.MaSach là NOT NULL,
--     nhưng SẼ SAI nếu cột đó cho phép NULL
SELECT s.TenSach FROM Sach s
WHERE s.MaSach NOT IN (SELECT dg.MaSach FROM DanhGia dg);

-- A5. Đơn hàng có tổng giá trị lớn nhất
WITH TongDon AS (
    SELECT MaDonHang, SUM(SoLuong * DonGia * (1 - GiamGia)) AS TongTien
    FROM ChiTietDonHang GROUP BY MaDonHang
)
SELECT td.MaDonHang, kh.HoTen, CAST(td.TongTien AS DECIMAL(14,0)) AS TongTien
FROM TongDon td
JOIN DonHang dh ON td.MaDonHang = dh.MaDonHang
JOIN KhachHang kh ON dh.MaKH = kh.MaKH
WHERE td.TongTien = (SELECT MAX(TongTien) FROM TongDon);

/* A6. Vì sao NOT IN với NULL trả về 0 dòng?
   MaSach NOT IN (1, 2, NULL)  tương đương
   MaSach <> 1 AND MaSach <> 2 AND MaSach <> NULL
   Vế cuối luôn là UNKNOWN. Mà TRUE AND UNKNOWN = UNKNOWN, không phải TRUE.
   -> KHÔNG dòng nào thỏa mãn.
   ➜ LUÔN dùng NOT EXISTS thay cho NOT IN khi tập con có thể chứa NULL.
*/


/* ---------------------- NHÓM B — CTE ---------------------- */

-- B1. Danh mục có doanh thu trên trung bình
WITH DoanhThuDanhMuc AS (
    SELECT dm.MaDanhMuc, dm.TenDanhMuc,
           SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS DoanhThu
    FROM DanhMuc dm
    JOIN Sach s            ON dm.MaDanhMuc = s.MaDanhMuc
    JOIN ChiTietDonHang ct ON s.MaSach = ct.MaSach
    JOIN DonHang dh        ON ct.MaDonHang = dh.MaDonHang
    WHERE dh.TrangThai = N'HoanThanh'
    GROUP BY dm.MaDanhMuc, dm.TenDanhMuc
)
SELECT TenDanhMuc, CAST(DoanhThu AS DECIMAL(14,0)) AS DoanhThu
FROM DoanhThuDanhMuc
WHERE DoanhThu > (SELECT AVG(DoanhThu) FROM DoanhThuDanhMuc)
ORDER BY DoanhThu DESC;

-- B3. Khách hàng MỚI theo tháng năm 2025
WITH DonDauTien AS (
    SELECT MaKH, MIN(NgayDat) AS NgayMuaDau
    FROM DonHang
    WHERE TrangThai = N'HoanThanh'
    GROUP BY MaKH
),
TheoThang AS (
    SELECT YEAR(NgayMuaDau) AS Nam, MONTH(NgayMuaDau) AS Thang, COUNT(*) AS KhachMoi
    FROM DonDauTien
    WHERE NgayMuaDau >= '2025-01-01' AND NgayMuaDau < '2026-01-01'
    GROUP BY YEAR(NgayMuaDau), MONTH(NgayMuaDau)
)
SELECT Nam, Thang, KhachMoi,
       SUM(KhachMoi) OVER (ORDER BY Nam, Thang) AS LuyKe
FROM TheoThang
ORDER BY Nam, Thang;

-- B4. Khách có >= 2 đơn
WITH DoanhThuDon AS (
    SELECT dh.MaDonHang, dh.MaKH, dh.NgayDat,
           SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS TienDon
    FROM DonHang dh
    JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
    WHERE dh.TrangThai = N'HoanThanh'
    GROUP BY dh.MaDonHang, dh.MaKH, dh.NgayDat
)
SELECT kh.HoTen,
       COUNT(*) AS SoDon,
       CAST(SUM(d.TienDon) AS DECIMAL(14,0)) AS TongChi,
       CAST(AVG(d.TienDon) AS DECIMAL(14,0)) AS TBMoiDon,
       FORMAT(MAX(d.NgayDat), 'dd/MM/yyyy')  AS MuaGanNhat
FROM DoanhThuDon d
JOIN KhachHang kh ON d.MaKH = kh.MaKH
GROUP BY kh.MaKH, kh.HoTen
HAVING COUNT(*) >= 2
ORDER BY TongChi DESC;


/* ---------------------- NHÓM C — WINDOW FUNCTION ---------------------- */

-- C3. TOP 2 SÁCH BÁN CHẠY MỖI DANH MỤC  🎯 mẫu quan trọng nhất
WITH BanHang AS (
    SELECT s.MaSach, s.TenSach, s.MaDanhMuc, SUM(ct.SoLuong) AS SoBan
    FROM Sach s
    JOIN ChiTietDonHang ct ON s.MaSach = ct.MaSach
    JOIN DonHang dh        ON ct.MaDonHang = dh.MaDonHang
    WHERE dh.TrangThai = N'HoanThanh'
    GROUP BY s.MaSach, s.TenSach, s.MaDanhMuc
),
XepHang AS (
    SELECT b.*, dm.TenDanhMuc,
           ROW_NUMBER() OVER (PARTITION BY b.MaDanhMuc ORDER BY b.SoBan DESC) AS Hang
    FROM BanHang b JOIN DanhMuc dm ON b.MaDanhMuc = dm.MaDanhMuc
)
SELECT TenDanhMuc, TenSach, SoBan, Hang
FROM XepHang WHERE Hang <= 2
ORDER BY TenDanhMuc, Hang;

-- C4. Giữ đủ 20 dòng nhưng có thống kê nhóm
SELECT
    dm.TenDanhMuc, s.TenSach, s.GiaBan,
    CAST(AVG(s.GiaBan) OVER (PARTITION BY s.MaDanhMuc) AS DECIMAL(12,0)) AS GiaTB_DM,
    CAST(s.GiaBan - AVG(s.GiaBan) OVER (PARTITION BY s.MaDanhMuc) AS DECIMAL(12,0)) AS ChenhLech,
    COUNT(*)      OVER (PARTITION BY s.MaDanhMuc) AS SoSachCungDM,
    MAX(s.GiaBan) OVER (PARTITION BY s.MaDanhMuc) AS GiaCaoNhat_DM
FROM Sach s JOIN DanhMuc dm ON s.MaDanhMuc = dm.MaDanhMuc
ORDER BY dm.TenDanhMuc, s.GiaBan DESC;

-- C5. Đơn liền trước của cùng khách + khoảng cách ngày
WITH DoanhThuDon AS (
    SELECT dh.MaDonHang, dh.MaKH, dh.NgayDat,
           SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS TienDon
    FROM DonHang dh JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
    WHERE dh.TrangThai = N'HoanThanh'
    GROUP BY dh.MaDonHang, dh.MaKH, dh.NgayDat
)
SELECT
    kh.HoTen, d.MaDonHang,
    FORMAT(d.NgayDat, 'dd/MM/yyyy') AS NgayDat,
    CAST(d.TienDon AS DECIMAL(14,0)) AS TienDon,
    CAST(LAG(d.TienDon) OVER (PARTITION BY d.MaKH ORDER BY d.NgayDat) AS DECIMAL(14,0)) AS DonTruoc,
    DATEDIFF(DAY, LAG(d.NgayDat) OVER (PARTITION BY d.MaKH ORDER BY d.NgayDat), d.NgayDat) AS SoNgayCach
FROM DoanhThuDon d
JOIN KhachHang kh ON d.MaKH = kh.MaKH
ORDER BY kh.HoTen, d.NgayDat;

-- C6. Chia khách hàng thành 4 nhóm
WITH ChiTieu AS (
    SELECT kh.MaKH, kh.HoTen,
           SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS TongChi
    FROM KhachHang kh
    JOIN DonHang dh        ON kh.MaKH = dh.MaKH
    JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
    WHERE dh.TrangThai = N'HoanThanh'
    GROUP BY kh.MaKH, kh.HoTen
),
PhanNhom AS (
    SELECT *, NTILE(4) OVER (ORDER BY TongChi DESC) AS Nhom FROM ChiTieu
)
SELECT HoTen, CAST(TongChi AS DECIMAL(14,0)) AS TongChi,
       CASE Nhom WHEN 1 THEN N'Kim cương' WHEN 2 THEN N'Vàng'
                 WHEN 3 THEN N'Bạc'       ELSE N'Đồng' END AS HangThanhVien
FROM PhanNhom ORDER BY TongChi DESC;

-- C7. Tỉ trọng doanh thu trong danh mục
WITH DoanhThuSach AS (
    SELECT s.MaSach, s.TenSach, s.MaDanhMuc,
           SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS DoanhThu
    FROM Sach s
    JOIN ChiTietDonHang ct ON s.MaSach = ct.MaSach
    JOIN DonHang dh        ON ct.MaDonHang = dh.MaDonHang
    WHERE dh.TrangThai = N'HoanThanh'
    GROUP BY s.MaSach, s.TenSach, s.MaDanhMuc
)
SELECT
    dm.TenDanhMuc, d.TenSach,
    CAST(d.DoanhThu AS DECIMAL(14,0)) AS DoanhThu,
    CAST(100.0 * d.DoanhThu / SUM(d.DoanhThu) OVER (PARTITION BY d.MaDanhMuc)
         AS DECIMAL(5,1)) AS TiTrongPhanTram
FROM DoanhThuSach d JOIN DanhMuc dm ON d.MaDanhMuc = dm.MaDanhMuc
ORDER BY dm.TenDanhMuc, TiTrongPhanTram DESC;

-- C8. Doanh thu tháng + lũy kế + tăng trưởng
WITH DoanhThuThang AS (
    SELECT YEAR(dh.NgayDat) AS Nam, MONTH(dh.NgayDat) AS Thang,
           SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS DoanhThu
    FROM DonHang dh JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
    WHERE dh.TrangThai = N'HoanThanh'
    GROUP BY YEAR(dh.NgayDat), MONTH(dh.NgayDat)
)
SELECT Nam, Thang,
    CAST(DoanhThu AS DECIMAL(14,0)) AS DoanhThu,
    CAST(SUM(DoanhThu) OVER (ORDER BY Nam, Thang
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS DECIMAL(16,0)) AS LuyKe,
    CAST(LAG(DoanhThu) OVER (ORDER BY Nam, Thang) AS DECIMAL(14,0)) AS ThangTruoc,
    CAST(100.0 * (DoanhThu - LAG(DoanhThu) OVER (ORDER BY Nam, Thang))
         / NULLIF(LAG(DoanhThu) OVER (ORDER BY Nam, Thang), 0) AS DECIMAL(7,1)) AS TangTruongPhanTram
FROM DoanhThuThang
ORDER BY Nam, Thang;


/* ---------------------- NHÓM D — VIEW ---------------------- */

-- D2b. Top 5 khách chi nhiều nhất (dùng view)
SELECT TOP 5 TenKhachHang, SUM(ThanhTien) AS TongChi
FROM vw_ChiTietDonHangDayDu WHERE TrangThai = N'HoanThanh'
GROUP BY TenKhachHang ORDER BY TongChi DESC;

-- D2c. Doanh thu theo thành phố
SELECT ThanhPho, SUM(ThanhTien) AS DoanhThu
FROM vw_ChiTietDonHangDayDu WHERE TrangThai = N'HoanThanh'
GROUP BY ThanhPho ORDER BY DoanhThu DESC;

-- D3. vw_ThongKeKhachHang   (CREATE VIEW phải mở đầu batch -> cần GO)
GO
CREATE OR ALTER VIEW vw_ThongKeKhachHang AS
SELECT
    kh.MaKH, kh.HoTen, kh.ThanhPho, kh.NgayDangKy,
    COUNT(DISTINCT dh.MaDonHang) AS SoDon,
    ISNULL(SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)), 0) AS TongChiTieu,
    MAX(dh.NgayDat) AS MuaGanNhat,
    CASE WHEN ISNULL(SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)), 0) > 1000000 THEN N'VIP'
         WHEN ISNULL(SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)), 0) >  300000 THEN N'Thường xuyên'
         WHEN ISNULL(SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)), 0) >       0 THEN N'Mới'
         ELSE N'Chưa kích hoạt' END AS PhanLoai
FROM KhachHang kh
LEFT JOIN DonHang dh        ON kh.MaKH = dh.MaKH AND dh.TrangThai = N'HoanThanh'
LEFT JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
GROUP BY kh.MaKH, kh.HoTen, kh.ThanhPho, kh.NgayDangKy;
GO

SELECT * FROM vw_ThongKeKhachHang ORDER BY TongChiTieu DESC;
GO

-- D4. View bảo mật — giấu thông tin nhạy cảm
CREATE OR ALTER VIEW vw_KhachHang_CongKhai AS
SELECT MaKH, HoTen, ThanhPho, NgayDangKy
FROM KhachHang;
GO

-- D5. View cảnh báo tồn kho
CREATE OR ALTER VIEW vw_CanhBaoTonKho AS
WITH BanHang AS (
    SELECT ct.MaSach,
           SUM(ct.SoLuong) AS TongBan,
           COUNT(DISTINCT FORMAT(dh.NgayDat, 'yyyy-MM')) AS SoThangCoBan
    FROM ChiTietDonHang ct
    JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang
    WHERE dh.TrangThai = N'HoanThanh'
    GROUP BY ct.MaSach
)
SELECT
    s.MaSach, s.TenSach, s.SoLuongTon,
    ISNULL(b.TongBan, 0) AS TongDaBan,
    CAST(ISNULL(b.TongBan, 0) * 1.0 / NULLIF(b.SoThangCoBan, 0) AS DECIMAL(8,2)) AS BanTBMoiThang,
    CAST(s.SoLuongTon / NULLIF(ISNULL(b.TongBan, 0) * 1.0 / NULLIF(b.SoThangCoBan, 0), 0)
         AS DECIMAL(8,1)) AS SoThangConBanDuoc
FROM Sach s
LEFT JOIN BanHang b ON s.MaSach = b.MaSach;
GO

SELECT * FROM vw_CanhBaoTonKho
WHERE SoThangConBanDuoc IS NOT NULL
ORDER BY SoThangConBanDuoc ASC;
GO


/* ---------------------- BÀI TẬP VỀ NHÀ ---------------------- */

-- Bài 1. Khách chi nhiều nhất MỖI THÀNH PHỐ
WITH ChiTieu AS (
    SELECT kh.MaKH, kh.HoTen, kh.ThanhPho,
           SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS TongChi
    FROM KhachHang kh
    JOIN DonHang dh        ON kh.MaKH = dh.MaKH
    JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
    WHERE dh.TrangThai = N'HoanThanh'
    GROUP BY kh.MaKH, kh.HoTen, kh.ThanhPho
),
XepHang AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY ThanhPho ORDER BY TongChi DESC) AS Hang
    FROM ChiTieu
)
SELECT ThanhPho, HoTen, CAST(TongChi AS DECIMAL(14,0)) AS TongChi
FROM XepHang WHERE Hang = 1 ORDER BY TongChi DESC;

-- Bài 2. Pareto doanh thu theo danh mục
WITH DoanhThuDM AS (
    SELECT dm.TenDanhMuc, SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS DoanhThu
    FROM DanhMuc dm
    JOIN Sach s            ON dm.MaDanhMuc = s.MaDanhMuc
    JOIN ChiTietDonHang ct ON s.MaSach = ct.MaSach
    JOIN DonHang dh        ON ct.MaDonHang = dh.MaDonHang
    WHERE dh.TrangThai = N'HoanThanh'
    GROUP BY dm.TenDanhMuc
)
SELECT
    TenDanhMuc,
    CAST(DoanhThu AS DECIMAL(14,0)) AS DoanhThu,
    CAST(100.0 * DoanhThu / SUM(DoanhThu) OVER () AS DECIMAL(5,1)) AS PhanTram,
    CAST(100.0 * SUM(DoanhThu) OVER (ORDER BY DoanhThu DESC
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
         / SUM(DoanhThu) OVER () AS DECIMAL(5,1)) AS LuyKePhanTram
FROM DoanhThuDM
ORDER BY DoanhThu DESC;

-- Bài 3. Khách có 2 đơn liên tiếp cách nhau < 30 ngày
WITH KhoangCach AS (
    SELECT dh.MaKH, dh.MaDonHang, dh.NgayDat,
           LAG(dh.NgayDat) OVER (PARTITION BY dh.MaKH ORDER BY dh.NgayDat) AS DonTruoc
    FROM DonHang dh WHERE dh.TrangThai = N'HoanThanh'
)
SELECT kh.HoTen, k.MaDonHang,
       FORMAT(k.DonTruoc, 'dd/MM/yyyy') AS NgayDonTruoc,
       FORMAT(k.NgayDat,  'dd/MM/yyyy') AS NgayDonNay,
       DATEDIFF(DAY, k.DonTruoc, k.NgayDat) AS SoNgayCach
FROM KhoangCach k
JOIN KhachHang kh ON k.MaKH = kh.MaKH
WHERE k.DonTruoc IS NOT NULL AND DATEDIFF(DAY, k.DonTruoc, k.NgayDat) < 30
ORDER BY SoNgayCach;

-- Bài 5. Tỉ lệ giữ chân khách hàng (quay lại trong 90 ngày)
WITH DonSapXep AS (
    SELECT MaKH, NgayDat,
           ROW_NUMBER() OVER (PARTITION BY MaKH ORDER BY NgayDat) AS LanMua
    FROM DonHang WHERE TrangThai = N'HoanThanh'
),
Lan1Va2 AS (
    SELECT
        d1.MaKH,
        d1.NgayDat AS Lan1,
        d2.NgayDat AS Lan2
    FROM DonSapXep d1
    LEFT JOIN DonSapXep d2 ON d1.MaKH = d2.MaKH AND d2.LanMua = 2
    WHERE d1.LanMua = 1
)
SELECT
    FORMAT(Lan1, 'yyyy-MM') AS ThangMuaDau,
    COUNT(*) AS SoKhachMoi,
    SUM(CASE WHEN Lan2 IS NOT NULL AND DATEDIFF(DAY, Lan1, Lan2) <= 90
             THEN 1 ELSE 0 END) AS QuayLaiTrong90Ngay,
    CAST(100.0 * SUM(CASE WHEN Lan2 IS NOT NULL AND DATEDIFF(DAY, Lan1, Lan2) <= 90
                          THEN 1 ELSE 0 END) / COUNT(*) AS DECIMAL(5,1)) AS TiLeGiuChan
FROM Lan1Va2
GROUP BY FORMAT(Lan1, 'yyyy-MM')
ORDER BY ThangMuaDau;
GO
