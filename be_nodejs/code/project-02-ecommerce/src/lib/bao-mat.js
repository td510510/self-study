/**
 * Buổi 23 — Lớp phòng thủ ở biên: CORS, Helmet, rate limit.
 */

import helmet from 'helmet';
import cors from 'cors';
import { loi } from './errors.js';
import { demRateLimit } from './redis.js';

/**
 * CORS — cơ chế TRÌNH DUYỆT tự áp lên chính nó.
 *
 * ⚠️ CORS KHÔNG phải bảo mật cho server.
 * curl, Postman, script Python, app mobile đều BỎ QUA CORS hoàn toàn.
 * Nó chỉ ngăn TRANG WEB KHÁC gọi API của bạn bằng JavaScript
 * kèm cookie của người dùng.
 */
export function cauHinhCors(danhSachChoPhep) {
  return cors({
    origin(origin, callback) {
      // Không có origin = curl, Postman, app mobile, server-to-server.
      // Cho qua vì CORS vốn không áp dụng cho chúng.
      if (!origin) return callback(null, true);

      if (danhSachChoPhep.includes(origin)) return callback(null, true);

      // ⚠️ Trả LỖI chứ không âm thầm cho qua
      callback(new Error(`Origin không được phép: ${origin}`));
    },

    // credentials: true cho phép trình duyệt gửi kèm cookie.
    // ⚠️ KHÔNG được dùng chung với origin: '*' — trình duyệt sẽ TỪ CHỐI.
    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],

    // Header TỰ ĐẶT phải khai ở đây thì JavaScript phía client mới đọc được.
    // Thiếu dòng này, frontend không lấy được X-Request-Id để báo lỗi.
    exposedHeaders: ['X-Request-Id', 'Retry-After'],

    // Cache kết quả preflight 10 phút → bớt một request OPTIONS mỗi lần gọi
    maxAge: 600,
  });
}

/**
 * Helmet — đặt các header bảo mật mặc định.
 */
export function cauHinhHelmet() {
  return helmet({
    // CSP mặc định của helmet dành cho trang HTML.
    // API thuần JSON thì siết chặt hơn nữa: cấm mọi thứ.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        // Nếu file upload được phục vụ từ đây (buổi 17), sandbox chúng
        sandbox: ['allow-forms', 'allow-scripts'],
      },
    },

    // HSTS: buộc trình duyệt dùng HTTPS trong 1 năm.
    // ⚠️ Chỉ bật khi ĐÃ chắc chắn có HTTPS — bật nhầm ở HTTP là
    // người dùng không vào được site nữa cho tới khi hết hạn.
    hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },

    // Ẩn X-Powered-By: Express — đừng khoe công nghệ đang dùng
    hidePoweredBy: true,

    // Chống clickjacking
    frameguard: { action: 'deny' },

    // Không gửi Referer sang site khác
    referrerPolicy: { policy: 'no-referrer' },

    // Chặn trình duyệt tự đoán kiểu file — liên quan trực tiếp
    // tới lỗ hổng upload ở buổi 17
    noSniff: true,
  });
}

/**
 * Rate limit dùng Redis — đúng cả khi chạy nhiều bản sao (buổi 21).
 */
export function rateLimit({ soLanToiDa = 100, cuaSoGiay = 60, tien = 'chung' } = {}) {
  return async (req, res, next) => {
    // Sau reverse proxy, req.ip mới đúng (cần app.set('trust proxy', 1))
    const dinhDanh = req.nguoiDung?.id ? `u:${req.nguoiDung.id}` : `ip:${req.ip}`;
    const khoa = `rl:${tien}:${dinhDanh}`;

    try {
      const { dem, conLaiGiay } = await demRateLimit(khoa, cuaSoGiay);

      // Header chuẩn để client biết còn bao nhiêu lượt
      res.setHeader('RateLimit-Limit', soLanToiDa);
      res.setHeader('RateLimit-Remaining', Math.max(0, soLanToiDa - dem));
      res.setHeader('RateLimit-Reset', conLaiGiay);

      if (dem > soLanToiDa) {
        res.setHeader('Retry-After', conLaiGiay);
        return next(loi.quaNhieuRequest(conLaiGiay));
      }
      next();
    } catch (err) {
      // ⚠️ Redis chết → CHO QUA thay vì chặn hết.
      // Đây là quyết định thiết kế: thà chịu rủi ro bị gọi nhiều
      // còn hơn từ chối TOÀN BỘ người dùng hợp lệ.
      // (Hệ thống ngân hàng có thể chọn ngược lại — chặn hết cho an toàn.)
      req.log?.warn({ err: err.message }, 'rate limit lỗi, cho qua');
      next();
    }
  };
}
