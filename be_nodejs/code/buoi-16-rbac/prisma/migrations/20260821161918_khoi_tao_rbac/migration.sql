-- CreateEnum
CREATE TYPE "VaiTro" AS ENUM ('user', 'bienTap', 'admin');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "ten" TEXT NOT NULL,
    "matKhauHash" TEXT NOT NULL,
    "vaiTro" "VaiTro" NOT NULL DEFAULT 'user',
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
CREATE TABLE "bai_viets" (
    "id" SERIAL NOT NULL,
    "tieuDe" TEXT NOT NULL,
    "noiDung" TEXT NOT NULL,
    "daDang" BOOLEAN NOT NULL DEFAULT false,
    "tacGiaId" INTEGER NOT NULL,
    "taoLuc" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "suaLuc" TIMESTAMP(3),

    CONSTRAINT "bai_viets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "bai_viets_tacGiaId_idx" ON "bai_viets"("tacGiaId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bai_viets" ADD CONSTRAINT "bai_viets_tacGiaId_fkey" FOREIGN KEY ("tacGiaId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
