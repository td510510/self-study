/**
 * Buổi 12 — Khởi tạo Prisma Client dùng chung.
 *
 * ⚠️ CHỈ TẠO MỘT INSTANCE cho cả ứng dụng.
 * Mỗi PrismaClient mở một CONNECTION POOL riêng. Tạo nhiều instance
 * = mở quá nhiều kết nối = Postgres từ chối (mặc định tối đa 100).
 * Đây là lỗi phổ biến nhất của người mới dùng Prisma.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  throw new Error('Thiếu DATABASE_URL — copy .env.example thành .env');
}

// Prisma 7: cần "adapter" để nói chuyện trực tiếp với database.
// PrismaPg dùng thư viện `pg` bên dưới và tự quản connection pool.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  // Bật log query để HỌC — thấy được Prisma sinh ra SQL gì.
  // Ở production thì tắt đi (quá nhiều log).
  log: process.env.PRISMA_LOG === 'query' ? ['query'] : ['warn', 'error'],
});

/** Đóng kết nối khi tắt server — bước 4 của graceful shutdown (buổi 08). */
export async function dongKetNoi() {
  await prisma.$disconnect();
}
