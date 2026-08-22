/**
 * Chuẩn hoá response & chuyển lỗi thành HTTP (buổi 05).
 */

import { HttpError } from './errors.js';

export function json(res, statusCode, duLieu, headers = {}) {
  const body = JSON.stringify(duLieu, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body), // đếm BYTE (buổi 01)
    ...headers,
  });
  res.end(body);
}

export function khongCoNoiDung(res) {
  res.writeHead(204);
  res.end();
}

export function guiLoi(res, err, logger) {
  if (err instanceof HttpError) {
    const headers = {};
    if (err.statusCode === 405 && err.choPhep) headers.Allow = err.choPhep.join(', ');
    // Client vẫn đang gửi dữ liệu lên; ta đã ngừng đọc nên phải báo đóng
    if (err.statusCode === 413 || err.statusCode === 503) headers.Connection = 'close';

    json(res, err.statusCode, {
      loi: err.message,
      ...(err.chiTiet ? { chiTiet: err.chiTiet } : {}),
    }, headers);
    return;
  }

  // Lỗi ngoài dự kiến = BUG.
  // LOG ĐẦY ĐỦ cho mình, TRẢ TỐI THIỂU cho client —
  // không bao giờ lộ stack trace ra ngoài (buổi 05).
  logger.error('Lỗi không mong đợi', { thongDiep: err.message, stack: err.stack });
  json(res, 500, { loi: 'Lỗi máy chủ nội bộ' });
}
