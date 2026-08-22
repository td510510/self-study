/* =====================================================================
   BÀI TẬP BUỔI 7 — Subquery, CTE, View, Window Function
   CSDL: BookStore
   ===================================================================== */

USE BookStore;
GO

/* ---------------------------------------------------------------------
   NHÓM A — SUBQUERY (làm cùng giảng viên)
   --------------------------------------------------------------------- */

-- A1. Sách có giá cao hơn giá trung bình toàn cửa hàng.
SELECT TenSach, GiaBan
FROM Sach
WHERE GiaBan > (SELECT AVG(GiaBan) FROM Sach)
ORDER BY GiaBan DESC;

-- A2. Sách có giá cao hơn giá trung bình CỦA CHÍNH DANH MỤC NÓ.
--     (subquery tương quan — chú ý s1/s2)
SELECT s1.TenSach, s1.GiaBan, s1.MaDanhMuc
FROM Sach s1
WHERE s1.GiaBan > (
    SELECT AVG(s2.GiaBan) FROM Sach s2 WHERE s2.MaDanhMuc = s1.MaDanhMuc
);

-- A3. Khách hàng đã mua sách của tác giả "Nguyễn Nhật Ánh".
--     Viết bằng IN, rồi viết lại bằng EXISTS. So sánh.


-- A4. Sách chưa từng được đánh giá — viết bằng CẢ 3 CÁCH,
--     so sánh kết quả và giải thích nếu khác nhau.
-- (a) LEFT JOIN + IS NULL

-- (b) NOT EXISTS

-- (c) NOT IN   <-- chú ý bẫy NULL


-- A5. Đơn hàng có tổng giá trị LỚN NHẤT.


-- A6. ⚠️ THÍ NGHIỆM BẪY NOT IN:
--     Chạy 2 câu sau, giải thích vì sao câu (b) trả về 0 dòng.
-- (a)
SELECT COUNT(*) AS Cach_NOT_EXISTS
FROM Sach s
WHERE NOT EXISTS (SELECT 1 FROM ChiTietDonHang ct WHERE ct.MaSach = s.MaSach);

-- (b) — cố tình đưa NULL vào tập con
SELECT COUNT(*) AS Cach_NOT_IN_Bi_Loi
FROM Sach s
WHERE s.MaSach NOT IN (SELECT MaSach FROM ChiTietDonHang
                       UNION ALL SELECT NULL);
-- Giải thích: ............................................................


/* ---------------------------------------------------------------------
   NHÓM B — CTE (tự làm, 25 phút)
   --------------------------------------------------------------------- */

-- B1. Dùng CTE tính doanh thu mỗi danh mục, sau đó chỉ lấy danh mục có
--     doanh thu trên mức trung bình của các danh mục.


-- B2. Dùng CTE ĐỆ QUY in cây danh mục có thụt lề.
--     Kết quả mong đợi dạng:
--       Văn học
--           Tiểu thuyết
--           Truyện ngắn
--       Kinh tế
--           Kỹ năng sống
WITH CayDanhMuc AS (
    SELECT MaDanhMuc, TenDanhMuc, MaDanhMucCha, 0 AS Cap,
           CAST(TenDanhMuc AS NVARCHAR(500)) AS DuongDan
    FROM DanhMuc WHERE MaDanhMucCha IS NULL
    UNION ALL
    SELECT dm.MaDanhMuc, dm.TenDanhMuc, dm.MaDanhMucCha, c.Cap + 1,
           CAST(c.DuongDan + N' > ' + dm.TenDanhMuc AS NVARCHAR(500))
    FROM DanhMuc dm JOIN CayDanhMuc c ON dm.MaDanhMucCha = c.MaDanhMuc
)
SELECT REPLICATE(N'    ', Cap) + TenDanhMuc AS Cay, Cap, DuongDan
FROM CayDanhMuc ORDER BY DuongDan;

-- B3. Dùng NHIỀU CTE nối tiếp: mỗi tháng năm 2025 có bao nhiêu KHÁCH HÀNG MỚI
--     (khách có đơn ĐẦU TIÊN trong tháng đó).
--     Gợi ý: CTE1 = đơn đầu tiên của mỗi khách (MIN(NgayDat))
--            CTE2 = gom theo tháng


-- B4. Dùng CTE tính, với mỗi khách hàng: số đơn, tổng chi, trung bình mỗi đơn,
--     ngày mua gần nhất. Chỉ lấy khách có >= 2 đơn.


/* ---------------------------------------------------------------------
   NHÓM C — WINDOW FUNCTION (tự làm, 25 phút)
   --------------------------------------------------------------------- */

-- C1. So sánh 3 hàm xếp hạng trên giá sách.
SELECT TenSach, GiaBan,
       ROW_NUMBER() OVER (ORDER BY GiaBan DESC) AS RowNum,
       RANK()       OVER (ORDER BY GiaBan DESC) AS Rnk,
       DENSE_RANK() OVER (ORDER BY GiaBan DESC) AS DenseRnk
FROM Sach;
-- Câu hỏi: tìm chỗ 3 cột này khác nhau. Vì sao?

-- C2. 🎯 MẪU QUAN TRỌNG NHẤT: cuốn ĐẮT NHẤT trong MỖI danh mục.
WITH XepHang AS (
    SELECT dm.TenDanhMuc, s.TenSach, s.GiaBan,
           ROW_NUMBER() OVER (PARTITION BY s.MaDanhMuc ORDER BY s.GiaBan DESC) AS Hang
    FROM Sach s JOIN DanhMuc dm ON s.MaDanhMuc = dm.MaDanhMuc
)
SELECT TenDanhMuc, TenSach, GiaBan FROM XepHang WHERE Hang = 1;

-- C3. TOP 2 SÁCH BÁN CHẠY NHẤT TRONG MỖI DANH MỤC.
--     (áp dụng mẫu C2 cho dữ liệu bán hàng)


-- C4. Với mỗi sách: giá của nó, giá trung bình danh mục, chênh lệch,
--     và số sách cùng danh mục — mà VẪN GIỮ đủ 20 dòng.


-- C5. Với mỗi đơn hàng: mã đơn, ngày đặt, tổng tiền, tổng tiền của đơn
--     LIỀN TRƯỚC của cùng khách hàng, và số ngày giữa hai lần mua.
--     Gợi ý: LAG(...) OVER (PARTITION BY MaKH ORDER BY NgayDat)


-- C6. Chia khách hàng thành 4 nhóm theo tổng chi tiêu bằng NTILE(4),
--     đặt tên: 1 -> N'Kim cương', 2 -> N'Vàng', 3 -> N'Bạc', 4 -> N'Đồng'.


-- C7. Với mỗi sách, tính TỈ TRỌNG doanh thu của nó so với tổng doanh thu
--     của danh mục nó thuộc về (dạng phần trăm).
--     Gợi ý: DoanhThu * 100.0 / SUM(DoanhThu) OVER (PARTITION BY MaDanhMuc)


-- C8. Doanh thu từng tháng + lũy kế + % tăng trưởng so với tháng trước.
--     Gợi ý: SUM(...) OVER (ORDER BY ... ROWS BETWEEN UNBOUNDED PRECEDING
--            AND CURRENT ROW), LAG(), NULLIF() để tránh chia 0.


/* ---------------------------------------------------------------------
   NHÓM D — VIEW
   --------------------------------------------------------------------- */

-- D1. Tạo view vw_ChiTietDonHangDayDu gồm: mã đơn, ngày, tên khách,
--     thành phố, tên sách, danh mục, số lượng, đơn giá, thành tiền, trạng thái.
--     ⚠️ CREATE VIEW phải là câu lệnh ĐẦU TIÊN của một batch -> cần GO ở trên.
GO
CREATE OR ALTER VIEW vw_ChiTietDonHangDayDu AS
SELECT
    dh.MaDonHang,
    dh.NgayDat,
    kh.HoTen        AS TenKhachHang,
    kh.ThanhPho,
    s.TenSach,
    dm.TenDanhMuc,
    ct.SoLuong,
    ct.DonGia,
    ct.SoLuong * ct.DonGia * (1 - ct.GiamGia) AS ThanhTien,
    dh.TrangThai
FROM DonHang dh
JOIN KhachHang kh      ON dh.MaKH = kh.MaKH
JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang
JOIN Sach s            ON ct.MaSach = s.MaSach
JOIN DanhMuc dm        ON s.MaDanhMuc = dm.MaDanhMuc;
GO

-- D2. Dùng view vừa tạo trả lời 3 câu hỏi, mỗi câu MỘT dòng SELECT:
--     (a) Doanh thu theo danh mục
SELECT TenDanhMuc, SUM(ThanhTien) AS DoanhThu
FROM vw_ChiTietDonHangDayDu WHERE TrangThai = N'HoanThanh'
GROUP BY TenDanhMuc ORDER BY DoanhThu DESC;

--     (b) Top 5 khách chi nhiều nhất — viết ở đây:

--     (c) Doanh thu theo thành phố — viết ở đây:


-- D3. Tạo view vw_ThongKeKhachHang gồm: mã KH, họ tên, thành phố, số đơn,
--     tổng chi tiêu, ngày mua gần nhất, phân loại (VIP/Thường xuyên/Mới/
--     Chưa kích hoạt). Khách chưa mua vẫn phải xuất hiện.


-- D4. Tạo view vw_KhachHang_CongKhai chỉ gồm MaKH, HoTen, ThanhPho,
--     NgayDangKy (giấu Email, SĐT, Địa chỉ) — minh họa dùng view để bảo mật.


-- D5. Tạo view vw_CanhBaoTonKho: sách cần nhập thêm, gồm tồn kho hiện tại,
--     số bán trung bình mỗi tháng, số tháng còn bán được.
GO
