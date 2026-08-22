/**
 * Điểm khởi động — gần như GIỮ NGUYÊN từ Project 1.
 *
 * Điểm dạy quan trọng: Express KHÔNG lo graceful shutdown.
 * app.listen() trả về một http.Server bình thường, và toàn bộ
 * logic tắt tử tế của buổi 08 vẫn áp dụng y nguyên.
 */

import { config } from './config.js';
import { taoLogger } from './lib/logger.js';
import { taoRepository } from './todos/todo.repository.js';
import { taoService } from './todos/todo.service.js';
import { taoApp } from './app.js';

const logger = taoLogger(config.logLevel);

const repo = taoRepository(config.dataFile);
const soTodoDaNap = await repo.nap();
const service = taoService(repo);

const app = taoApp({ service, logger, bodyLimit: config.bodyLimit });

// app.listen() trả về http.Server — đúng đối tượng ta đã dùng ở Phase 1
const server = app.listen(config.port, () => {
  logger.info('Server đã sẵn sàng', {
    url: `http://localhost:${config.port}`,
    soTodoDaNap,
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`Cổng ${config.port} đang bị chiếm`);
    process.exit(1);
  }
  throw err;
});

// ── Graceful shutdown — COPY NGUYÊN XI từ buổi 08 ────────────────
let dangTat = false;

async function tatTuTe(tinHieu) {
  if (dangTat) process.exit(1);
  dangTat = true;
  logger.info('Bắt đầu tắt tử tế', { tinHieu });

  const hanChot = setTimeout(() => {
    logger.error('Quá hạn chờ — ép thoát');
    process.exit(1);
  }, config.shutdownTimeoutMs);
  hanChot.unref();

  server.close();
  server.closeIdleConnections();
  await repo.doiGhiXong();

  clearTimeout(hanChot);
  logger.info('Đã thoát sạch sẽ');
  process.exitCode = 0;
}

process.on('SIGTERM', () => tatTuTe('SIGTERM'));
process.on('SIGINT', () => tatTuTe('SIGINT'));

if (process.send) {
  process.on('message', (m) => {
    if (m === 'shutdown') tatTuTe('IPC').then(() => process.disconnect());
  });
}

process.on('uncaughtException', (err) => {
  logger.error('uncaughtException', { thongDiep: err.message, stack: err.stack });
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  logger.error('unhandledRejection', { thongDiep: err?.message });
  process.exit(1);
});
