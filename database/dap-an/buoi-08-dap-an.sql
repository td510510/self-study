/* =====================================================================
   ĐÁP ÁN BUỔI 8 — Index và Transaction
   ⚠️ Dành cho giảng viên
   ===================================================================== */

USE BookStore;
GO

/* ---------------------- 5.1. sp_HuyDonHang ---------------------- */

CREATE OR ALTER PROCEDURE sp_HuyDonHang
    @MaDon INT,
    @LyDo  NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

            DECLARE @TrangThai NVARCHAR(20);

            -- UPDLOCK: giữ khóa từ lúc đọc để không ai hủy song song
            SELECT @TrangThai = TrangThai
            FROM DonHang WITH (UPDLOCK)
            WHERE MaDonHang = @MaDon;

            IF @TrangThai IS NULL
                THROW 50010, N'Đơn hàng không tồn tại.', 1;
            IF @TrangThai = N'Huy'
                THROW 50011, N'Đơn hàng đã bị hủy trước đó.', 1;
            IF @TrangThai = N'HoanThanh'
                THROW 50012, N'Không thể hủy đơn đã hoàn thành.', 1;

            -- Hoàn lại tồn kho cho TỪNG sách trong đơn (một lệnh UPDATE duy nhất)
            UPDATE s
            SET s.SoLuongTon = s.SoLuongTon + ct.SoLuong
            FROM Sach s
            JOIN ChiTietDonHang ct ON s.MaSach = ct.MaSach
            WHERE ct.MaDonHang = @MaDon;

            UPDATE DonHang SET TrangThai = N'Huy' WHERE MaDonHang = @MaDon;

        COMMIT TRANSACTION;
        PRINT N'Đã hủy đơn ' + CAST(@MaDon AS NVARCHAR(10)) + N' và hoàn kho.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/* Test — MỖI TEST CASE MỘT BATCH RIÊNG.
   Lý do: thủ tục dùng SET XACT_ABORT ON, một lỗi sẽ hủy toàn bộ batch,
   nên nếu viết liền nhau thì chỉ test case lỗi ĐẦU TIÊN được chạy. */
SELECT MaSach, SoLuongTon FROM Sach
WHERE MaSach IN (SELECT MaSach FROM ChiTietDonHang WHERE MaDonHang = 1022);
EXEC sp_HuyDonHang @MaDon = 1022;                 -- ✅ đơn Moi -> hủy được
SELECT MaSach, SoLuongTon FROM Sach
WHERE MaSach IN (SELECT MaSach FROM ChiTietDonHang WHERE MaDonHang = 1022);
GO
EXEC sp_HuyDonHang @MaDon = 1022;                 -- ❌ 50011 đã hủy rồi
GO
EXEC sp_HuyDonHang @MaDon = 1000;                 -- ❌ 50012 đơn HoanThanh
GO
EXEC sp_HuyDonHang @MaDon = 99999;                -- ❌ 50010 không tồn tại
GO


/* ---------------------- 5.2. sp_ChuyenKho ---------------------- */

CREATE OR ALTER PROCEDURE sp_ChuyenKho
    @MaSachTu  INT,
    @MaSachDen INT,
    @SoLuong   INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @SoLuong <= 0 THROW 50020, N'Số lượng phải lớn hơn 0.', 1;
    IF @MaSachTu = @MaSachDen THROW 50021, N'Nguồn và đích phải khác nhau.', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

            -- ⚠️ QUAN TRỌNG: khóa theo THỨ TỰ CỐ ĐỊNH (mã nhỏ trước) để tránh deadlock
            DECLARE @Ma1 INT = IIF(@MaSachTu < @MaSachDen, @MaSachTu, @MaSachDen);
            DECLARE @Ma2 INT = IIF(@MaSachTu < @MaSachDen, @MaSachDen, @MaSachTu);

            DECLARE @Dummy INT;
            SELECT @Dummy = SoLuongTon FROM Sach WITH (UPDLOCK) WHERE MaSach = @Ma1;
            SELECT @Dummy = SoLuongTon FROM Sach WITH (UPDLOCK) WHERE MaSach = @Ma2;

            IF NOT EXISTS (SELECT 1 FROM Sach WHERE MaSach = @MaSachTu)
                THROW 50022, N'Sách nguồn không tồn tại.', 1;
            IF NOT EXISTS (SELECT 1 FROM Sach WHERE MaSach = @MaSachDen)
                THROW 50023, N'Sách đích không tồn tại.', 1;

            -- Trừ kho có điều kiện — nếu không đủ, @@ROWCOUNT = 0
            UPDATE Sach SET SoLuongTon = SoLuongTon - @SoLuong
            WHERE MaSach = @MaSachTu AND SoLuongTon >= @SoLuong;

            IF @@ROWCOUNT = 0 THROW 50024, N'Kho nguồn không đủ hàng.', 1;

            UPDATE Sach SET SoLuongTon = SoLuongTon + @SoLuong WHERE MaSach = @MaSachDen;

        COMMIT TRANSACTION;
        SELECT MaSach, TenSach, SoLuongTon FROM Sach WHERE MaSach IN (@MaSachTu, @MaSachDen);
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

EXEC sp_ChuyenKho @MaSachTu = 13, @MaSachDen = 8, @SoLuong = 20;      -- ✅
GO
EXEC sp_ChuyenKho @MaSachTu = 16, @MaSachDen = 8, @SoLuong = 99999;   -- ❌ 50024 không đủ
GO
EXEC sp_ChuyenKho @MaSachTu = 13, @MaSachDen = 9999, @SoLuong = 1;    -- ❌ 50023 sách đích không tồn tại
GO


/* ---------------------- 5.3. Index cho truy vấn theo dải thời gian ----------

   Truy vấn:  WHERE ThoiGian BETWEEN ? AND ? AND HanhDong = ?

   THỨ TỰ CỘT ĐÚNG: (HanhDong, ThoiGian)   ← KHÔNG phải (ThoiGian, HanhDong)

   LÝ DO — quy tắc ESR (Equality, Sort, Range):
     * HanhDong lọc bằng dấu '='  -> đặt TRƯỚC
     * ThoiGian lọc theo DẢI      -> đặt SAU

   Nếu đảo ngược thành (ThoiGian, HanhDong): index được sắp theo ThoiGian trước,
   nên khi tìm một dải thời gian, các giá trị HanhDong nằm RẢI RÁC khắp dải đó
   -> SQL Server phải đọc toàn bộ dải rồi lọc thủ công.
   Với (HanhDong, ThoiGian): nhảy thẳng tới đúng nhóm HanhDong, trong nhóm đó
   các bản ghi ĐÃ SẮP THEO ThoiGian -> đọc đúng một đoạn liên tục.
   ---------------------------------------------------------------------- */

-- ⚠️ Phần này cần bảng LogTruyCap — chạy thuc-hanh/bai-tap-buoi-08.sql (Phần 1) trước.
IF OBJECT_ID('LogTruyCap') IS NULL
BEGIN
    PRINT N'>>> BỎ QUA phần 5.3: chưa có bảng LogTruyCap.';
END
ELSE
BEGIN
    DROP INDEX IF EXISTS IX_Log_Sai  ON LogTruyCap;
    DROP INDEX IF EXISTS IX_Log_Dung ON LogTruyCap;
END
GO

IF OBJECT_ID('LogTruyCap') IS NOT NULL
BEGIN
    EXEC('CREATE NONCLUSTERED INDEX IX_Log_Sai  ON LogTruyCap (ThoiGian, HanhDong)');
    EXEC('CREATE NONCLUSTERED INDEX IX_Log_Dung ON LogTruyCap (HanhDong, ThoiGian)');
END
GO

SET STATISTICS IO ON;

IF OBJECT_ID('LogTruyCap') IS NOT NULL
BEGIN
    -- Ép dùng index SAI
    SELECT COUNT(*) AS DungIndexSai FROM LogTruyCap WITH (INDEX(IX_Log_Sai))
    WHERE ThoiGian BETWEEN DATEADD(DAY,-30,GETDATE()) AND GETDATE()
      AND HanhDong = N'ThanhToan';

    -- Ép dùng index ĐÚNG — so sánh logical reads
    SELECT COUNT(*) AS DungIndexDung FROM LogTruyCap WITH (INDEX(IX_Log_Dung))
    WHERE ThoiGian BETWEEN DATEADD(DAY,-30,GETDATE()) AND GETDATE()
      AND HanhDong = N'ThanhToan';
END

SET STATISTICS IO OFF;
GO


/* ---------------------- 5.4. sp_ThanhToanDonHang ---------------------- */

-- Bảng log để ghi lại thao tác
IF OBJECT_ID('LogThanhToan') IS NULL
CREATE TABLE LogThanhToan (
    MaLog     INT IDENTITY(1,1) PRIMARY KEY,
    MaDonHang INT NOT NULL,
    SoTien    DECIMAL(14,2) NOT NULL,
    DiemCong  INT NOT NULL,
    ThoiGian  DATETIME2(0) NOT NULL DEFAULT SYSDATETIME()
);
GO

CREATE OR ALTER PROCEDURE sp_ThanhToanDonHang
    @MaDon       INT,
    @PhuongThuc  NVARCHAR(30)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

            DECLARE @TrangThai NVARCHAR(20), @MaKH INT, @TongTien DECIMAL(14,2), @Diem INT;

            SELECT @TrangThai = TrangThai, @MaKH = MaKH
            FROM DonHang WITH (UPDLOCK) WHERE MaDonHang = @MaDon;

            IF @TrangThai IS NULL      THROW 50030, N'Đơn hàng không tồn tại.', 1;
            IF @TrangThai <> N'Moi'    THROW 50031, N'Chỉ thanh toán được đơn ở trạng thái Moi.', 1;
            IF @PhuongThuc NOT IN (N'COD', N'ChuyenKhoan', N'The', N'ViDienTu')
                                        THROW 50032, N'Phương thức thanh toán không hợp lệ.', 1;

            SELECT @TongTien = SUM(SoLuong * DonGia * (1 - GiamGia))
            FROM ChiTietDonHang WHERE MaDonHang = @MaDon;

            IF @TongTien IS NULL THROW 50033, N'Đơn hàng không có dòng chi tiết nào.', 1;

            SET @Diem = CAST(@TongTien / 10000 AS INT);   -- 1 điểm / 10.000đ

            UPDATE DonHang
            SET TrangThai = N'DangGiao', PhuongThucTT = @PhuongThuc
            WHERE MaDonHang = @MaDon;

            UPDATE KhachHang SET DiemTichLuy = DiemTichLuy + @Diem WHERE MaKH = @MaKH;

            INSERT INTO LogThanhToan (MaDonHang, SoTien, DiemCong)
            VALUES (@MaDon, @TongTien, @Diem);

        COMMIT TRANSACTION;
        SELECT @MaDon AS MaDon, @TongTien AS SoTien, @Diem AS DiemDaCong;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

/* --- 4 TEST CASE ---
   ⚠️ Chạy trên dữ liệu vừa nạp mới (1022, 1023, 1024 đang ở trạng thái Moi).
   Thứ tự kiểm tra trong thủ tục: tồn tại -> trạng thái -> phương thức.
   Nên TC lỗi phải chọn đơn còn ở trạng thái hợp lệ thì mới chạm tới lỗi phương thức.

   ⚠️ Thủ tục dùng SET XACT_ABORT ON, nên một lỗi sẽ HỦY CẢ BATCH.
   Vì vậy mỗi test case phải nằm trong một batch riêng — chú ý các dấu GO. */

-- TC1 ❌ thất bại: đơn không tồn tại  -> Msg 50030
EXEC sp_ThanhToanDonHang @MaDon = 99999, @PhuongThuc = N'The';
GO

-- TC2 ❌ thất bại: phương thức không hợp lệ (đơn 1023 vẫn ở trạng thái Moi) -> Msg 50032
EXEC sp_ThanhToanDonHang @MaDon = 1023, @PhuongThuc = N'TienAo';
GO

-- TC3 ✅ thành công: đơn 1023, phương thức hợp lệ -> điểm khách phải tăng
SELECT MaKH, DiemTichLuy FROM KhachHang WHERE MaKH = 13;
EXEC sp_ThanhToanDonHang @MaDon = 1023, @PhuongThuc = N'The';
SELECT MaKH, DiemTichLuy FROM KhachHang WHERE MaKH = 13;
GO

-- TC4 ❌ thất bại: chạy lại TC3, đơn đã chuyển sang DangGiao -> Msg 50031
EXEC sp_ThanhToanDonHang @MaDon = 1023, @PhuongThuc = N'The';
GO


/* ---------------------- 5.5. Sinh script DROP index vô dụng ---------------------- */
SELECT 'DROP INDEX ' + QUOTENAME(i.name) + ' ON '
       + QUOTENAME(SCHEMA_NAME(o.schema_id)) + '.' + QUOTENAME(o.name) + ';' AS ScriptDeXuat,
       ISNULL(us.user_updates, 0) AS ChiPhiGhi
FROM sys.indexes i
JOIN sys.objects o ON i.object_id = o.object_id
LEFT JOIN sys.dm_db_index_usage_stats us
       ON i.object_id = us.object_id AND i.index_id = us.index_id
WHERE o.type = 'U' AND i.type_desc = 'NONCLUSTERED'
  AND i.is_primary_key = 0 AND i.is_unique_constraint = 0
  AND ISNULL(us.user_seeks,0) + ISNULL(us.user_scans,0) + ISNULL(us.user_lookups,0) = 0
ORDER BY ChiPhiGhi DESC;
GO


/* =====================================================================
   BÀI TẬP VỀ NHÀ — GIẢI THÍCH LÝ THUYẾT
   ===================================================================== */

/* Bài 3. Vì sao READ COMMITTED vẫn cho Non-repeatable Read?

   READ COMMITTED chỉ đảm bảo: không đọc dữ liệu CHƯA COMMIT.
   Nó KHÔNG giữ khóa đọc sau khi câu SELECT kết thúc.
   Nên giữa hai lần SELECT trong cùng giao dịch, giao dịch khác hoàn toàn có thể
   COMMIT một thay đổi, và lần đọc thứ hai sẽ thấy giá trị mới.

   SCRIPT CHỨNG MINH — 2 cửa sổ:

   🪟 CỬA SỔ 1:
       SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
       BEGIN TRANSACTION;
       SELECT SoDu FROM TaiKhoan WHERE MaTK = 'A';     -- lần 1: 5.000.000
       WAITFOR DELAY '00:00:10';
       SELECT SoDu FROM TaiKhoan WHERE MaTK = 'A';     -- lần 2: 4.000.000 (!)
       COMMIT;

   🪟 CỬA SỔ 2 — chạy trong 10 giây chờ:
       UPDATE TaiKhoan SET SoDu = SoDu - 1000000 WHERE MaTK = 'A';

   ➜ Cùng một giao dịch, cùng một câu lệnh, hai kết quả khác nhau.
     Đổi cửa sổ 1 sang REPEATABLE READ -> cửa sổ 2 sẽ BỊ TREO cho tới khi
     cửa sổ 1 commit -> hai lần đọc giống nhau.
*/

/* Bài 4. Website bán vé xem phim — chọn mức cô lập nào?

   VẤN ĐỀ: chống bán trùng ghế. Đây là bài toán "kiểm tra rồi ghi".

   ĐÁP ÁN THỰC TẾ TỐT NHẤT: KHÔNG dựa vào mức cô lập cao, mà dựa vào
   RÀNG BUỘC + GHI CÓ ĐIỀU KIỆN:

       -- UNIQUE constraint làm trọng tài cuối cùng
       CONSTRAINT UQ_Ghe UNIQUE (MaSuatChieu, MaGhe)

       -- Ghi có điều kiện, không đọc-rồi-ghi
       INSERT INTO VeDaBan (MaSuatChieu, MaGhe, MaKH)
       SELECT @Suat, @Ghe, @KH
       WHERE NOT EXISTS (SELECT 1 FROM VeDaBan WHERE MaSuatChieu=@Suat AND MaGhe=@Ghe);
       IF @@ROWCOUNT = 0 THROW 50040, N'Ghế đã có người đặt.', 1;

   Với cách này, READ COMMITTED (mặc định) là ĐỦ, và hệ thống vẫn chịu tải cao.

   NẾU BẮT BUỘC dùng mức cô lập: chọn SERIALIZABLE cho riêng thủ tục đặt vé.
   ĐÁNH ĐỔI: an toàn tuyệt đối nhưng giữ khóa dải (range lock), thông lượng giảm
   mạnh khi nhiều người cùng đặt một suất chiếu hot — đúng lúc ta cần hiệu năng nhất.

   ➜ BÀI HỌC CHUNG: mức cô lập là công cụ CUỐI CÙNG. Ưu tiên (1) ràng buộc CSDL,
     (2) ghi có điều kiện, (3) khóa lạc quan (rowversion), rồi mới đến (4) nâng
     mức cô lập.
*/
GO
