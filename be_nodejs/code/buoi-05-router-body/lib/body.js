/**
 * Buổi 05 — Đọc và parse body của request.
 *
 * Đây là việc mà `express.json()` làm hộ ta ở Phase 2.
 * Hôm nay ta tự viết để hiểu nó làm gì — và vì sao nó cần giới hạn kích thước.
 */

import { HttpError } from './errors.js';

/** Giới hạn mặc định: 1 MB. */
const GIOI_HAN_MAC_DINH = 1024 * 1024;

/**
 * Gom toàn bộ body của request thành một Buffer.
 *
 * `req` là Readable stream (nhớ buổi 04) — dữ liệu về theo từng chunk,
 * ta phải tự gom lại.
 */
export function docBody(req, gioiHan = GIOI_HAN_MAC_DINH) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let tongByte = 0;

    req.on('data', (chunk) => {
      tongByte += chunk.length;

      // BẢO VỆ SỐNG CÒN: nếu không có dòng này, một kẻ tấn công
      // gửi body 10GB sẽ làm server hết RAM và chết.
      // Đây là dạng tấn công DoS đơn giản nhất.
      if (tongByte > gioiHan) {
        // ⚠️ KHÔNG dùng req.destroy() ở đây!
        // destroy() giết socket NGAY, response 413 chưa kịp gửi đi
        // → client nhận được kết nối đứt, không biết vì sao bị từ chối.
        // (Đã kiểm chứng khi soạn bài: curl báo status 100, body rỗng.)
        //
        // Thay vào đó: ngừng đọc thêm, giải phóng bộ nhớ đã gom,
        // rồi để tầng trên gửi 413 tử tế.
        req.pause();
        chunks.length = 0;
        reject(new HttpError(413, `Body vượt quá giới hạn ${gioiHan} byte`));
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));

    // Client ngắt kết nối giữa chừng, mạng lỗi...
    req.on('error', reject);
  });
}

/**
 * Đọc body và parse thành JSON.
 * Trả về null nếu body rỗng (hợp lệ với PUT/PATCH không có nội dung).
 */
export async function docJson(req, gioiHan) {
  const contentType = req.headers['content-type'] ?? '';

  // Header có thể kèm charset: 'application/json; charset=utf-8'
  // nên dùng startsWith chứ không so sánh bằng.
  if (!contentType.startsWith('application/json')) {
    throw new HttpError(
      415,
      `Content-Type phải là application/json, nhận được: ${contentType || '(trống)'}`
    );
  }

  const buffer = await docBody(req, gioiHan);

  if (buffer.length === 0) return null;

  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch (err) {
    // Lỗi của CLIENT (gửi JSON hỏng) → 400, không phải 500.
    // Nhớ bài học buổi 01: trả sai status code làm hỏng thống kê lỗi.
    throw new HttpError(400, 'Body không phải JSON hợp lệ', { cause: err });
  }
}

/*
 * BA ĐIỂM DẠY
 *
 * 1. Vì sao body không có sẵn trong req.body?
 *    Vì req là stream — lúc handler chạy, dữ liệu còn ĐANG chảy tới.
 *    Với body lớn, chờ đủ dữ liệu có thể mất vài giây.
 *    Node không tự chờ hộ, vì nhiều request (GET) không cần body.
 *
 * 2. Vì sao phải Buffer.concat mà không nối chuỗi?
 *    Một ký tự UTF-8 có thể bị CẮT ĐÔI giữa hai chunk.
 *    Nối chuỗi từng chunk → chữ tiếng Việt bị vỡ thành ký tự lạ.
 *    Gom Buffer rồi mới toString('utf8') một lần là an toàn.
 *    (Buổi 06 sẽ đào sâu đúng vấn đề này với stream.)
 *
 * 3. Vì sao phải giới hạn kích thước?
 *    Không giới hạn = lỗ hổng DoS. Kẻ tấn công gửi body khổng lồ,
 *    server gom hết vào RAM rồi chết.
 *    express.json() mặc định giới hạn 100kb chính vì lý do này.
 */
