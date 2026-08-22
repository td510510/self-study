/**
 * Kiểm tra dữ liệu đầu vào — HÀM THUẦN, không chạm I/O.
 *
 * Nguyên tắc: VALIDATE Ở BIÊN. Không cho dữ liệu bẩn lọt vào sâu hệ thống.
 * Ở Phase 2 ta thay bằng zod, Phase 4 thay bằng class-validator —
 * nhưng nguyên tắc không đổi.
 */

import { loi } from '../lib/errors.js';

const TIEU_DE_TOI_DA = 200;
const UU_TIEN_HOP_LE = ['thap', 'trung', 'cao'];

/**
 * @param {object} duLieu
 * @param {boolean} batBuocDuTruong - true cho POST/PUT, false cho PATCH
 * @returns {object} dữ liệu đã làm sạch
 */
export function kiemTraTodo(duLieu, batBuocDuTruong) {
  if (duLieu === null || typeof duLieu !== 'object' || Array.isArray(duLieu)) {
    throw loi.duLieuSai('Body phải là một object');
  }

  const loiTruong = {};
  const sach = {};

  // ── tieuDe ──────────────────────────────────────────────
  if (batBuocDuTruong || duLieu.tieuDe !== undefined) {
    if (typeof duLieu.tieuDe !== 'string') {
      loiTruong.tieuDe = 'Bắt buộc, phải là chuỗi';
    } else if (duLieu.tieuDe.trim() === '') {
      loiTruong.tieuDe = 'Không được rỗng';
    } else if (duLieu.tieuDe.length > TIEU_DE_TOI_DA) {
      loiTruong.tieuDe = `Tối đa ${TIEU_DE_TOI_DA} ký tự`;
    } else {
      sach.tieuDe = duLieu.tieuDe.trim();
    }
  }

  // ── xong ────────────────────────────────────────────────
  if (duLieu.xong !== undefined) {
    if (typeof duLieu.xong !== 'boolean') {
      loiTruong.xong = 'Phải là true hoặc false';
    } else {
      sach.xong = duLieu.xong;
    }
  } else if (batBuocDuTruong) {
    sach.xong = false; // mặc định
  }

  // ── uuTien ──────────────────────────────────────────────
  if (duLieu.uuTien !== undefined) {
    if (!UU_TIEN_HOP_LE.includes(duLieu.uuTien)) {
      loiTruong.uuTien = `Phải là một trong: ${UU_TIEN_HOP_LE.join(', ')}`;
    } else {
      sach.uuTien = duLieu.uuTien;
    }
  } else if (batBuocDuTruong) {
    sach.uuTien = 'trung';
  }

  // ── Chống mass assignment ───────────────────────────────
  // Chỉ giữ các trường ta CHO PHÉP. Nếu client gửi kèm { id: 999 }
  // hay { vaiTro: 'admin' }, chúng bị loại bỏ tại đây.
  // Đây là lỗ hổng bảo mật phổ biến — gặp lại ở buổi 22 (OWASP).

  if (Object.keys(loiTruong).length > 0) {
    throw loi.duLieuSai('Dữ liệu không hợp lệ', loiTruong);
  }

  return sach;
}

export function kiemTraThamSoLoc(query) {
  const ketQua = {};

  if (query.xong !== undefined) {
    if (query.xong !== 'true' && query.xong !== 'false') {
      throw loi.duLieuSai('Tham số không hợp lệ', { xong: 'Phải là true hoặc false' });
    }
    ketQua.xong = query.xong === 'true';
  }

  if (query.uuTien !== undefined) {
    if (!UU_TIEN_HOP_LE.includes(query.uuTien)) {
      throw loi.duLieuSai('Tham số không hợp lệ', {
        uuTien: `Phải là một trong: ${UU_TIEN_HOP_LE.join(', ')}`,
      });
    }
    ketQua.uuTien = query.uuTien;
  }

  const trang = query.trang === undefined ? 1 : Number(query.trang);
  const moiTrang = query.moiTrang === undefined ? 20 : Number(query.moiTrang);

  if (!Number.isInteger(trang) || trang < 1) {
    throw loi.duLieuSai('Tham số không hợp lệ', { trang: 'Phải là số nguyên >= 1' });
  }
  if (!Number.isInteger(moiTrang) || moiTrang < 1 || moiTrang > 100) {
    throw loi.duLieuSai('Tham số không hợp lệ', { moiTrang: 'Phải là số nguyên 1..100' });
  }

  ketQua.trang = trang;
  ketQua.moiTrang = moiTrang;
  return ketQua;
}
