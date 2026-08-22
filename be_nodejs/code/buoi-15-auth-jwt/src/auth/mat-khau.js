/**
 * Buổi 15 — Băm mật khẩu bằng bcrypt.
 */

import bcrypt from 'bcrypt';

const COST = Number(process.env.BCRYPT_COST ?? 12);

/**
 * bcrypt tự sinh SALT ngẫu nhiên và nhúng vào chuỗi kết quả.
 * Nghĩa là: hai người dùng cùng mật khẩu "123456" vẫn cho ra hai hash KHÁC NHAU.
 *
 * Nhờ vậy kẻ tấn công không thể dùng "rainbow table" —
 * bảng tra cứu hash đã tính sẵn.
 */
export function bamMatKhau(matKhauTho) {
  return bcrypt.hash(matKhauTho, COST);
}

/**
 * bcrypt.compare tự đọc salt và cost từ chính chuỗi hash,
 * rồi băm lại mật khẩu người dùng nhập để so sánh.
 *
 * ⚠️ QUAN TRỌNG: nó so sánh theo kiểu THỜI GIAN KHÔNG ĐỔI (constant-time),
 * nên không lộ thông tin qua thời gian phản hồi.
 * Nếu tự viết `hash1 === hash2` thì có thể bị tấn công đo thời gian.
 */
export function kiemTraMatKhau(matKhauTho, hash) {
  return bcrypt.compare(matKhauTho, hash);
}
