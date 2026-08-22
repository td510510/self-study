/* =====================================================================
   BÀI TẬP BUỔI 8 — Index, Execution Plan, Transaction, ACID
   CSDL: BookStore
   ⚠️ Phần 3 cần MỞ 2 CỬA SỔ QUERY trong SSMS
   ===================================================================== */

USE BookStore;
GO

/* =====================================================================
   PHẦN 1 — CHUẨN BỊ DỮ LIỆU LỚN
   ===================================================================== */

DROP TABLE IF EXISTS LogTruyCap;
CREATE TABLE LogTruyCap (
    MaLog    INT IDENTITY(1,1) PRIMARY KEY,
    MaKH     INT NOT NULL,
    ThoiGian DATETIME2 NOT NULL,
    HanhDong NVARCHAR(50) NOT NULL,
    DiaChiIP VARCHAR(45)
);
GO

WITH N AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM N WHERE n < 500000)
INSERT INTO LogTruyCap (MaKH, ThoiGian, HanhDong, DiaChiIP)
SELECT (n % 15) + 1,
       DATEADD(MINUTE, -n, GETDATE()),
       CASE n % 4 WHEN 0 THEN N'DangNhap' WHEN 1 THEN N'XemSach'
                  WHEN 2 THEN N'ThemGioHang' ELSE N'ThanhToan' END,
       CONCAT('192.168.', n % 255, '.', (n / 255) % 255)
FROM N OPTION (MAXRECURSION 0);
GO

SELECT COUNT(*) AS TongDong FROM LogTruyCap;   -- 500000
GO


/* =====================================================================
   PHẦN 2 — ĐO TÁC ĐỘNG CỦA INDEX
   Bật Ctrl+M (Actual Execution Plan) trước khi chạy!
   ===================================================================== */

SET STATISTICS IO, TIME ON;
GO

-- 2.1. ĐO KHI CHƯA CÓ INDEX — ghi lại logical reads và elapsed time
SELECT * FROM LogTruyCap WHERE MaKH = 7;
SELECT * FROM LogTruyCap WHERE HanhDong = N'ThanhToan';
SELECT * FROM LogTruyCap WHERE MaKH = 7 AND HanhDong = N'ThanhToan';
SELECT COUNT(*) FROM LogTruyCap WHERE ThoiGian >= DATEADD(DAY, -7, GETDATE());
GO

/* Bảng ghi kết quả — điền vào:
   -------------------------------------------------------------------
   | Truy vấn                     | Logical reads | Time (ms) | Toán tử |
   |------------------------------|---------------|-----------|---------|
   | MaKH = 7                     |               |           |         |
   | HanhDong = 'ThanhToan'       |               |           |         |
   | MaKH = 7 AND HanhDong = ...  |               |           |         |
   | ThoiGian >= 7 ngày trước     |               |           |         |
   ------------------------------------------------------------------- */

-- 2.2. TẠO INDEX
CREATE NONCLUSTERED INDEX IX_Log_MaKH_HanhDong ON LogTruyCap (MaKH, HanhDong);
CREATE NONCLUSTERED INDEX IX_Log_ThoiGian      ON LogTruyCap (ThoiGian);
GO

-- 2.3. ĐO LẠI — so sánh với bảng trên
SELECT * FROM LogTruyCap WHERE MaKH = 7;
SELECT * FROM LogTruyCap WHERE HanhDong = N'ThanhToan';   -- vẫn chậm! vì sao?
SELECT * FROM LogTruyCap WHERE MaKH = 7 AND HanhDong = N'ThanhToan';
SELECT COUNT(*) FROM LogTruyCap WHERE ThoiGian >= DATEADD(DAY, -7, GETDATE());
GO

-- 2.4. COVERING INDEX — thêm INCLUDE để loại bỏ Key Lookup
CREATE NONCLUSTERED INDEX IX_Log_Covering
    ON LogTruyCap (MaKH, HanhDong) INCLUDE (ThoiGian, DiaChiIP);
GO
SELECT MaKH, HanhDong, ThoiGian, DiaChiIP
FROM LogTruyCap WHERE MaKH = 7 AND HanhDong = N'ThanhToan';
GO

-- 2.5. ⚠️ NHỮNG CÁCH TỰ VÔ HIỆU HÓA INDEX — chạy và xem plan
--      (a) Bọc hàm quanh cột -> Index Scan
SELECT COUNT(*) FROM LogTruyCap WHERE YEAR(ThoiGian) = 2026;
--      (b) Viết lại thành điều kiện dải -> Index Seek
SELECT COUNT(*) FROM LogTruyCap
WHERE ThoiGian >= '2026-01-01' AND ThoiGian < '2027-01-01';

--      (c) LIKE bắt đầu bằng % -> Scan
SELECT COUNT(*) FROM LogTruyCap WHERE DiaChiIP LIKE '%.1.1';
--      (d) LIKE theo tiền tố -> Seek (nếu có index trên DiaChiIP)
CREATE NONCLUSTERED INDEX IX_Log_IP ON LogTruyCap (DiaChiIP);
SELECT COUNT(*) FROM LogTruyCap WHERE DiaChiIP LIKE '192.168.1.%';
GO

SET STATISTICS IO, TIME OFF;
GO

-- 2.6. Xem index nào đang được dùng, index nào vô dụng
SELECT
    OBJECT_NAME(i.object_id) AS Bang,
    i.name        AS TenIndex,
    i.type_desc   AS Loai,
    ISNULL(us.user_seeks, 0)   AS SoLanSeek,
    ISNULL(us.user_scans, 0)   AS SoLanScan,
    ISNULL(us.user_updates, 0) AS SoLanPhaiCapNhat
FROM sys.indexes i
LEFT JOIN sys.dm_db_index_usage_stats us
       ON i.object_id = us.object_id AND i.index_id = us.index_id
WHERE OBJECTPROPERTY(i.object_id, 'IsUserTable') = 1 AND i.name IS NOT NULL
ORDER BY Bang, TenIndex;
-- ⚠️ Index có SoLanPhaiCapNhat cao mà SoLanSeek = 0 -> nên XÓA.
GO

-- 2.7. Độ chọn lọc của cột — có đáng đánh index không?
SELECT
    COUNT(DISTINCT MaKH)     * 1.0 / COUNT(*) AS DoChonLoc_MaKH,
    COUNT(DISTINCT HanhDong) * 1.0 / COUNT(*) AS DoChonLoc_HanhDong,
    COUNT(DISTINCT ThoiGian) * 1.0 / COUNT(*) AS DoChonLoc_ThoiGian
FROM LogTruyCap;
-- Càng gần 1 càng đáng đánh index. Dưới 0.05 thường không đáng.
GO


/* =====================================================================
   PHẦN 3 — TRANSACTION
   ===================================================================== */

DROP TABLE IF EXISTS TaiKhoan;
CREATE TABLE TaiKhoan (
    MaTK  VARCHAR(10)  PRIMARY KEY,
    ChuTK NVARCHAR(100) NOT NULL,
    SoDu  DECIMAL(18,2) NOT NULL CHECK (SoDu >= 0)
);
INSERT INTO TaiKhoan VALUES
    ('A', N'Trần Thị Bích', 5000000),
    ('B', N'Lê Văn Cường',  2000000);
GO

-- 3.1. MẪU GIAO DỊCH CHUẨN — học thuộc
BEGIN TRY
    BEGIN TRANSACTION;
        UPDATE TaiKhoan SET SoDu = SoDu - 1000000 WHERE MaTK = 'A';
        UPDATE TaiKhoan SET SoDu = SoDu + 1000000 WHERE MaTK = 'B';
    COMMIT TRANSACTION;
    PRINT N'Chuyển khoản thành công';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT N'Lỗi, đã hoàn tác: ' + ERROR_MESSAGE();
END CATCH;
SELECT * FROM TaiKhoan;
GO

-- 3.2. Thử chuyển QUÁ SỐ DƯ -> CHECK kích hoạt CATCH -> ROLLBACK
BEGIN TRY
    BEGIN TRANSACTION;
        UPDATE TaiKhoan SET SoDu = SoDu - 10000000 WHERE MaTK = 'A';
        UPDATE TaiKhoan SET SoDu = SoDu + 10000000 WHERE MaTK = 'B';
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    PRINT N'Đã hoàn tác: ' + ERROR_MESSAGE();
END CATCH;
SELECT * FROM TaiKhoan;   -- cả hai NGUYÊN VẸN
GO

-- 3.3. Thủ tục đặt hàng có transaction đầy đủ
CREATE OR ALTER PROCEDURE sp_DatHang
    @MaKH INT, @MaSach INT, @SoLuong INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
            DECLARE @Ton INT, @Gia DECIMAL(12,2), @MaDon INT;

            SELECT @Ton = SoLuongTon, @Gia = GiaBan
            FROM Sach WITH (UPDLOCK) WHERE MaSach = @MaSach;

            IF @Ton IS NULL     THROW 50001, N'Sách không tồn tại.', 1;
            IF @Ton < @SoLuong  THROW 50002, N'Không đủ hàng trong kho.', 1;

            INSERT INTO DonHang (MaKH, TrangThai) VALUES (@MaKH, N'Moi');
            SET @MaDon = SCOPE_IDENTITY();

            INSERT INTO ChiTietDonHang (MaDonHang, MaSach, SoLuong, DonGia)
            VALUES (@MaDon, @MaSach, @SoLuong, @Gia);

            UPDATE Sach SET SoLuongTon = SoLuongTon - @SoLuong WHERE MaSach = @MaSach;
        COMMIT TRANSACTION;
        SELECT @MaDon AS MaDonHangVuaTao;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

SELECT MaSach, TenSach, SoLuongTon FROM Sach WHERE MaSach IN (1, 8);
EXEC sp_DatHang @MaKH = 1, @MaSach = 1, @SoLuong = 3;      -- thành công
EXEC sp_DatHang @MaKH = 1, @MaSach = 8, @SoLuong = 99999;  -- thất bại
SELECT MaSach, TenSach, SoLuongTon FROM Sach WHERE MaSach IN (1, 8);
GO


/* =====================================================================
   PHẦN 4 — MÔ PHỎNG ĐỒNG THỜI (CẦN 2 CỬA SỔ QUERY)
   ===================================================================== */

/* ---------- THÍ NGHIỆM A: DIRTY READ ----------

   🪟 CỬA SỔ 1 — chạy khối này, ĐỪNG COMMIT:

       BEGIN TRANSACTION;
       UPDATE TaiKhoan SET SoDu = SoDu - 3000000 WHERE MaTK = 'A';
       SELECT * FROM TaiKhoan;

   🪟 CỬA SỔ 2 — chạy:

       SELECT * FROM TaiKhoan WHERE MaTK = 'A';
       -- BỊ TREO (READ COMMITTED đang bảo vệ bạn). Bấm Cancel.

       SELECT * FROM TaiKhoan WITH (NOLOCK) WHERE MaTK = 'A';
       -- Thấy ngay 2 triệu -> ĐÂY LÀ DỮ LIỆU BẨN

   🪟 CỬA SỔ 1 — chạy:

       ROLLBACK TRANSACTION;
       SELECT * FROM TaiKhoan;   -- A vẫn 5 triệu

   ➜ Kết luận: cửa sổ 2 đã ra quyết định dựa trên con số chưa từng tồn tại.
   ------------------------------------------------------------------- */


/* ---------- THÍ NGHIỆM B: LOST UPDATE ----------

   🪟 CỬA SỔ 1:
       BEGIN TRANSACTION;
       DECLARE @ton1 INT;
       SELECT @ton1 = SoLuongTon FROM Sach WHERE MaSach = 1;
       WAITFOR DELAY '00:00:10';
       UPDATE Sach SET SoLuongTon = @ton1 - 5 WHERE MaSach = 1;
       COMMIT;

   🪟 CỬA SỔ 2 — chạy NGAY trong lúc cửa sổ 1 đang chờ:
       BEGIN TRANSACTION;
       DECLARE @ton2 INT;
       SELECT @ton2 = SoLuongTon FROM Sach WHERE MaSach = 1;
       UPDATE Sach SET SoLuongTon = @ton2 - 3 WHERE MaSach = 1;
       COMMIT;

   ➜ Bán 8 cuốn nhưng kho chỉ giảm 5 (hoặc 3). MẤT MÁT CẬP NHẬT.

   CÁCH SỬA 1 — giữ khóa ngay từ lúc đọc:
       SELECT @ton1 = SoLuongTon FROM Sach WITH (UPDLOCK) WHERE MaSach = 1;

   CÁCH SỬA 2 (tốt hơn) — không đọc rồi ghi, mà ghi trực tiếp:
       UPDATE Sach SET SoLuongTon = SoLuongTon - 5
       WHERE MaSach = 1 AND SoLuongTon >= 5;
       IF @@ROWCOUNT = 0 THROW 50002, N'Không đủ hàng', 1;
   ------------------------------------------------------------------- */


/* ---------- THÍ NGHIỆM C: DEADLOCK ----------

   🪟 CỬA SỔ 1:
       BEGIN TRANSACTION;
       UPDATE TaiKhoan SET SoDu = SoDu - 100 WHERE MaTK = 'A';
       WAITFOR DELAY '00:00:05';
       UPDATE TaiKhoan SET SoDu = SoDu + 100 WHERE MaTK = 'B';
       COMMIT;

   🪟 CỬA SỔ 2 — chạy ngay, chú ý THỨ TỰ NGƯỢC LẠI:
       BEGIN TRANSACTION;
       UPDATE TaiKhoan SET SoDu = SoDu - 200 WHERE MaTK = 'B';
       WAITFOR DELAY '00:00:05';
       UPDATE TaiKhoan SET SoDu = SoDu + 200 WHERE MaTK = 'A';
       COMMIT;

   ➜ Một trong hai nhận Msg 1205 (deadlock victim).
   CÁCH SỬA: cho CẢ HAI cùng sửa 'A' trước rồi mới 'B'.
   ------------------------------------------------------------------- */

-- Xem giao dịch nào đang mở và đang giữ khóa gì
-- (session_id nằm ở dm_tran_session_transactions, KHÔNG có trong dm_tran_database_transactions)
SELECT st.session_id, dt.transaction_id, dt.database_transaction_begin_time
FROM sys.dm_tran_database_transactions AS dt
JOIN sys.dm_tran_session_transactions  AS st ON dt.transaction_id = st.transaction_id
WHERE dt.database_id = DB_ID();

SELECT request_session_id, resource_type, request_mode, request_status,
       OBJECT_NAME(p.object_id) AS Bang
FROM sys.dm_tran_locks l
LEFT JOIN sys.partitions p ON l.resource_associated_entity_id = p.hobt_id
WHERE resource_database_id = DB_ID();
GO


/* =====================================================================
   PHẦN 5 — BÀI TẬP TỰ LÀM
   ===================================================================== */

-- 5.1. Viết sp_HuyDonHang(@MaDon): đổi trạng thái đơn sang N'Huy' VÀ hoàn lại
--      tồn kho cho từng sách trong đơn. Bọc trong transaction đầy đủ.
--      Phải kiểm tra: đơn tồn tại, đơn chưa ở trạng thái Huy.


-- 5.2. Viết sp_ChuyenKho(@MaSachTu, @MaSachDen, @SoLuong) — chuyển tồn kho
--      giữa hai đầu sách, kiểm tra đủ hàng.


-- 5.3. Bảng LogTruyCap hay bị truy vấn bởi:
--        WHERE ThoiGian BETWEEN ? AND ? AND HanhDong = ?
--      Thiết kế index phù hợp. Giải thích THỨ TỰ CỘT bạn chọn
--      (nhớ quy tắc: cột lọc bằng '=' đặt TRƯỚC cột lọc theo dải).
--      Đo bằng SET STATISTICS IO ON để chứng minh.


-- 5.4. Viết sp_ThanhToanDonHang(@MaDon, @PhuongThuc): kiểm tra đơn tồn tại và
--      đang ở trạng thái N'Moi', cập nhật trạng thái + phương thức thanh toán,
--      cộng điểm tích lũy cho khách (1 điểm / 10.000đ giá trị đơn).
--      Tất cả trong một transaction. Tự viết 4 test case (2 thành công, 2 lỗi).


-- 5.5. Sinh script DROP cho mọi index chưa từng được dùng (KHÔNG chạy DROP,
--      chỉ sinh chuỗi lệnh và nộp).
SELECT 'DROP INDEX ' + QUOTENAME(i.name) + ' ON '
       + QUOTENAME(SCHEMA_NAME(o.schema_id)) + '.' + QUOTENAME(o.name) + ';' AS ScriptDeXuat
FROM sys.indexes i
JOIN sys.objects o ON i.object_id = o.object_id
LEFT JOIN sys.dm_db_index_usage_stats us
       ON i.object_id = us.object_id AND i.index_id = us.index_id
WHERE o.type = 'U' AND i.type_desc = 'NONCLUSTERED' AND i.is_primary_key = 0
  AND i.is_unique_constraint = 0
  AND ISNULL(us.user_seeks, 0) + ISNULL(us.user_scans, 0) + ISNULL(us.user_lookups, 0) = 0;
GO


/* =====================================================================
   DỌN DẸP (chạy khi kết thúc buổi học)
   ===================================================================== */
-- DROP TABLE IF EXISTS LogTruyCap;
-- DROP TABLE IF EXISTS TaiKhoan;
-- DROP PROCEDURE IF EXISTS sp_DatHang;
GO
