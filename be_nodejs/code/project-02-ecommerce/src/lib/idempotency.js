/**
 * Buổi 24 — Idempotency key.
 *
 * BÀI TOÁN THẬT:
 *   Khách bấm "Đặt hàng". Mạng chập chờn, app không nhận được phản hồi.
 *   Khách bấm lại. → HAI ĐƠN HÀNG, trừ tiền hai lần.
 *
 * Đây KHÔNG phải lỗi của khách. Client không có cách nào biết
 * request trước đã tới server hay chưa.
 *
 * GIẢI PHÁP: client sinh một khoá ngẫu nhiên và gửi kèm.
 *            Server nhớ kết quả theo khoá đó.
 *            Gửi lại cùng khoá → trả về KẾT QUẢ CŨ, không làm lại.
 *
 * Stripe, PayPal, và mọi cổng thanh toán đều dùng cơ chế này.
 */

import { createHash } from 'node:crypto';
import { layRedis } from './redis.js';
import { loi } from './errors.js';

const TIEN_TO = 'idem:';
const TTL_GIAY = 24 * 60 * 60; // giữ 24 giờ

/** Vân tay của request — để phát hiện dùng lại khoá cho nội dung KHÁC. */
function vanTay(req) {
  return createHash('sha256')
    .update(`${req.method}:${req.originalUrl}:${JSON.stringify(req.body ?? {})}`)
    .digest('hex');
}

/**
 * @param {object} [opts]
 * @param {boolean} [opts.batBuoc] - true thì thiếu header là từ chối
 */
export function idempotency({ batBuoc = false } = {}) {
  return async (req, res, next) => {
    const khoaTho = req.headers['idempotency-key'];

    if (!khoaTho) {
      if (batBuoc) {
        return next(loi.duLieuSai('Thiếu header Idempotency-Key'));
      }
      return next();
    }

    if (typeof khoaTho !== 'string' || khoaTho.length < 8 || khoaTho.length > 200) {
      return next(loi.duLieuSai('Idempotency-Key phải dài 8–200 ký tự'));
    }

    // Khoá phải gắn với NGƯỜI DÙNG — nếu không, người A đoán được khoá
    // của người B là đọc được kết quả đơn hàng của họ.
    const nguoi = req.nguoiDung?.id ?? `ip:${req.ip}`;
    const khoa = `${TIEN_TO}${nguoi}:${khoaTho}`;
    const redis = layRedis();
    const vt = vanTay(req);

    let daCo;
    try {
      daCo = await redis.get(khoa);
    } catch (err) {
      // Redis chết → bỏ qua idempotency, xử lý bình thường.
      // Đánh đổi: có thể tạo trùng, nhưng không chặn người dùng.
      req.log?.warn({ err: err.message }, 'idempotency lỗi, bỏ qua');
      return next();
    }

    if (daCo) {
      const ban = JSON.parse(daCo);

      if (ban.trangThai === 'dang-xu-ly') {
        // Request đầu tiên CHƯA xong. Đây là lần bấm thứ hai.
        // 409 để client biết chờ, thay vì tạo đơn thứ hai.
        return next(loi.xungDot('Request với khoá này đang được xử lý, vui lòng chờ'));
      }

      // ⚠️ Cùng khoá nhưng NỘI DUNG KHÁC = client dùng sai.
      // Nếu cho qua, ta trả về kết quả của một request hoàn toàn khác.
      if (ban.vanTay !== vt) {
        return next(
          loi.xungDot('Idempotency-Key đã dùng cho một request có nội dung khác')
        );
      }

      // Trả lại KẾT QUẢ CŨ, không thực thi lại
      res.setHeader('Idempotency-Replayed', 'true');
      return res.status(ban.status).json(ban.body);
    }

    // Đặt cờ "đang xử lý" — NX đảm bảo chỉ MỘT request đặt được.
    // Đây là khoá chống hai request đồng thời cùng khoá.
    try {
      const dat = await redis.set(
        khoa,
        JSON.stringify({ trangThai: 'dang-xu-ly', vanTay: vt }),
        'EX',
        TTL_GIAY,
        'NX'
      );
      if (dat === null) {
        return next(loi.xungDot('Request với khoá này đang được xử lý, vui lòng chờ'));
      }
    } catch (err) {
      req.log?.warn({ err: err.message }, 'idempotency lỗi, bỏ qua');
      return next();
    }

    // Chặn res.json để ghi lại kết quả trước khi gửi đi
    const jsonGoc = res.json.bind(res);
    res.json = (body) => {
      // CHỈ ghi nhớ khi THÀNH CÔNG.
      // Lỗi thì xoá cờ, để client thử lại được.
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redis
          .set(
            khoa,
            JSON.stringify({ trangThai: 'xong', status: res.statusCode, body, vanTay: vt }),
            'EX',
            TTL_GIAY
          )
          .catch(() => {});
      } else {
        redis.del(khoa).catch(() => {});
      }
      return jsonGoc(body);
    };

    next();
  };
}
