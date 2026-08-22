import express from 'express';
import { HttpError } from './lib/errors.js';
import { taoAuthRouter } from './auth/auth.routes.js';

export function taoApp({ logger = console } = {}) {
  const app = express();
  app.use(express.json({ limit: 1024 * 100 }));

  app.get('/health', (req, res) => res.json({ trangThai: 'ok' }));
  app.use('/auth', taoAuthRouter());

  app.use((req, res, next) => {
    next(new HttpError(404, `Không có đường dẫn ${req.method} ${req.originalUrl}`));
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ loi: 'Body không phải JSON hợp lệ' });
    }
    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({
        loi: err.message,
        ...(err.chiTiet ? { chiTiet: err.chiTiet } : {}),
      });
    }
    logger.error?.('Lỗi không mong đợi', err);
    res.status(500).json({ loi: 'Lỗi máy chủ nội bộ' });
  });

  return app;
}
