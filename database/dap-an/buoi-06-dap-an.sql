/* =====================================================================
   ĐÁP ÁN BUỔI 6 — JOIN và Gom nhóm
   ⚠️ Dành cho giảng viên
   ===================================================================== */

USE BookStore;
GO

/* ---------------------- NHÓM B ---------------------- */

-- B1. Số đầu sách mỗi danh mục (danh mục rỗng vẫn hiện với số 0)
--     ⚠️ Phải COUNT(s.MaSach) chứ KHÔNG PHẢI COUNT(*)
SELECT dm.TenDanhMuc, COUNT(s.MaSach) AS SoDauSach
FROM DanhMuc dm
LEFT JOIN Sach s ON dm.MaDanhMuc = s.MaDanhMuc
GROUP BY dm.MaDanhMuc, dm.TenDanhMuc
ORDER BY SoDauSach DESC;

-- B2. Số sách mỗi tác giả
SELECT tg.HoTen AS TacGia, COUNT(stg.MaSach) AS SoDauSach
FROM TacGia tg
LEFT JOIN Sach_TacGia stg ON tg.MaTacGia = stg.MaTacGia
GROUP BY tg.MaTacGia, tg.HoTen
ORDER BY SoDauSach DESC, TacGia;

-- B3. Doanh thu từng tháng 2025
--     COUNT(DISTINCT) vì sau JOIN với chi tiết, mỗi đơn bị nhân lên nhiều dòng
SELECT
    YEAR(dh.NgayDat)  AS Nam,
    MONTH(dh.NgayDat) AS Thang,
    COUNT(DISTINCT dh.MaDonHang) AS SoDon,
    CAST(SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS DECIMAL(14,0)) AS DoanhThu
FROM DonHang dh
JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
WHERE dh.TrangThai = N'HoanThanh'
  AND dh.NgayDat >= '2025-01-01' AND dh.NgayDat < '2026-01-01'
GROUP BY YEAR(dh.NgayDat), MONTH(dh.NgayDat)
ORDER BY Nam, Thang;

-- B4. Top 3 khách chi tiêu nhiều nhất
SELECT TOP 3
    kh.HoTen, kh.ThanhPho,
    COUNT(DISTINCT dh.MaDonHang) AS SoDon,
    CAST(SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS DECIMAL(14,0)) AS TongChiTieu
FROM KhachHang kh
JOIN DonHang dh        ON kh.MaKH = dh.MaKH
JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
WHERE dh.TrangThai = N'HoanThanh'
GROUP BY kh.MaKH, kh.HoTen, kh.ThanhPho
ORDER BY TongChiTieu DESC;

-- B5. Thành phố có >= 2 khách
SELECT ThanhPho, COUNT(*) AS SoKhach
FROM KhachHang
WHERE ThanhPho IS NOT NULL
GROUP BY ThanhPho
HAVING COUNT(*) >= 2
ORDER BY SoKhach DESC;

-- B6. Sách điểm TB >= 4.5 và >= 2 lượt đánh giá
SELECT
    s.TenSach,
    COUNT(*) AS SoLuot,
    CAST(AVG(CAST(dg.SoSao AS DECIMAL(3,2))) AS DECIMAL(3,2)) AS DiemTB
FROM Sach s
JOIN DanhGia dg ON s.MaSach = dg.MaSach
GROUP BY s.MaSach, s.TenSach
HAVING COUNT(*) >= 2 AND AVG(CAST(dg.SoSao AS DECIMAL(3,2))) >= 4.5
ORDER BY DiemTB DESC, SoLuot DESC;

-- B7. Thống kê theo trạng thái đơn hàng
SELECT
    dh.TrangThai,
    COUNT(DISTINCT dh.MaDonHang) AS SoDon,
    CAST(SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS DECIMAL(14,0)) AS TongGiaTri
FROM DonHang dh
LEFT JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
GROUP BY dh.TrangThai
ORDER BY TongGiaTri DESC;

-- B8. NXB có tổng giá trị tồn kho lớn nhất
SELECT TOP 1 WITH TIES
    NhaXuatBan,
    COUNT(*) AS SoDauSach,
    CAST(SUM(GiaBan * SoLuongTon) AS DECIMAL(16,0)) AS GiaTriTon
FROM Sach
WHERE NhaXuatBan IS NOT NULL
GROUP BY NhaXuatBan
ORDER BY GiaTriTon DESC;

-- B9. Mỗi khách mua bao nhiêu ĐẦU SÁCH KHÁC NHAU
SELECT kh.HoTen, COUNT(DISTINCT ct.MaSach) AS SoDauSachKhacNhau
FROM KhachHang kh
JOIN DonHang dh        ON kh.MaKH = dh.MaKH
JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
GROUP BY kh.MaKH, kh.HoTen
ORDER BY SoDauSachKhacNhau DESC;

-- B10. Danh mục có giá trung bình cao nhất
SELECT TOP 1
    dm.TenDanhMuc,
    COUNT(*) AS SoDauSach,
    CAST(AVG(s.GiaBan) AS DECIMAL(12,0)) AS GiaTB
FROM Sach s JOIN DanhMuc dm ON s.MaDanhMuc = dm.MaDanhMuc
GROUP BY dm.MaDanhMuc, dm.TenDanhMuc
ORDER BY GiaTB DESC;

-- B11. Tháng nào 2025 nhiều đơn HỦY nhất
SELECT TOP 1
    YEAR(NgayDat) AS Nam, MONTH(NgayDat) AS Thang, COUNT(*) AS SoDonHuy
FROM DonHang
WHERE TrangThai = N'Huy' AND NgayDat >= '2025-01-01' AND NgayDat < '2026-01-01'
GROUP BY YEAR(NgayDat), MONTH(NgayDat)
ORDER BY SoDonHuy DESC;

-- B12. Mọi sách kèm số lượt và điểm đánh giá (sách chưa ai đánh giá -> 0 / NULL)
SELECT
    s.TenSach,
    COUNT(dg.MaDanhGia) AS SoLuotDanhGia,
    CAST(AVG(CAST(dg.SoSao AS DECIMAL(3,2))) AS DECIMAL(3,2)) AS DiemTB
FROM Sach s
LEFT JOIN DanhGia dg ON s.MaSach = dg.MaSach
GROUP BY s.MaSach, s.TenSach
ORDER BY SoLuotDanhGia DESC, DiemTB DESC;


/* ---------------------- NHÓM C — GIẢI THÍCH BẪY ---------------------- */

/* C1. Vì sao 3 con số khác nhau?
   A = 25  : số đơn hàng thực tế trong bảng DonHang.
   B = 47  : sau JOIN với ChiTietDonHang, MỖI ĐƠN bị NHÂN LÊN thành nhiều dòng
             (1 đơn có 3 sách -> 3 dòng). COUNT(*) đang đếm DÒNG CHI TIẾT,
             không phải đếm ĐƠN.
   C = 25  : COUNT(DISTINCT MaDonHang) khử trùng lặp -> đúng số đơn.
   ➜ Bài học: sau JOIN 1-N, LUÔN kiểm tra xem mình đang đếm cái gì.
*/

/* C2. Vì sao câu 2 mất khách hàng?
   LEFT JOIN giữ mọi khách. Khách chưa mua có dh.TrangThai = NULL.
   Điều kiện WHERE dh.TrangThai = N'HoanThanh' so sánh NULL với chuỗi -> UNKNOWN
   -> dòng bị loại -> LEFT JOIN bị "biến" thành INNER JOIN.
   CÁCH SỬA: đưa điều kiện về bảng phải vào phần ON.
   QUY TẮC: LEFT JOIN -> điều kiện bảng PHẢI đặt ở ON, điều kiện bảng TRÁI đặt ở WHERE.
*/

/* C4. Vì sao doanh thu bị SAI khi JOIN cả ChiTietDonHang lẫn DanhGia?
   Cả hai đều là bảng con của Sach (quan hệ 1-N). JOIN cả hai tạo ra
   TÍCH DESCARTES cục bộ: sách có 3 dòng chi tiết và 2 đánh giá sẽ ra 6 dòng.
   Mỗi dòng chi tiết bị đếm 2 lần -> SUM bị thổi phồng.
   CÁCH SỬA: tổng hợp riêng từng nhánh rồi mới JOIN (dùng subquery/CTE — buổi 7):
*/
WITH BanHang AS (
    SELECT MaSach, SUM(SoLuong * DonGia) AS DoanhThu
    FROM ChiTietDonHang GROUP BY MaSach
),
DanhGiaTB AS (
    SELECT MaSach, AVG(CAST(SoSao AS DECIMAL(3,2))) AS DiemTB
    FROM DanhGia GROUP BY MaSach
)
SELECT s.TenSach, bh.DoanhThu, dgtb.DiemTB
FROM Sach s
LEFT JOIN BanHang   bh   ON s.MaSach = bh.MaSach
LEFT JOIN DanhGiaTB dgtb ON s.MaSach = dgtb.MaSach
ORDER BY bh.DoanhThu DESC;


/* ---------------------- NHÓM D ---------------------- */

-- D1. Báo cáo bán hàng đầy đủ
WITH TacGiaGop AS (
    SELECT stg.MaSach,
           STRING_AGG(tg.HoTen, N', ') WITHIN GROUP (ORDER BY tg.HoTen) AS CacTacGia
    FROM Sach_TacGia stg JOIN TacGia tg ON stg.MaTacGia = tg.MaTacGia
    GROUP BY stg.MaSach
),
BanHang AS (
    SELECT ct.MaSach,
           SUM(ct.SoLuong) AS SoDaBan,
           SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS DoanhThu
    FROM ChiTietDonHang ct
    JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang
    WHERE dh.TrangThai = N'HoanThanh'
    GROUP BY ct.MaSach
)
SELECT
    s.TenSach,
    dm.TenDanhMuc,
    ISNULL(tgg.CacTacGia, N'(chưa có)') AS TacGia,
    ISNULL(bh.SoDaBan, 0)  AS SoDaBan,
    CAST(ISNULL(bh.DoanhThu, 0) AS DECIMAL(14,0)) AS DoanhThu
FROM Sach s
JOIN DanhMuc dm     ON s.MaDanhMuc = dm.MaDanhMuc
LEFT JOIN TacGiaGop tgg ON s.MaSach = tgg.MaSach
LEFT JOIN BanHang   bh  ON s.MaSach = bh.MaSach
ORDER BY DoanhThu DESC;

-- D2. Doanh thu theo thành phố + dòng tổng cộng
SELECT
    ISNULL(kh.ThanhPho, N'▶ TỔNG CỘNG') AS ThanhPho,
    COUNT(DISTINCT dh.MaDonHang) AS SoDon,
    CAST(SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)) AS DECIMAL(14,0)) AS DoanhThu
FROM KhachHang kh
JOIN DonHang dh        ON kh.MaKH = dh.MaKH
JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
WHERE dh.TrangThai = N'HoanThanh'
GROUP BY ROLLUP (kh.ThanhPho)
ORDER BY GROUPING(kh.ThanhPho), DoanhThu DESC;

-- D3. Cặp sách thường mua cùng nhau
SELECT
    s1.TenSach AS SachA,
    s2.TenSach AS SachB,
    COUNT(*)   AS SoLanMuaCung
FROM ChiTietDonHang ct1
JOIN ChiTietDonHang ct2
     ON ct1.MaDonHang = ct2.MaDonHang
    AND ct1.MaSach < ct2.MaSach      -- ← tránh ghép sách với chính nó và trùng cặp (A,B)/(B,A)
JOIN Sach s1 ON ct1.MaSach = s1.MaSach
JOIN Sach s2 ON ct2.MaSach = s2.MaSach
GROUP BY s1.TenSach, s2.TenSach
HAVING COUNT(*) >= 1
ORDER BY SoLanMuaCung DESC, SachA;


/* ---------------------- BÀI TẬP VỀ NHÀ ---------------------- */

-- Bài 2. Báo cáo "sức khỏe khách hàng"
WITH ThongKe AS (
    SELECT
        kh.MaKH,
        COUNT(DISTINCT dh.MaDonHang) AS SoDon,
        ISNULL(SUM(ct.SoLuong * ct.DonGia * (1 - ct.GiamGia)), 0) AS TongChi,
        MAX(dh.NgayDat) AS MuaGanNhat
    FROM KhachHang kh
    LEFT JOIN DonHang dh ON kh.MaKH = dh.MaKH AND dh.TrangThai = N'HoanThanh'
    LEFT JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
    GROUP BY kh.MaKH
)
SELECT
    kh.HoTen, kh.ThanhPho,
    FORMAT(kh.NgayDangKy, 'dd/MM/yyyy') AS NgayDangKy,
    t.SoDon,
    CAST(t.TongChi AS DECIMAL(14,0)) AS TongChiTieu,
    FORMAT(t.MuaGanNhat, 'dd/MM/yyyy') AS MuaGanNhat,
    CASE WHEN t.TongChi > 1000000 THEN N'VIP'
         WHEN t.TongChi >  300000 THEN N'Thường xuyên'
         WHEN t.TongChi >       0 THEN N'Mới'
         ELSE N'Chưa kích hoạt' END AS PhanLoai
FROM KhachHang kh
JOIN ThongKe t ON kh.MaKH = t.MaKH
ORDER BY t.TongChi DESC;

-- Bài 4. Cảnh báo tồn kho
WITH BanGanDay AS (
    SELECT ct.MaSach, SUM(ct.SoLuong) AS DaBan6Thang
    FROM ChiTietDonHang ct
    JOIN DonHang dh ON ct.MaDonHang = dh.MaDonHang
    WHERE dh.TrangThai = N'HoanThanh'
      AND dh.NgayDat >= DATEADD(MONTH, -6, '2026-04-01')   -- mốc cố định cho dữ liệu mẫu
    GROUP BY ct.MaSach
)
SELECT s.TenSach, s.SoLuongTon, ISNULL(b.DaBan6Thang, 0) AS DaBan6Thang
FROM Sach s
LEFT JOIN BanGanDay b ON s.MaSach = b.MaSach
WHERE s.SoLuongTon < ISNULL(b.DaBan6Thang, 0)
ORDER BY (ISNULL(b.DaBan6Thang, 0) - s.SoLuongTon) DESC;


/* Bài 5. Vì sao (a) và (b) khác nhau?
   (a) COUNT(s.MaSach): hàm tổng hợp BỎ QUA NULL. Danh mục không có sách nào ->
       s.MaSach là NULL -> đếm ra 0. ✅ ĐÚNG.
   (b) COUNT(*): đếm mọi DÒNG kết quả. Danh mục không có sách vẫn sinh ra
       MỘT dòng (do LEFT JOIN) -> đếm ra 1. ❌ SAI.
   ➜ Quy tắc: với LEFT JOIN, LUÔN dùng COUNT(<cột của bảng bên phải>),
     không bao giờ dùng COUNT(*).
*/
GO
