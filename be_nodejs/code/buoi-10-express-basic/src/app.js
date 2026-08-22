/**
 * Ráp ứng dụng Express.
 *
 * So sánh với app.js của Project 1: ở đó ta tự viết vòng lặp tìm route,
 * tự bắt lỗi bằng try/catch, tự trả 404. Ở đây Express lo hết.
 */

import express from 'express';
import { HttpError } from './lib/errors.js';
import { taoTodoRouter } from './todos/todo.routes.js';

export function taoApp({ service, logger, bodyLimit }) {
  const app = express();

  // ── MIDDLEWARE TOÀN CỤC ─────────────────────────────────────
  // Thứ tự khai báo = thứ tự thực thi. Đây là ý niệm cốt lõi của Express.

  // 1. Parse JSON body — thay cho lib/body.js (50 dòng) ở Project 1
  app.use(express.json({ limit: bodyLimit }));

  // 2. Khôi phục hành vi 415 mà Project 1 có.
  //    express.json() chỉ LẶNG LẼ BỎ QUA request sai Content-Type,
  //    để req.body = undefined → ta sẽ nhận 400 thay vì 415.
  //    Đây là ví dụ cụ thể: framework không làm hộ tất cả,
  //    và mặc định của nó không phải lúc nào cũng là thứ ta muốn.
  app.use((req, res, next) => {
    const coBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
    const contentType = req.headers['content-type'] ?? '';

    if (coBody && !contentType.startsWith('application/json')) {
      return next(new HttpError(415,
        `Content-Type phải là application/json, nhận được: ${contentType || '(trống)'}`));
    }
    next();
  });

  // 3. Middleware tự viết: đo thời gian và log mỗi request.
  //    So với Project 1: ta phải nhét vào khối finally của handler chính.
  //    Ở đây nó là một middleware độc lập, dùng lại được ở mọi dự án.
  app.use((req, res, next) => {
    const batDau = process.hrtime.bigint();

    // res là EventEmitter — 'finish' phát ra khi response đã gửi xong.
    // Đây là cách duy nhất đo được thời gian THẬT, vì next() trả về ngay.
    res.on('finish', () => {
      const msec = Number(process.hrtime.bigint() - batDau) / 1e6;
      logger.info('request', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        msec: Number(msec.toFixed(1)),
      });
    });

    next(); // ⚠️ QUÊN next() = request treo mãi mãi, không lỗi, không phản hồi
  });

  // ── ROUTE ───────────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.json({ trangThai: 'ok', thoiGianChay: Math.round(process.uptime()) });
  });

  // Gắn router con vào tiền tố '/todos'.
  // Bên trong router, đường dẫn được viết TƯƠNG ĐỐI ('/', '/:id').
  app.use('/todos', taoTodoRouter(service));

  // ── 404: middleware KHÔNG có đường dẫn, đặt SAU mọi route ────
  // Request nào đi tới đây nghĩa là không route nào khớp.
  app.use((req, res, next) => {
    next(new HttpError(404, `Không có đường dẫn ${req.method} ${req.originalUrl}`));
  });

  // ── ERROR MIDDLEWARE: BỐN THAM SỐ (err, req, res, next) ──────
  // Express nhận diện error middleware bằng SỐ LƯỢNG THAM SỐ.
  // Viết thiếu `next` ở cuối → Express coi đây là middleware thường
  // → lỗi không bao giờ được xử lý. Bẫy rất hay gặp.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // Lỗi của chính express.json() khi body không phải JSON hợp lệ
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ loi: 'Body không phải JSON hợp lệ' });
    }
    // Lỗi của express.json() khi body vượt giới hạn
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ loi: `Body vượt quá giới hạn ${bodyLimit}` });
    }

    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({
        loi: err.message,
        ...(err.chiTiet ? { chiTiet: err.chiTiet } : {}),
      });
    }

    // Bug ngoài dự kiến: LOG ĐẦY ĐỦ cho mình, TRẢ TỐI THIỂU cho client
    logger.error('Lỗi không mong đợi', { thongDiep: err.message, stack: err.stack });
    res.status(500).json({ loi: 'Lỗi máy chủ nội bộ' });
  });

  return app;
}
