-- CreateEnum
CREATE TYPE "VaiTro" AS ENUM ('khach', 'nhanVien', 'admin');

-- CreateEnum
CREATE TYPE "TrangThaiDon" AS ENUM ('choXacNhan', 'daXacNhan', 'dangGiao', 'daGiao', 'daHuy');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "matKhauHash" TEXT NOT NULL,
    "vaiTro" "VaiTro" NOT NULL DEFAULT 'khach',
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "hetHanLuc" TIMESTAMP(3) NOT NULL,
    "thuHoiLuc" TIMESTAMP(3),
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "danh_mucs" (
    "id" SERIAL NOT NULL,
    "ten" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "danh_mucs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "san_phams" (
    "id" SERIAL NOT NULL,
    "ten" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "moTa" TEXT,
    "giaVND" INTEGER NOT NULL,
    "tonKho" INTEGER NOT NULL DEFAULT 0,
    "conBan" BOOLEAN NOT NULL DEFAULT true,
    "danhMucId" INTEGER NOT NULL,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suaLuc" TIMESTAMP(3),

    CONSTRAINT "san_phams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gio_hangs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "suaLuc" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gio_hangs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gio_hang_items" (
    "id" SERIAL NOT NULL,
    "gioHangId" INTEGER NOT NULL,
    "sanPhamId" INTEGER NOT NULL,
    "soLuong" INTEGER NOT NULL,

    CONSTRAINT "gio_hang_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "don_hangs" (
    "id" SERIAL NOT NULL,
    "maDon" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "trangThai" "TrangThaiDon" NOT NULL DEFAULT 'choXacNhan',
    "tongTienVND" INTEGER NOT NULL,
    "diaChiGiao" TEXT NOT NULL,
    "soDienThoai" TEXT NOT NULL,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suaLuc" TIMESTAMP(3),

    CONSTRAINT "don_hangs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "don_hang_items" (
    "id" SERIAL NOT NULL,
    "donHangId" INTEGER NOT NULL,
    "sanPhamId" INTEGER NOT NULL,
    "tenSanPham" TEXT NOT NULL,
    "giaVND" INTEGER NOT NULL,
    "soLuong" INTEGER NOT NULL,

    CONSTRAINT "don_hang_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "danh_mucs_slug_key" ON "danh_mucs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "san_phams_slug_key" ON "san_phams"("slug");

-- CreateIndex
CREATE INDEX "san_phams_danhMucId_idx" ON "san_phams"("danhMucId");

-- CreateIndex
CREATE INDEX "san_phams_conBan_idx" ON "san_phams"("conBan");

-- CreateIndex
CREATE UNIQUE INDEX "gio_hangs_userId_key" ON "gio_hangs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "gio_hang_items_gioHangId_sanPhamId_key" ON "gio_hang_items"("gioHangId", "sanPhamId");

-- CreateIndex
CREATE UNIQUE INDEX "don_hangs_maDon_key" ON "don_hangs"("maDon");

-- CreateIndex
CREATE INDEX "don_hangs_userId_idx" ON "don_hangs"("userId");

-- CreateIndex
CREATE INDEX "don_hangs_trangThai_idx" ON "don_hangs"("trangThai");

-- CreateIndex
CREATE INDEX "don_hang_items_donHangId_idx" ON "don_hang_items"("donHangId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "san_phams" ADD CONSTRAINT "san_phams_danhMucId_fkey" FOREIGN KEY ("danhMucId") REFERENCES "danh_mucs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gio_hangs" ADD CONSTRAINT "gio_hangs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gio_hang_items" ADD CONSTRAINT "gio_hang_items_gioHangId_fkey" FOREIGN KEY ("gioHangId") REFERENCES "gio_hangs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gio_hang_items" ADD CONSTRAINT "gio_hang_items_sanPhamId_fkey" FOREIGN KEY ("sanPhamId") REFERENCES "san_phams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "don_hangs" ADD CONSTRAINT "don_hangs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "don_hang_items" ADD CONSTRAINT "don_hang_items_donHangId_fkey" FOREIGN KEY ("donHangId") REFERENCES "don_hangs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "don_hang_items" ADD CONSTRAINT "don_hang_items_sanPhamId_fkey" FOREIGN KEY ("sanPhamId") REFERENCES "san_phams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
