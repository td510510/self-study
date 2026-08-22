/**
 * Buổi 05 — Các hàm trả response chuẩn hoá.
 *
 * Mục đích: MỌI response của API đều cùng một định dạng.
 * Frontend chỉ cần viết một lớp xử lý duy nhất.
 */

import { HttpError } from './errors.js';

/** Trả JSON với status tuỳ ý. */
export function json(res, statusCode, duLieu) {
  const body = JSON.stringify(duLieu, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body), // đếm BYTE — bài học buổi 01
  });
  res.end(body);
}

/** 204 No Content — dùng cho DELETE thành công. Không có body. */
export function khongCoNoiDung(res) {
  res.writeHead(204);
  res.end();
}

/**
 * Chuyển một lỗi bất kỳ thành HTTP response.
 * ĐÂY LÀ CHỖ DUY NHẤT trong toàn ứng dụng biết cách trả lỗi.
 */
export function guiLoi(res, err) {
  // Lỗi ta chủ động ném ra → an toàn để lộ thông điệp cho client
  if (err instanceof HttpError) {
    // Với 413, client vẫn đang gửi dữ liệu lên. Ta đã ngừng đọc,
    // nên phải báo đóng kết nối — nếu không, client cứ gửi tiếp mãi.
    if (err.statusCode === 413) res.setHeader('Connection', 'close');

    json(res, err.statusCode, {
      loi: err.message,
      ...(err.chiTiet ? { chiTiet: err.chiTiet } : {}),
    });
    return;
  }

  // Lỗi ngoài dự kiến = BUG.
  // Ghi log ĐẦY ĐỦ cho lập trình viên...
  console.error('[LỖI KHÔNG MONG ĐỢI]', err);

  // ...nhưng CHỈ trả thông điệp chung chung cho client.
  json(res, 500, { loi: 'Lỗi máy chủ nội bộ' });
}

/*
 * ⚠️ NGUYÊN TẮC BẢO MẬT QUAN TRỌNG
 *
 * KHÔNG BAO GIỜ trả stack trace hay err.message của lỗi lạ cho client.
 *
 * Stack trace lộ ra:
 *   - Đường dẫn thư mục trên server  (D:\Study\...)
 *   - Tên thư viện và phiên bản      → kẻ tấn công tra lỗ hổng đã biết
 *   - Cấu trúc database              (nếu là lỗi SQL)
 *
 * Đây là lỗi bảo mật cực phổ biến ở dự án của người mới.
 * Ta sẽ gặp lại nó trong OWASP Top 10 ở buổi 22.
 *
 * Quy tắc: LOG ĐẦY ĐỦ CHO MÌNH, TRẢ TỐI THIỂU CHO NGƯỜI DÙNG.
 */
