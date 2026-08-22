/**
 * Project 1 — Điểm khởi động.
 *
 * Nhiệm vụ: đọc cấu hình, dựng các tầng, mở cổng, và tắt tử tế.
 *
 * Chạy:  npm start   (hoặc npm run dev để tự khởi động lại khi sửa code)
 */

import http from 'node:http';

import { config } from './config.js';
import { taoLogger } from './lib/logger.js';
import { taoRepository } from './todos/todo.repository.js';
import { taoService } from './todos/todo.service.js';
import { taoApp } from './app.js';

const logger = taoLogger(config.logLevel);

let dangTat = false;
let soRequestDangChay = 0;

// ── Dựng các tầng: repository → service → app ───────────────────
// Đây là Dependency Injection làm bằng tay. Ở buổi 28 ta thấy
// NestJS tự động hoá đúng việc này.
const repo = taoRepository(config.dataFile);
const soTodoDaNap = await repo.nap();

const service = taoService(repo);
const app = taoApp({
  service,
  logger,
  bodyLimit: config.bodyLimit,
  dangTat: () => dangTat,
});

// ── Server ──────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  soRequestDangChay++;
  try {
    await app.xuLy(req, res);
  } finally {
    soRequestDangChay--;
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Cổng ${config.port} đang bị chiếm`, { goiY: 'Đổi PORT hoặc tắt tiến trình cũ' });
    process.exit(1);
  }
  throw err;
});

// ── Graceful shutdown (buổi 08) ─────────────────────────────────
async function tatTuTe(tinHieu) {
  if (dangTat) {
    logger.warn('Nhận tín hiệu lần hai — thoát ngay');
    process.exit(1);
  }
  dangTat = true;
  logger.info('Bắt đầu tắt tử tế', { tinHieu, soRequestDangChay });

  const hanChot = setTimeout(() => {
    logger.error('Quá hạn chờ — ép thoát');
    process.exit(1);
  }, config.shutdownTimeoutMs);
  hanChot.unref();

  server.close();
  server.closeIdleConnections();

  while (soRequestDangChay > 0) {
    await new Promise((r) => setTimeout(r, 100));
  }

  // Quan trọng: chờ mọi lần ghi file đang chờ hoàn tất trước khi thoát,
  // nếu không sẽ mất todo vừa tạo.
  await repo.doiGhiXong();

  clearTimeout(hanChot);
  logger.info('Đã thoát sạch sẽ');
  process.exitCode = 0;
}

process.on('SIGTERM', () => tatTuTe('SIGTERM'));
process.on('SIGINT', () => tatTuTe('SIGINT'));

// Windows không cho gửi tín hiệu từ tiến trình khác → dùng IPC để test tự động
if (process.send) {
  process.on('message', (msg) => {
    if (msg === 'shutdown') tatTuTe('IPC').then(() => process.disconnect());
  });
}

// Lưới an toàn cấp tiến trình (buổi 07): ghi log rồi THOÁT, không chạy tiếp
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { thongDiep: err.message, stack: err.stack });
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  logger.error('unhandledRejection', { thongDiep: err?.message });
  process.exit(1);
});

server.listen(config.port, () => {
  logger.info('Server đã sẵn sàng', {
    url: `http://localhost:${config.port}`,
    soTodoDaNap,
    soRoute: app.danhSachRoute.length,
  });
});
