/**
 * Buổi 14 — Kết nối MongoDB bằng Mongoose.
 */

import 'node:process';
import mongoose from 'mongoose';

export async function ketNoi() {
  const url = process.env.MONGO_URL;
  if (!url) throw new Error('Thiếu MONGO_URL — copy .env.example thành .env');

  // Mongoose tự quản connection pool, y như Prisma.
  // Cũng chỉ nên gọi MỘT LẦN cho cả ứng dụng.
  await mongoose.connect(url, {
    serverSelectionTimeoutMS: 5000, // đừng treo mãi nếu Mongo chưa chạy
  });

  console.log('✅ Đã kết nối MongoDB\n');
  return mongoose.connection;
}

export async function dongKetNoi() {
  await mongoose.disconnect();
}
