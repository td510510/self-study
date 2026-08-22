/**
 * Ráp ứng dụng — chuỗi middleware được sắp xếp có chủ đích.
 *
 * THỨ TỰ Ở ĐÂY KHÔNG PHẢI NGẪU NHIÊN. Đọc từ trên xuống chính là
 * đọc vòng đời một request.
 */

import express from 'express';
import { HttpError } from './lib/errors.js';
import { requestId, rateLimit, timeout, logRequest, chiChapNhanJson } from './lib/middlewares.js';
import { taoTodoRouter } from './todos/todo.routes.js';

export function taoApp({ service, logger, bodyLimit, gioiHanRate }) {
  const app = express();

  // 1. requestId TRƯỚC TIÊN — để mọi log phía sau đều có id
  app.use(requestId());

  // 2. log ngay sau đó — để đo được cả thời gian của các middleware phía dưới
  app.use(logRequest(logger));

  // 3. timeout — đặt sớm để bao trùm toàn bộ phần còn lại
  app.use(timeout(10_000));

  // 4. rate limit TRƯỚC khi parse body —
  //    chặn kẻ tấn công TRƯỚC khi tốn công đọc 1MB dữ liệu của họ
  app.use(rateLimit(gioiHanRate));

  // 5. kiểm tra Content-Type trước khi parse
  app.use(chiChapNhanJson());

  // 6. parse body
  app.use(express.json({ limit: bodyLimit }));

  // 7. route
  app.get('/health', (req, res) => {
    res.json({ trangThai: 'ok', thoiGianChay: Math.round(process.uptime()) });
  });
  app.use('/todos', taoTodoRouter(service));

  // 8. không route nào khớp
  app.use((req, res, next) => {
    next(new HttpError(404, `Không có đường dẫn ${req.method} ${req.originalUrl}`));
  });

  // 9. error middleware — LUÔN Ở CUỐI CÙNG
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ loi: 'Body không phải JSON hợp lệ' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ loi: `Body vượt quá giới hạn ${bodyLimit}` });
    }

    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({
        loi: err.message,
        ...(err.chiTiet ? { chiTiet: err.chiTiet } : {}),
        requestId: req.id, // ← để người dùng báo lỗi kèm mã này, ta tra log ra ngay
      });
    }

    logger.error('Lỗi không mong đợi', {
      id: req.id,
      thongDiep: err.message,
      stack: err.stack,
    });
    res.status(500).json({ loi: 'Lỗi máy chủ nội bộ', requestId: req.id });
  });

  return app;
}
