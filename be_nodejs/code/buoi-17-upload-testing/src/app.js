import express from 'express';
import multer from 'multer';
import { HttpError } from './lib/errors.js';
import { taoUploadRouter } from './upload/upload.routes.js';

export function taoApp({ thuMucLuu, logger = console } = {}) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ trangThai: 'ok' }));
  app.use('/upload', taoUploadRouter({ thuMucLuu }));

  app.use((req, res, next) => {
    next(new HttpError(404, `Không có đường dẫn ${req.method} ${req.originalUrl}`));
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // Lỗi riêng của multer có mã riêng — phải ánh xạ sang HTTP cho đúng
    if (err instanceof multer.MulterError) {
      const anhXa = {
        LIMIT_FILE_SIZE: [413, 'File vượt quá kích thước cho phép'],
        LIMIT_FILE_COUNT: [400, 'Quá nhiều file'],
        LIMIT_UNEXPECTED_FILE: [400, `Trường file không mong đợi: "${err.field}"`],
        LIMIT_FIELD_COUNT: [400, 'Quá nhiều trường dữ liệu'],
      };
      const [status, thongDiep] = anhXa[err.code] ?? [400, `Lỗi upload: ${err.code}`];
      return res.status(status).json({ loi: thongDiep });
    }

    if (err instanceof HttpError) {
      return res.status(err.statusCode).json({ loi: err.message });
    }

    logger.error?.('Lỗi không mong đợi', err);
    res.status(500).json({ loi: 'Lỗi máy chủ nội bộ' });
  });

  return app;
}
