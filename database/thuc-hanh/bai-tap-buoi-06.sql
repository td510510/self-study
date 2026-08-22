/* =====================================================================
   BÀI TẬP BUỔI 6 — JOIN và Gom nhóm dữ liệu
   CSDL: BookStore
   ===================================================================== */

USE BookStore;
GO

/* ---------------------------------------------------------------------
   NHÓM A — JOIN CƠ BẢN (làm cùng giảng viên)
   --------------------------------------------------------------------- */

-- A1. Mọi cuốn sách kèm TÊN DANH MỤC.
SELECT s.TenSach, dm.TenDanhMuc, s.GiaBan
FROM Sach s
JOIN DanhMuc dm ON s.MaDanhMuc = dm.MaDanhMuc
ORDER BY dm.TenDanhMuc, s.TenSach;

-- A2. Mọi đơn hàng kèm TÊN KHÁCH HÀNG.
SELECT dh.MaDonHang, FORMAT(dh.NgayDat,'dd/MM/yyyy') AS NgayDat,
       kh.HoTen, dh.TrangThai
FROM DonHang dh
JOIN KhachHang kh ON dh.MaKH = kh.MaKH
ORDER BY dh.NgayDat DESC;

-- A3. Mọi cuốn sách kèm TÊN TÁC GIẢ (sách có thể có nhiều tác giả).
SELECT s.TenSach, tg.HoTen AS TacGia, stg.VaiTro
FROM Sach s
JOIN Sach_TacGia stg ON s.MaSach = stg.MaSach
JOIN TacGia tg ON stg.MaTacGia = tg.MaTacGia
ORDER BY s.TenSach;

-- A4. Sách CHƯA AI ĐÁNH GIÁ.  (mẫu LEFT JOIN + IS NULL)
SELECT s.MaSach, s.TenSach
FROM Sach s
LEFT JOIN DanhGia dg ON s.MaSach = dg.MaSach
WHERE dg.MaDanhGia IS NULL
ORDER BY s.TenSach;

-- A5. Khách hàng CHƯA TỪNG MUA gì.   (kỳ vọng: Tạ Thị Hồng, Phan Thị Yến...)
SELECT kh.MaKH, kh.HoTen, kh.Email
FROM KhachHang kh
LEFT JOIN DonHang dh ON kh.MaKH = dh.MaKH
WHERE dh.MaDonHang IS NULL;


/* ---------------------------------------------------------------------
   NHÓM B — GOM NHÓM (tự làm, 30 phút)
   --------------------------------------------------------------------- */

-- B1. Mỗi danh mục có bao nhiêu đầu sách? Sắp xếp giảm dần.
--     ⚠️ Danh mục KHÔNG có sách nào cũng phải xuất hiện (số 0).


-- B2. Mỗi tác giả có bao nhiêu cuốn sách trong hệ thống?


-- B3. Doanh thu của từng tháng năm 2025 (chỉ tính đơn HoanThanh).
--     Cột: Nam, Thang, SoDon, DoanhThu
--     ⚠️ SoDon phải dùng COUNT(DISTINCT MaDonHang) — vì sao?


-- B4. Top 3 khách hàng chi tiêu nhiều nhất.


-- B5. Mỗi thành phố có bao nhiêu khách hàng? Chỉ hiện thành phố có >= 2 khách.
--     Gợi ý: HAVING


-- B6. Sách nào có điểm đánh giá trung bình >= 4.5 VÀ có ít nhất 2 lượt đánh giá?


-- B7. Mỗi trạng thái đơn hàng có bao nhiêu đơn và tổng giá trị bao nhiêu?


-- B8. Nhà xuất bản nào có tổng giá trị tồn kho (GiaBan * SoLuongTon) lớn nhất?


-- B9. Mỗi khách hàng đã mua bao nhiêu ĐẦU SÁCH KHÁC NHAU?
--     Gợi ý: COUNT(DISTINCT ct.MaSach)


-- B10. Danh mục nào có giá trung bình cao nhất? Hiển thị kèm số đầu sách.


-- B11. Tháng nào trong năm 2025 có nhiều đơn hàng bị HỦY nhất?


-- B12. Với mỗi sách: tên sách, số lượt đánh giá, điểm trung bình.
--      Sách chưa ai đánh giá vẫn phải xuất hiện với 0 lượt.


/* ---------------------------------------------------------------------
   NHÓM C — BẪY JOIN (làm chung — QUAN TRỌNG)
   --------------------------------------------------------------------- */

-- C1. Chạy 3 câu sau, giải thích vì sao kết quả khác nhau.
SELECT COUNT(*) AS A_SoDonThucTe FROM DonHang;

SELECT COUNT(*) AS B_SauKhiJoin      -- 47: đếm DÒNG CHI TIẾT, không phải đơn!
FROM DonHang dh JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang;

SELECT COUNT(DISTINCT dh.MaDonHang) AS C_Dung
FROM DonHang dh JOIN ChiTietDonHang ct ON dh.MaDonHang = ct.MaDonHang;
-- Giải thích: ............................................................


-- C2. Vì sao câu thứ hai MẤT khách hàng?
SELECT COUNT(*) AS SoDong_LeftJoinDung
FROM KhachHang kh LEFT JOIN DonHang dh ON kh.MaKH = dh.MaKH;

SELECT COUNT(*) AS SoDong_BiHong
FROM KhachHang kh
LEFT JOIN DonHang dh ON kh.MaKH = dh.MaKH
WHERE dh.TrangThai = N'HoanThanh';

-- Cách sửa đúng:
SELECT COUNT(*) AS SoDong_DaSua
FROM KhachHang kh
LEFT JOIN DonHang dh ON kh.MaKH = dh.MaKH AND dh.TrangThai = N'HoanThanh';
-- Giải thích: ............................................................


-- C3. CROSS JOIN — thấy tích Descartes
SELECT COUNT(*) AS SoDong FROM Sach CROSS JOIN KhachHang;   -- 20 x 15 = 300
-- Trên hệ thống thật, đây là cách làm treo server.


-- C4. Bẫy "nhân đôi" khi JOIN 2 bảng con của cùng một cha.
--     Chạy và giải thích vì sao tổng doanh thu bị SAI:
SELECT SUM(ct.SoLuong * ct.DonGia) AS DoanhThu_SAI
FROM Sach s
JOIN ChiTietDonHang ct ON s.MaSach = ct.MaSach
JOIN DanhGia dg        ON s.MaSach = dg.MaSach;

SELECT SUM(ct.SoLuong * ct.DonGia) AS DoanhThu_DUNG
FROM ChiTietDonHang ct;
-- Giải thích: ............................................................


/* ---------------------------------------------------------------------
   NHÓM D — BÁO CÁO TỔNG HỢP (nâng cao)
   --------------------------------------------------------------------- */

-- D1. Báo cáo bán hàng đầy đủ: tên sách, danh mục, danh sách tác giả
--     (gộp bằng STRING_AGG), số lượng đã bán, doanh thu.
--     Sách chưa bán được cuốn nào vẫn xuất hiện với doanh thu 0.


-- D2. Doanh thu theo thành phố, kèm dòng TỔNG CỘNG cuối bảng.
--     Gợi ý: GROUP BY ROLLUP


-- D3. Tìm các CẶP SÁCH thường được mua cùng nhau trong một đơn hàng.
--     Kết quả: TenSachA, TenSachB, SoLanMuaCung — sắp xếp giảm dần.
--     Gợi ý: self-JOIN ChiTietDonHang trên MaDonHang,
--            điều kiện ct1.MaSach < ct2.MaSach để không đếm trùng.
GO
