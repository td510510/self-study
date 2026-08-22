/**
 * Buổi 16 — Tầng phân quyền.
 *
 * Nguyên tắc cốt lõi: MỌI quyết định về quyền đều nằm ở ĐÂY,
 * không rải rác trong các handler. Một chỗ để đọc, một chỗ để sửa,
 * một chỗ để kiểm toán khi có sự cố.
 */

import { loi } from './errors.js';

/**
 * BẢNG QUYỀN — nguồn sự thật duy nhất.
 *
 * Đọc theo hàng: vai trò này làm được những gì.
 * 'own' = chỉ trên tài nguyên MÌNH sở hữu.
 * 'any' = trên tài nguyên của BẤT KỲ AI.
 */
export const BANG_QUYEN = {
  user: {
    'baiviet:doc': 'any',    // ai cũng đọc được bài đã đăng
    'baiviet:tao': 'any',
    'baiviet:sua': 'own',    // ← chỉ sửa bài của mình
    'baiviet:xoa': 'own',
    'baiviet:dang': 'own',
  },
  bienTap: {
    'baiviet:doc': 'any',
    'baiviet:tao': 'any',
    'baiviet:sua': 'any',    // ← biên tập sửa được bài người khác
    'baiviet:xoa': 'own',    // ← nhưng chỉ xoá được bài mình
    'baiviet:dang': 'any',
  },
  admin: {
    'baiviet:doc': 'any',
    'baiviet:tao': 'any',
    'baiviet:sua': 'any',
    'baiviet:xoa': 'any',
    'baiviet:dang': 'any',
    'user:quanly': 'any',
  },
};

/**
 * Kiểm tra một hành động có được phép không.
 *
 * @param {object} nguoiDung  - từ token (id, vaiTro)
 * @param {string} hanhDong   - ví dụ 'baiviet:sua'
 * @param {object} [taiNguyen]- bản ghi cần kiểm tra, phải có trường chủ sở hữu
 * @param {string} [truongChuSoHuu]
 */
export function duocPhep(nguoiDung, hanhDong, taiNguyen, truongChuSoHuu = 'tacGiaId') {
  const quyen = BANG_QUYEN[nguoiDung?.vaiTro];
  if (!quyen) return false;

  const phamVi = quyen[hanhDong];
  if (!phamVi) return false;

  if (phamVi === 'any') return true;

  // phamVi === 'own' → bắt buộc phải có tài nguyên để so chủ sở hữu.
  // Không có tài nguyên mà đòi quyền 'own' → TỪ CHỐI.
  // Mặc định là từ chối, không phải cho phép — nguyên tắc "fail closed".
  if (!taiNguyen) return false;

  return taiNguyen[truongChuSoHuu] === nguoiDung.id;
}

/** Ném lỗi 403 nếu không được phép. */
export function batBuocQuyen(nguoiDung, hanhDong, taiNguyen, truongChuSoHuu) {
  if (!duocPhep(nguoiDung, hanhDong, taiNguyen, truongChuSoHuu)) {
    throw loi.khongDuQuyen(`Không đủ quyền thực hiện: ${hanhDong}`);
  }
}
