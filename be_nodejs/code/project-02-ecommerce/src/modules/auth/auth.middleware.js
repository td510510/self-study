/**
 * Buổi 15 — Middleware bảo vệ route.
 */

import { xacThucAccessToken } from './token.js';
import { loi } from '../../lib/errors.js';

/**
 * Bắt buộc đăng nhập.
 * Đọc header: Authorization: Bearer <token>
 */
export function yeuCauDangNhap() {
  return (req, res, next) => {
    const header = req.headers.authorization ?? '';

    // Định dạng chuẩn RFC 6750: "Bearer " + token
    if (!header.startsWith('Bearer ')) {
      return next(loi.chuaDangNhap('Thiếu header Authorization: Bearer <token>'));
    }

    const token = header.slice(7).trim();
    if (!token) return next(loi.chuaDangNhap('Token rỗng'));

    try {
      const payload = xacThucAccessToken(token);

      // Gắn thông tin người dùng vào req để handler phía sau dùng.
      // ⚠️ Đây là dữ liệu TỪ TOKEN, không phải từ database.
      // Nếu user bị đổi vai trò/khoá tài khoản, token cũ vẫn mang thông tin cũ
      // cho tới khi hết hạn. Đó là cái giá của stateless.
      req.nguoiDung = {
        id: Number(payload.sub),
        email: payload.email,
        vaiTro: payload.vaiTro,
      };
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Phân quyền theo vai trò — RBAC.
 * Buổi 16 sẽ đào sâu; ở đây dùng bản tối giản.
 */
export function yeuCauVaiTro(...vaiTroChoPhep) {
  return (req, res, next) => {
    // 401 = chưa biết bạn là ai; 403 = biết rồi nhưng không đủ quyền
    if (!req.nguoiDung) return next(loi.chuaDangNhap());

    if (!vaiTroChoPhep.includes(req.nguoiDung.vaiTro)) {
      return next(loi.khongDuQuyen(`Cần vai trò: ${vaiTroChoPhep.join(' hoặc ')}`));
    }
    next();
  };
}
