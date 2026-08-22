/* =====================================================================
   BookStore — Lược đồ CSDL dùng xuyên suốt khóa học
   Hệ quản trị: Microsoft SQL Server 2022
   Cách chạy   : Mở file trong SSMS -> F5
                 hoặc: sqlcmd -S localhost -E -i 00-schema-bookstore.sql
   ===================================================================== */

-- Nếu CSDL đã tồn tại thì xóa để tạo lại từ đầu
IF DB_ID('BookStore') IS NOT NULL
BEGIN
    ALTER DATABASE BookStore SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE BookStore;
END
GO

CREATE DATABASE BookStore;
GO

USE BookStore;
GO

/* ---------------------------------------------------------------------
   1. DanhMuc — có liên kết đệ quy để làm danh mục nhiều cấp
   --------------------------------------------------------------------- */
CREATE TABLE DanhMuc (
    MaDanhMuc     INT IDENTITY(1,1) NOT NULL,
    TenDanhMuc    NVARCHAR(100)     NOT NULL,
    MaDanhMucCha  INT               NULL,
    MoTa          NVARCHAR(500)     NULL,
    CONSTRAINT PK_DanhMuc      PRIMARY KEY (MaDanhMuc),
    CONSTRAINT UQ_DanhMuc_Ten  UNIQUE (TenDanhMuc),
    CONSTRAINT FK_DanhMuc_Cha  FOREIGN KEY (MaDanhMucCha)
        REFERENCES DanhMuc(MaDanhMuc)
);
GO

/* ---------------------------------------------------------------------
   2. TacGia
   --------------------------------------------------------------------- */
CREATE TABLE TacGia (
    MaTacGia  INT IDENTITY(1,1) NOT NULL,
    HoTen     NVARCHAR(150)     NOT NULL,
    QuocTich  NVARCHAR(60)      NULL,
    NamSinh   SMALLINT          NULL,
    TieuSu    NVARCHAR(MAX)     NULL,
    CONSTRAINT PK_TacGia        PRIMARY KEY (MaTacGia),
    CONSTRAINT CK_TacGia_NamSinh CHECK (NamSinh IS NULL OR NamSinh BETWEEN 1000 AND 2100)
);
GO

/* ---------------------------------------------------------------------
   3. Sach
   --------------------------------------------------------------------- */
CREATE TABLE Sach (
    MaSach      INT IDENTITY(1,1) NOT NULL,
    ISBN        VARCHAR(20)       NULL,
    TenSach     NVARCHAR(255)     NOT NULL,
    MaDanhMuc   INT               NOT NULL,
    GiaBan      DECIMAL(12,2)     NOT NULL,
    SoLuongTon  INT               NOT NULL CONSTRAINT DF_Sach_Ton DEFAULT 0,
    NamXuatBan  SMALLINT          NULL,
    NhaXuatBan  NVARCHAR(120)     NULL,
    SoTrang     INT               NULL,
    NgayTao     DATETIME2(0)      NOT NULL CONSTRAINT DF_Sach_NgayTao DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Sach            PRIMARY KEY (MaSach),
    CONSTRAINT UQ_Sach_ISBN       UNIQUE (ISBN),
    CONSTRAINT CK_Sach_GiaBan     CHECK (GiaBan > 0),
    CONSTRAINT CK_Sach_Ton        CHECK (SoLuongTon >= 0),
    CONSTRAINT CK_Sach_NamXB      CHECK (NamXuatBan IS NULL OR NamXuatBan BETWEEN 1400 AND 2100),
    CONSTRAINT FK_Sach_DanhMuc    FOREIGN KEY (MaDanhMuc) REFERENCES DanhMuc(MaDanhMuc)
);
GO

/* ---------------------------------------------------------------------
   4. Sach_TacGia — bảng trung gian N-N, có thuộc tính riêng (VaiTro)
   --------------------------------------------------------------------- */
CREATE TABLE Sach_TacGia (
    MaSach   INT          NOT NULL,
    MaTacGia INT          NOT NULL,
    VaiTro   NVARCHAR(30) NOT NULL CONSTRAINT DF_STG_VaiTro DEFAULT N'Tác giả',
    CONSTRAINT PK_Sach_TacGia PRIMARY KEY (MaSach, MaTacGia),
    CONSTRAINT FK_STG_Sach    FOREIGN KEY (MaSach)   REFERENCES Sach(MaSach)     ON DELETE CASCADE,
    CONSTRAINT FK_STG_TacGia  FOREIGN KEY (MaTacGia) REFERENCES TacGia(MaTacGia) ON DELETE CASCADE,
    CONSTRAINT CK_STG_VaiTro  CHECK (VaiTro IN (N'Tác giả', N'Đồng tác giả', N'Chủ biên', N'Dịch giả'))
);
GO

/* ---------------------------------------------------------------------
   5. KhachHang
   --------------------------------------------------------------------- */
CREATE TABLE KhachHang (
    MaKH        INT IDENTITY(1,1) NOT NULL,
    HoTen       NVARCHAR(100)     NOT NULL,
    Email       VARCHAR(150)      NOT NULL,
    SoDienThoai VARCHAR(15)       NULL,
    ThanhPho    NVARCHAR(60)      NULL,
    DiaChi      NVARCHAR(255)     NULL,
    NgayDangKy  DATE              NOT NULL CONSTRAINT DF_KH_NgayDK DEFAULT CAST(SYSDATETIME() AS DATE),
    DiemTichLuy INT               NOT NULL CONSTRAINT DF_KH_Diem   DEFAULT 0,
    CONSTRAINT PK_KhachHang    PRIMARY KEY (MaKH),
    CONSTRAINT UQ_KhachHang_Email UNIQUE (Email),
    CONSTRAINT CK_KH_Email     CHECK (Email LIKE '%_@_%._%'),
    CONSTRAINT CK_KH_Diem      CHECK (DiemTichLuy >= 0)
);
GO

/* ---------------------------------------------------------------------
   6. DonHang
   --------------------------------------------------------------------- */
CREATE TABLE DonHang (
    MaDonHang    INT IDENTITY(1000,1) NOT NULL,
    MaKH         INT           NOT NULL,
    NgayDat      DATETIME2(0)  NOT NULL CONSTRAINT DF_DH_NgayDat DEFAULT SYSDATETIME(),
    TrangThai    NVARCHAR(20)  NOT NULL CONSTRAINT DF_DH_TrangThai DEFAULT N'Moi',
    PhuongThucTT NVARCHAR(30)  NOT NULL CONSTRAINT DF_DH_PTTT      DEFAULT N'COD',
    PhiVanChuyen DECIMAL(12,2) NOT NULL CONSTRAINT DF_DH_Phi       DEFAULT 0,
    CONSTRAINT PK_DonHang         PRIMARY KEY (MaDonHang),
    CONSTRAINT FK_DonHang_KH      FOREIGN KEY (MaKH) REFERENCES KhachHang(MaKH),
    CONSTRAINT CK_DH_TrangThai    CHECK (TrangThai IN (N'Moi', N'DangGiao', N'HoanThanh', N'Huy')),
    CONSTRAINT CK_DH_PTTT         CHECK (PhuongThucTT IN (N'COD', N'ChuyenKhoan', N'The', N'ViDienTu')),
    CONSTRAINT CK_DH_Phi          CHECK (PhiVanChuyen >= 0)
);
GO

/* ---------------------------------------------------------------------
   7. ChiTietDonHang — bảng trung gian N-N
      DonGia được LƯU LẠI (snapshot) vì giá sách có thể đổi về sau
   --------------------------------------------------------------------- */
CREATE TABLE ChiTietDonHang (
    MaDonHang INT           NOT NULL,
    MaSach    INT           NOT NULL,
    SoLuong   INT           NOT NULL,
    DonGia    DECIMAL(12,2) NOT NULL,
    GiamGia   DECIMAL(4,2)  NOT NULL CONSTRAINT DF_CTDH_GiamGia DEFAULT 0,  -- 0.10 = giảm 10%
    CONSTRAINT PK_ChiTietDonHang PRIMARY KEY (MaDonHang, MaSach),
    CONSTRAINT FK_CTDH_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang) ON DELETE CASCADE,
    CONSTRAINT FK_CTDH_Sach    FOREIGN KEY (MaSach)    REFERENCES Sach(MaSach),
    CONSTRAINT CK_CTDH_SoLuong CHECK (SoLuong > 0),
    CONSTRAINT CK_CTDH_DonGia  CHECK (DonGia >= 0),
    CONSTRAINT CK_CTDH_GiamGia CHECK (GiamGia BETWEEN 0 AND 1)
);
GO

/* ---------------------------------------------------------------------
   8. DanhGia — mỗi khách chỉ đánh giá 1 lần cho 1 cuốn sách
   --------------------------------------------------------------------- */
CREATE TABLE DanhGia (
    MaDanhGia   INT IDENTITY(1,1) NOT NULL,
    MaSach      INT           NOT NULL,
    MaKH        INT           NOT NULL,
    SoSao       TINYINT       NOT NULL,
    BinhLuan    NVARCHAR(1000) NULL,
    NgayDanhGia DATETIME2(0)  NOT NULL CONSTRAINT DF_DG_Ngay DEFAULT SYSDATETIME(),
    CONSTRAINT PK_DanhGia      PRIMARY KEY (MaDanhGia),
    CONSTRAINT UQ_DanhGia_1Lan UNIQUE (MaSach, MaKH),
    CONSTRAINT FK_DanhGia_Sach FOREIGN KEY (MaSach) REFERENCES Sach(MaSach) ON DELETE CASCADE,
    CONSTRAINT FK_DanhGia_KH   FOREIGN KEY (MaKH)   REFERENCES KhachHang(MaKH),
    CONSTRAINT CK_DanhGia_Sao  CHECK (SoSao BETWEEN 1 AND 5)
);
GO

PRINT N'>>> Đã tạo xong lược đồ BookStore (8 bảng).';
GO

-- Xem lại toàn bộ khóa ngoại vừa tạo
SELECT
    fk.name                              AS TenRangBuoc,
    OBJECT_NAME(fk.parent_object_id)     AS BangCon,
    OBJECT_NAME(fk.referenced_object_id) AS BangCha
FROM sys.foreign_keys AS fk
ORDER BY BangCon, TenRangBuoc;
GO
