/**
 * Project 2 — Bảng quyền (buổi 16).
 */

import { loi } from './errors.js';

export const BANG_QUYEN = {
  khach: {
    'sanpham:doc': 'any',
    'giohang:quanly': 'own',
    'donhang:doc': 'own',
    'donhang:tao': 'any',
    'donhang:huy': 'own',
  },
  nhanVien: {
    'sanpham:doc': 'any',
    'sanpham:sua': 'any',
    'donhang:doc': 'any',
    'donhang:capnhat': 'any',
    'giohang:quanly': 'own',
    'donhang:tao': 'any',
    'donhang:huy': 'own',
  },
  admin: {
    'sanpham:doc': 'any',
    'sanpham:tao': 'any',
    'sanpham:sua': 'any',
    'sanpham:xoa': 'any',
    'donhang:doc': 'any',
    'donhang:capnhat': 'any',
    'donhang:huy': 'any',
    'donhang:tao': 'any',
    'giohang:quanly': 'own',
    'user:quanly': 'any',
  },
};

export function duocPhep(nguoiDung, hanhDong, taiNguyen, truongChuSoHuu = 'userId') {
  const quyen = BANG_QUYEN[nguoiDung?.vaiTro];
  if (!quyen) return false;

  const phamVi = quyen[hanhDong];
  if (!phamVi) return false;
  if (phamVi === 'any') return true;

  // 'own' mà không có tài nguyên → TỪ CHỐI (fail closed)
  if (!taiNguyen) return false;
  return taiNguyen[truongChuSoHuu] === nguoiDung.id;
}

export function batBuocQuyen(nguoiDung, hanhDong, taiNguyen, truongChuSoHuu) {
  if (!duocPhep(nguoiDung, hanhDong, taiNguyen, truongChuSoHuu)) {
    throw loi.khongDuQuyen(`Không đủ quyền thực hiện: ${hanhDong}`);
  }
}
