/**
 * Buổi 15 — Sinh và kiểm tra JWT.
 */

import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { loi } from '../../lib/errors.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL ?? '15m';
const REFRESH_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7);

if (!ACCESS_SECRET || !REFRESH_SECRET) {
  throw new Error('Thiếu JWT_ACCESS_SECRET hoặc JWT_REFRESH_SECRET');
}
if (ACCESS_SECRET === REFRESH_SECRET) {
  // Dùng chung khoá = access token có thể đem đi làm refresh token và ngược lại.
  throw new Error('JWT_ACCESS_SECRET và JWT_REFRESH_SECRET PHẢI KHÁC NHAU');
}

/**
 * Access token: SỐNG NGẮN (15 phút), KHÔNG lưu ở database.
 *
 * Vì sao không lưu? Vì mục đích của nó là để server kiểm tra được
 * mà KHÔNG cần hỏi database — đó là toàn bộ giá trị của JWT.
 * Cái giá: không thu hồi được trước khi hết hạn. Nên phải sống ngắn.
 */
export function taoAccessToken(user) {
  return jwt.sign(
    // Payload: CHỈ những gì cần thiết.
    // ⚠️ Payload KHÔNG được mã hoá, chỉ được KÝ. Ai cũng đọc được.
    // Tuyệt đối không đưa mật khẩu, số thẻ, thông tin nhạy cảm vào đây.
    { sub: String(user.id), email: user.email, vaiTro: user.vaiTro },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL, issuer: 'hocbe-auth' }
  );
}

export function xacThucAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET, {
      issuer: 'hocbe-auth',
      // ⚠️ BẮT BUỘC khai algorithms. Không khai thì thư viện chấp nhận
      // thuật toán ghi trong header của chính token — kẻ tấn công đổi
      // thành "none" là qua mặt được. Đây là lỗ hổng "algorithm confusion".
      algorithms: ['HS256'],
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw loi.chuaDangNhap('Access token đã hết hạn');
    throw loi.chuaDangNhap('Access token không hợp lệ');
  }
}

/**
 * Refresh token: SỐNG DÀI (7 ngày), CÓ lưu ở database để thu hồi được.
 *
 * Ta lưu HASH của token chứ không lưu token thô — cùng lý do với mật khẩu:
 * database bị lộ thì kẻ tấn công vẫn không dùng được.
 */
export function taoRefreshToken(user) {
  // jti (JWT ID) ngẫu nhiên: để mỗi lần đăng nhập ra một token khác nhau,
  // kể cả cùng user và cùng giây.
  const jti = randomBytes(16).toString('hex');

  const token = jwt.sign({ sub: String(user.id), jti }, REFRESH_SECRET, {
    expiresIn: `${REFRESH_TTL_DAYS}d`,
    issuer: 'hocbe-auth',
  });

  const hetHanLuc = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { token, tokenHash: bamToken(token), hetHanLuc };
}

export function xacThucRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET, { issuer: 'hocbe-auth', algorithms: ['HS256'] });
  } catch {
    throw loi.chuaDangNhap('Refresh token không hợp lệ hoặc đã hết hạn');
  }
}

/**
 * SHA-256 là đủ cho token — KHÁC với mật khẩu.
 *
 * Vì sao không dùng bcrypt? Vì token đã là chuỗi ngẫu nhiên 200+ ký tự,
 * không thể đoán bằng từ điển. bcrypt cố tình CHẬM để chống đoán mật khẩu;
 * với token thì cái chậm đó chỉ làm phí CPU mỗi lần refresh.
 */
export function bamToken(token) {
  return createHash('sha256').update(token).digest('hex');
}
