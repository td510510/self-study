/**
 * Project 2 — Điểm khởi động.
 */

import { taoApp } from './app.js';
import { taoLogger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';
import { taoRealtime, dongRealtime } from './lib/realtime.js';
import { dongRedis } from './lib/redis.js';

const PORT = Number(process.env.PORT ?? 3000);
const laDev = process.env.NODE_ENV !== 'production';

const logger = taoLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  pretty: laDev, // JSON thuần ở production để máy đọc
});

const app = taoApp({
  logger,
  origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((s) => s.trim()),
  // Tắt được rate limit để ĐO TẢI (buổi 44).
  // ⚠️ CHỈ dùng khi benchmark. Ở production luôn để bật.
  batRateLimit: process.env.BAT_RATE_LIMIT !== 'false',
});
const server = app.listen(PORT, () => {
  logger.info({ port: PORT, moiTruong: process.env.NODE_ENV }, 'Server đã sẵn sàng');

  // Báo cho PM2 biết tiến trình đã lắng nghe được (buổi 42).
  // ecosystem.config.cjs đặt wait_ready: true — nếu KHÔNG gửi tín hiệu này,
  // `pm2 reload` sẽ đứng chờ tới hết listen_timeout rồi mới chuyển traffic,
  // nghĩa là mỗi lần deploy chậm thêm vài giây một cách vô ích.
  process.send?.('ready');
});

// WebSocket dùng CHUNG http.Server với Express —
// không mở cổng thứ hai, không cần cấu hình proxy riêng.
taoRealtime(server, {
  origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((s) => s.trim()),
  logger,
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.fatal({ port: PORT }, 'Cổng đang bị chiếm');
    process.exit(1);
  }
  throw err;
});

// ── Graceful shutdown (buổi 08) ─────────────────────────────────
let dangTat = false;

async function tatTuTe(tinHieu) {
  if (dangTat) process.exit(1);
  dangTat = true;
  logger.info({ tinHieu }, 'Bắt đầu tắt tử tế');

  const hanChot = setTimeout(() => {
    logger.error('Quá hạn chờ — ép thoát');
    process.exit(1);
  }, 10_000);
  hanChot.unref();

  // Đóng WebSocket TRƯỚC — nếu không, các kết nối đang mở
  // giữ server.close() chờ mãi (bài học buổi 08).
  await dongRealtime();

  server.close();
  server.closeIdleConnections();
  await prisma.$disconnect();
  await dongRedis();

  clearTimeout(hanChot);
  logger.info('Đã thoát sạch sẽ');
  process.exitCode = 0;
}

process.on('SIGTERM', () => tatTuTe('SIGTERM'));
process.on('SIGINT', () => tatTuTe('SIGINT'));
if (process.send) {
  process.on('message', (m) => m === 'shutdown' && tatTuTe('IPC').then(() => process.disconnect()));
}

// Lưới an toàn (buổi 07): ghi log rồi THOÁT, không chạy tiếp
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException');
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  logger.fatal({ err }, 'unhandledRejection');
  process.exit(1);
});
