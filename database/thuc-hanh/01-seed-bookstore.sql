/* =====================================================================
   BookStore — Dữ liệu mẫu
   Chạy SAU khi đã chạy 00-schema-bookstore.sql
   Quy mô: 8 danh mục · 12 tác giả · 20 sách · 21 liên kết sách-tác giả
           15 khách hàng · 25 đơn hàng · 47 dòng chi tiết · 22 đánh giá

   ⚠️ Nếu chạy bằng sqlcmd, BẮT BUỘC thêm cờ -f 65001 (đọc file UTF-8),
      nếu không mọi chuỗi tiếng Việt sẽ bị hỏng:
        sqlcmd -S localhost -E -f 65001 -i 01-seed-bookstore.sql
      Chạy trong SSMS thì không cần (SSMS tự nhận UTF-8).

   📌 GHI CHÚ KỸ THUẬT (đáng nói với học viên ở buổi 5):
      Script này dùng SET IDENTITY_INSERT để chèn mã tường minh, thay vì
      để IDENTITY tự sinh rồi DBCC CHECKIDENT RESEED. Lý do:
      DBCC CHECKIDENT(bang, RESEED, 0) trên một bảng CHƯA TỪNG có dòng nào
      sẽ làm dòng đầu tiên mang mã 0 (chứ không phải 1) — khiến toàn bộ khóa
      ngoại lệch đi một đơn vị. Chèn mã tường minh là cách duy nhất bảo đảm
      script cho ra kết quả GIỐNG NHAU dù chạy lần đầu hay chạy lại.
   ===================================================================== */

USE BookStore;
GO

-- Xóa dữ liệu cũ (thứ tự con -> cha) để có thể chạy lại nhiều lần
DELETE FROM DanhGia;
DELETE FROM ChiTietDonHang;
DELETE FROM DonHang;
DELETE FROM Sach_TacGia;
DELETE FROM Sach;
DELETE FROM KhachHang;
DELETE FROM TacGia;
DELETE FROM DanhMuc;
GO

/* ------------------------------ DANH MỤC ------------------------------ */
SET IDENTITY_INSERT DanhMuc ON;
INSERT INTO DanhMuc (MaDanhMuc, TenDanhMuc, MaDanhMucCha, MoTa) VALUES
    (1, N'Văn học',             NULL, N'Sách văn chương trong và ngoài nước'),
    (2, N'Kinh tế',             NULL, N'Kinh doanh, tài chính, quản trị'),
    (3, N'Khoa học',            NULL, N'Khoa học thường thức và chuyên sâu'),
    (4, N'Thiếu nhi',           NULL, N'Sách cho lứa tuổi dưới 15'),
    (5, N'Công nghệ thông tin', NULL, N'Lập trình, dữ liệu, hệ thống'),
    (6, N'Tiểu thuyết',            1, N'Thuộc Văn học'),
    (7, N'Truyện ngắn',            1, N'Thuộc Văn học'),
    (8, N'Kỹ năng sống',           2, N'Thuộc Kinh tế');
SET IDENTITY_INSERT DanhMuc OFF;
GO

/* ------------------------------ TÁC GIẢ ------------------------------- */
SET IDENTITY_INSERT TacGia ON;
INSERT INTO TacGia (MaTacGia, HoTen, QuocTich, NamSinh) VALUES
    ( 1, N'Paulo Coelho',              N'Brazil',   1947),
    ( 2, N'Dale Carnegie',             N'Mỹ',       1888),
    ( 3, N'Yuval Noah Harari',         N'Israel',   1976),
    ( 4, N'Nguyễn Nhật Ánh',           N'Việt Nam', 1955),
    ( 5, N'Nam Cao',                   N'Việt Nam', 1917),
    ( 6, N'Robert Kiyosaki',           N'Mỹ',       1947),
    ( 7, N'Stephen Hawking',           N'Anh',      1942),
    ( 8, N'Antoine de Saint-Exupéry',  N'Pháp',     1900),
    ( 9, N'Martin Fowler',             N'Anh',      1963),
    (10, N'Robert C. Martin',          N'Mỹ',       1952),
    (11, N'Tô Hoài',                   N'Việt Nam', 1920),
    (12, N'Nguyễn Ngọc Tư',            N'Việt Nam', 1976);
SET IDENTITY_INSERT TacGia OFF;
GO

/* -------------------------------- SÁCH -------------------------------- */
SET IDENTITY_INSERT Sach ON;
INSERT INTO Sach (MaSach, ISBN, TenSach, MaDanhMuc, GiaBan, SoLuongTon, NamXuatBan, NhaXuatBan, SoTrang) VALUES
    ( 1, '978-604-1-00001-1', N'Nhà giả kim',                         6,  79000, 120, 2020, N'NXB Hội Nhà Văn',  228),
    ( 2, '978-604-1-00002-8', N'Đắc nhân tâm',                        8,  88000, 200, 2019, N'NXB Tổng Hợp',     320),
    ( 3, '978-604-1-00003-5', N'Sapiens: Lược sử loài người',         3, 189000,  45, 2021, N'NXB Thế Giới',     554),
    ( 4, '978-604-1-00004-2', N'Homo Deus: Lược sử tương lai',        3, 199000,  30, 2022, N'NXB Thế Giới',     500),
    ( 5, '978-604-1-00005-9', N'Mắt biếc',                            6,  95000,  85, 2018, N'NXB Trẻ',          288),
    ( 6, '978-604-1-00006-6', N'Cho tôi xin một vé đi tuổi thơ',      6,  72000, 150, 2017, N'NXB Trẻ',          208),
    ( 7, '978-604-1-00007-3', N'Chí Phèo',                            7,  45000,  60, 2015, N'NXB Văn Học',      120),
    ( 8, '978-604-1-00008-0', N'Lão Hạc',                             7,  42000,   0, 2015, N'NXB Văn Học',       96),
    ( 9, '978-604-1-00009-7', N'Cha giàu cha nghèo',                  2, 129000,  95, 2020, N'NXB Trẻ',          290),
    (10, '978-604-1-00010-3', N'Dạy con làm giàu',                    2, 145000,  40, 2019, N'NXB Trẻ',          350),
    (11, '978-604-1-00011-0', N'Lược sử thời gian',                   3, 165000,  25, 2021, N'NXB Trẻ',          272),
    (12, '978-604-1-00012-7', N'Hoàng tử bé',                         4,  68000, 180, 2020, N'NXB Kim Đồng',     112),
    (13, '978-604-1-00013-4', N'Dế Mèn phiêu lưu ký',                 4,  55000, 210, 2019, N'NXB Kim Đồng',     144),
    (14, '978-604-1-00014-1', N'Refactoring',                         5, 450000,  15, 2019, N'Addison-Wesley',   448),
    (15, '978-604-1-00015-8', N'Clean Code',                          5, 420000,  22, 2018, N'Prentice Hall',    464),
    (16, '978-604-1-00016-5', N'Clean Architecture',                  5, 460000,   8, 2020, N'Prentice Hall',    432),
    (17, '978-604-1-00017-2', N'Cánh đồng bất tận',                   7,  65000,  70, 2016, N'NXB Trẻ',          216),
    (18, '978-604-1-00018-9', N'Tôi thấy hoa vàng trên cỏ xanh',      6,  98000, 110, 2018, N'NXB Trẻ',          378),
    (19, '978-604-1-00019-6', N'Quẳng gánh lo đi và vui sống',        8,  92000,  65, 2020, N'NXB Tổng Hợp',     300),
    (20, NULL,                N'Nhà giả kim (bản đặc biệt bìa cứng)', 6, 250000,   5, 2023, N'NXB Hội Nhà Văn',  228);
    --   ↑ ISBN NULL có chủ đích: dùng để dạy IS NULL (buổi 5) và UNIQUE cho phép 1 NULL (buổi 2)
SET IDENTITY_INSERT Sach OFF;
GO

/* --------------------------- SÁCH - TÁC GIẢ --------------------------- */
INSERT INTO Sach_TacGia (MaSach, MaTacGia, VaiTro) VALUES
    ( 1,  1, N'Tác giả'), (20,  1, N'Tác giả'),
    ( 2,  2, N'Tác giả'), (19,  2, N'Tác giả'),
    ( 3,  3, N'Tác giả'), ( 4,  3, N'Tác giả'),
    ( 5,  4, N'Tác giả'), ( 6,  4, N'Tác giả'), (18, 4, N'Tác giả'),
    ( 7,  5, N'Tác giả'), ( 8,  5, N'Tác giả'),
    ( 9,  6, N'Tác giả'), (10,  6, N'Tác giả'),
    (11,  7, N'Tác giả'),
    (12,  8, N'Tác giả'),
    (13, 11, N'Tác giả'),
    (14,  9, N'Tác giả'), (14, 10, N'Đồng tác giả'),   -- sách có 2 tác giả
    (15, 10, N'Tác giả'), (16, 10, N'Tác giả'),
    (17, 12, N'Tác giả');
GO

/* ----------------------------- KHÁCH HÀNG ----------------------------- */
SET IDENTITY_INSERT KhachHang ON;
INSERT INTO KhachHang (MaKH, HoTen, Email, SoDienThoai, ThanhPho, DiaChi, NgayDangKy, DiemTichLuy) VALUES
    ( 1, N'Trần Thị Bích',   'bich.tran@email.vn',  '0901234567', N'Hà Nội',    N'12 Trần Duy Hưng',   '2024-01-15', 350),
    ( 2, N'Lê Văn Cường',    'cuong.le@email.vn',   '0912345678', N'Đà Nẵng',   N'45 Nguyễn Văn Linh', '2024-02-20', 120),
    ( 3, N'Phạm Thu Hà',     'ha.pham@email.vn',    '0923456789', N'Hà Nội',    N'8 Láng Hạ',          '2024-03-05', 890),
    ( 4, N'Nguyễn Minh Đức', 'duc.nguyen@email.vn', '0934567890', N'TP.HCM',    N'220 Lê Văn Sỹ',      '2024-03-18',  45),
    ( 5, N'Hoàng Thị Lan',   'lan.hoang@email.vn',  '0945678901', N'TP.HCM',    N'77 Điện Biên Phủ',   '2024-04-02', 610),
    ( 6, N'Vũ Đình Nam',     'nam.vu@email.vn',     '0956789012', N'Hải Phòng', N'19 Lạch Tray',       '2024-05-11',   0),
    ( 7, N'Đỗ Thùy Linh',    'linh.do@email.vn',    '0967890123', N'Hà Nội',    N'33 Kim Mã',          '2024-06-25', 275),
    ( 8, N'Bùi Quang Huy',   'huy.bui@email.vn',    NULL,         N'Cần Thơ',   N'5 Hòa Bình',         '2024-07-08',  90),
    ( 9, N'Ngô Thị Mai',     'mai.ngo@email.vn',    '0989012345', N'Đà Nẵng',   N'101 Bạch Đằng',      '2024-08-14', 430),
    (10, N'Trịnh Văn Sơn',   'son.trinh@email.vn',  '0990123456', N'TP.HCM',    N'62 Cách Mạng T8',    '2024-09-30', 155),
    (11, N'Lý Thị Nga',      'nga.ly@email.vn',     '0901111222', N'Hà Nội',    NULL,                  '2025-01-10',  20),
    (12, N'Đặng Hoàng Long', 'long.dang@email.vn',  '0902222333', N'Huế',       N'14 Lê Lợi',          '2025-02-17', 700),
    (13, N'Phan Thị Yến',    'yen.phan@email.vn',   '0903333444', N'TP.HCM',    N'88 Nguyễn Trãi',     '2025-04-22',   0),
    (14, N'Chu Văn Thắng',   'thang.chu@email.vn',  '0904444555', N'Hà Nội',    N'27 Xuân Thủy',       '2025-06-01', 310),
    (15, N'Tạ Thị Hồng',     'hong.ta@email.vn',    NULL,         N'Nha Trang', NULL,                  '2025-07-19',   0);
    --   ↑ KH 6, 13, 15 chưa từng mua gì: dùng để dạy LEFT JOIN + IS NULL (buổi 6)
    --   ↑ KH 8, 15 không có SĐT: dùng để dạy IS NULL (buổi 5)
SET IDENTITY_INSERT KhachHang OFF;
GO

/* ------------------------------ ĐƠN HÀNG ------------------------------
   Mã đơn 1000–1024. Có đủ 4 trạng thái để luyện WHERE / GROUP BY.
   ---------------------------------------------------------------------- */
SET IDENTITY_INSERT DonHang ON;
INSERT INTO DonHang (MaDonHang, MaKH, NgayDat, TrangThai, PhuongThucTT, PhiVanChuyen) VALUES
    (1000,  1, '2025-01-05 09:15:00', N'HoanThanh', N'COD',         25000),
    (1001,  1, '2025-02-11 14:30:00', N'HoanThanh', N'ChuyenKhoan',     0),
    (1002,  2, '2025-02-18 10:05:00', N'HoanThanh', N'COD',         30000),
    (1003,  3, '2025-03-02 16:45:00', N'HoanThanh', N'The',             0),
    (1004,  3, '2025-03-20 11:20:00', N'HoanThanh', N'The',             0),
    (1005,  3, '2025-04-08 08:50:00', N'HoanThanh', N'ViDienTu',    15000),
    (1006,  4, '2025-04-15 19:10:00', N'Huy',       N'COD',         25000),
    (1007,  5, '2025-04-27 13:00:00', N'HoanThanh', N'ChuyenKhoan',     0),
    (1008,  5, '2025-05-09 09:40:00', N'HoanThanh', N'ChuyenKhoan',     0),
    (1009,  6, '2025-05-19 15:25:00', N'Huy',       N'COD',         30000),
    (1010,  7, '2025-06-03 10:15:00', N'HoanThanh', N'ViDienTu',    15000),
    (1011,  7, '2025-06-21 17:35:00', N'HoanThanh', N'ViDienTu',    15000),
    (1012,  8, '2025-07-02 12:00:00', N'HoanThanh', N'COD',         35000),
    (1013,  9, '2025-07-14 08:20:00', N'HoanThanh', N'The',             0),
    (1014,  9, '2025-08-01 14:55:00', N'HoanThanh', N'The',             0),
    (1015, 10, '2025-08-19 11:30:00', N'HoanThanh', N'COD',         25000),
    (1016, 12, '2025-09-05 09:00:00', N'HoanThanh', N'ChuyenKhoan',     0),
    (1017, 12, '2025-10-11 16:10:00', N'HoanThanh', N'ChuyenKhoan',     0),
    (1018, 14, '2025-11-08 10:45:00', N'HoanThanh', N'ViDienTu',    15000),
    (1019,  1, '2025-12-15 13:20:00', N'HoanThanh', N'COD',         25000),
    (1020,  3, '2026-01-09 09:35:00', N'DangGiao',  N'The',             0),
    (1021,  5, '2026-02-14 15:00:00', N'DangGiao',  N'ChuyenKhoan',     0),
    (1022, 11, '2026-03-01 11:10:00', N'Moi',       N'COD',         30000),
    (1023, 13, '2026-03-18 17:25:00', N'Moi',       N'ViDienTu',    15000),
    (1024, 14, '2026-03-25 08:05:00', N'Moi',       N'COD',         25000);
SET IDENTITY_INSERT DonHang OFF;
GO

/* --------------------------- CHI TIẾT ĐƠN HÀNG ------------------------ */
INSERT INTO ChiTietDonHang (MaDonHang, MaSach, SoLuong, DonGia, GiamGia) VALUES
    (1000,  1, 2,  79000, 0.00), (1000,  2, 1,  88000, 0.00),
    (1001,  3, 1, 189000, 0.10),
    (1002,  1, 1,  79000, 0.00), (1002, 12, 2,  68000, 0.00),
    (1003,  9, 1, 129000, 0.00), (1003, 10, 1, 145000, 0.05), (1003,  2, 1,  88000, 0.00),
    (1004, 14, 1, 450000, 0.15),
    (1005, 15, 1, 420000, 0.10), (1005, 16, 1, 460000, 0.10),
    (1006,  5, 1,  95000, 0.00),
    (1007,  3, 1, 189000, 0.00), (1007,  4, 1, 199000, 0.00),
    (1008, 11, 2, 165000, 0.05),
    (1009,  7, 3,  45000, 0.00),
    (1010, 18, 1,  98000, 0.00), (1010,  6, 1,  72000, 0.00), (1010,  5, 1,  95000, 0.00),
    (1011, 13, 4,  55000, 0.10),
    (1012,  2, 2,  88000, 0.00), (1012, 19, 1,  92000, 0.00),
    (1013, 17, 1,  65000, 0.00), (1013,  7, 1,  45000, 0.00), (1013,  8, 1,  42000, 0.00),
    (1014,  1, 1,  79000, 0.00), (1014, 20, 1, 250000, 0.00),
    (1015,  9, 2, 129000, 0.05),
    (1016, 15, 1, 420000, 0.00), (1016, 14, 1, 450000, 0.00), (1016, 16, 1, 460000, 0.05),
    (1017,  3, 2, 189000, 0.10), (1017, 11, 1, 165000, 0.00),
    (1018,  6, 2,  72000, 0.00), (1018, 12, 1,  68000, 0.00), (1018, 13, 1,  55000, 0.00),
    (1019,  1, 1,  79000, 0.00), (1019, 18, 2,  98000, 0.05),
    (1020,  4, 1, 199000, 0.00), (1020,  3, 1, 189000, 0.00),
    (1021, 19, 1,  92000, 0.00), (1021,  2, 1,  88000, 0.00),
    (1022,  5, 1,  95000, 0.00), (1022,  6, 1,  72000, 0.00),
    (1023, 15, 1, 420000, 0.00),
    (1024, 12, 3,  68000, 0.10), (1024, 13, 2,  55000, 0.10);
GO

/* ------------------------------ ĐÁNH GIÁ ------------------------------ */
INSERT INTO DanhGia (MaSach, MaKH, SoSao, BinhLuan, NgayDanhGia) VALUES
    ( 1,  1, 5, N'Cuốn sách thay đổi cách tôi nhìn cuộc sống.',       '2025-01-20'),
    ( 2,  1, 4, N'Nhiều lời khuyên hữu ích, đôi chỗ hơi dài dòng.',   '2025-01-22'),
    ( 3,  1, 5, N'Xuất sắc, đáng đọc lại nhiều lần.',                 '2025-02-25'),
    ( 1,  2, 4, N'Hay nhưng bản dịch có vài chỗ khó hiểu.',           '2025-03-01'),
    (12,  2, 5, N'Mua cho con, cháu rất thích.',                      '2025-03-02'),
    ( 9,  3, 5, N'Nên đọc từ khi còn trẻ.',                           '2025-03-10'),
    (10,  3, 3, N'Nội dung lặp lại nhiều so với cuốn trước.',         '2025-03-11'),
    (14,  3, 5, N'Kinh điển cho lập trình viên.',                     '2025-03-28'),
    (15,  3, 5, N'Đọc xong code sạch hẳn lên.',                       '2025-04-15'),
    (16,  3, 4, N'Hơi lý thuyết, cần kinh nghiệm mới thấm.',          '2025-04-16'),
    ( 3,  5, 5, N'Góc nhìn mới mẻ về lịch sử loài người.',            '2025-05-02'),
    ( 4,  5, 4, N'Không hay bằng Sapiens nhưng vẫn đáng đọc.',        '2025-05-03'),
    (11,  5, 5, N'Vật lý mà đọc như tiểu thuyết.',                    '2025-05-20'),
    (18,  7, 5, N'Tuổi thơ ùa về.',                                   '2025-06-10'),
    ( 6,  7, 4, N'Nhẹ nhàng, dễ thương.',                             '2025-06-11'),
    (13,  7, 5, N'Kinh điển thiếu nhi Việt Nam.',                     '2025-06-30'),
    ( 2,  8, 2, N'Sách giao đến bị rách bìa, nội dung thì ổn.',       '2025-07-10'),
    (17,  9, 5, N'Văn Nguyễn Ngọc Tư quá đẹp và buồn.',               '2025-07-20'),
    ( 7,  9, 4, N'Tác phẩm để đời.',                                  '2025-07-21'),
    ( 9, 10, 4, N'Tư duy tài chính cơ bản, dễ hiểu.',                 '2025-08-25'),
    (15, 12, 5, N'Bắt buộc phải có trên giá sách.',                   '2025-09-15'),
    ( 3, 12, 4, N'Dày nhưng cuốn.',                                   '2025-10-20');
GO

/* ------------------------------ KIỂM TRA ------------------------------
   Kỳ vọng: 8 · 12 · 20 · 21 · 15 · 25 · 47 · 22
   ---------------------------------------------------------------------- */
SELECT 'DanhMuc' AS Bang, COUNT(*) AS SoDong, 8 AS KyVong FROM DanhMuc
UNION ALL SELECT 'TacGia',         COUNT(*), 12 FROM TacGia
UNION ALL SELECT 'Sach',           COUNT(*), 20 FROM Sach
UNION ALL SELECT 'Sach_TacGia',    COUNT(*), 21 FROM Sach_TacGia
UNION ALL SELECT 'KhachHang',      COUNT(*), 15 FROM KhachHang
UNION ALL SELECT 'DonHang',        COUNT(*), 25 FROM DonHang
UNION ALL SELECT 'ChiTietDonHang', COUNT(*), 47 FROM ChiTietDonHang
UNION ALL SELECT 'DanhGia',        COUNT(*), 22 FROM DanhGia;
GO

PRINT N'>>> Đã nạp xong dữ liệu mẫu BookStore.';
GO
