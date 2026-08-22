/**
 * Project 2 — Error middleware tập trung.
 *
 * ĐÂY LÀ CHỖ DUY NHẤT trong toàn ứng dụng quyết định
 * lỗi được trả về cho client như thế nào.
 */

import { HttpError, tuLoiPrisma } from './errors.js';

export function xuLyLoi(logger) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, next) => {
    // Lỗi của express.json()
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ loi: 'Body không phải JSON hợp lệ', ma: 'JSON_HONG' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ loi: 'Body quá lớn', ma: 'BODY_QUA_LON' });
    }

    // Lỗi Prisma → chuyển thành HttpError nếu nhận ra
    const daChuyen = err.code?.startsWith?.('P2') ? tuLoiPrisma(err) : null;
    const loiCuoi = daChuyen ?? err;

    // ── LỖI VẬN HÀNH: đã lường trước, an toàn để lộ thông điệp ──
    if (loiCuoi instanceof HttpError) {
      // 4xx là chuyện bình thường → mức warn, KHÔNG phải error.
      // Nhớ: log mọi thứ ở mức error thì cảnh báo mất hết ý nghĩa.
      req.log?.warn(
        { ma: loiCuoi.ma, status: loiCuoi.statusCode },
        `Lỗi vận hành: ${loiCuoi.message}`
      );

      return res.status(loiCuoi.statusCode).json({
        loi: loiCuoi.message,
        ma: loiCuoi.ma,
        ...(loiCuoi.chiTiet ? { chiTiet: loiCuoi.chiTiet } : {}),
        requestId: req.id,
      });
    }

    // ── LỖI LẬP TRÌNH: đây là BUG ──
    // Ghi log ĐẦY ĐỦ kèm stack để còn sửa được...
    (req.log ?? logger).error(
      { err, stack: err.stack },
      'LỖI LẬP TRÌNH — cần điều tra'
    );

    // ...nhưng CHỈ trả thông điệp chung chung cho client.
    // requestId là cầu nối: người dùng đọc mã này cho ta, ta tra ra
    // toàn bộ ngữ cảnh trong log — mà không lộ gì cho kẻ tấn công.
    res.status(500).json({
      loi: 'Lỗi máy chủ nội bộ',
      ma: 'LOI_MAY_CHU',
      requestId: req.id,
    });
  };
}

export function khongTimThayRoute() {
  return (req, res, next) => {
    next(new HttpError(404, `Không có đường dẫn ${req.method} ${req.originalUrl}`, {
      ma: 'KHONG_TIM_THAY',
    }));
  };
}
