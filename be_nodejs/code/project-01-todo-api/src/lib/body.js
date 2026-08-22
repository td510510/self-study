/**
 * Đọc & parse JSON body (buổi 05), có giới hạn kích thước.
 */

import { loi } from './errors.js';

export function docBody(req, gioiHan) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let tongByte = 0;

    req.on('data', (chunk) => {
      tongByte += chunk.length;

      if (tongByte > gioiHan) {
        // KHÔNG dùng req.destroy() — nó giết socket trước khi response 413
        // kịp gửi đi (bài học buổi 05, đã kiểm chứng).
        req.pause();
        chunks.length = 0;
        reject(loi.quaLon(`Body vượt quá giới hạn ${gioiHan} byte`));
        return;
      }

      chunks.push(chunk);
    });

    // Gom Buffer rồi decode MỘT LẦN — tránh cắt đôi ký tự UTF-8 (buổi 06)
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export async function docJson(req, gioiHan) {
  const contentType = req.headers['content-type'] ?? '';

  if (!contentType.startsWith('application/json')) {
    throw loi.saiKieuNoiDung(
      `Content-Type phải là application/json, nhận được: ${contentType || '(trống)'}`
    );
  }

  const buffer = await docBody(req, gioiHan);
  if (buffer.length === 0) return null;

  try {
    return JSON.parse(buffer.toString('utf8'));
  } catch (err) {
    throw loi.duLieuSai('Body không phải JSON hợp lệ');
  }
}
