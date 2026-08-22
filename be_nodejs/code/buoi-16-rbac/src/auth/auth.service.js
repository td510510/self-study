/**
 * Buổi 15 — Nghiệp vụ xác thực.
 */

import { prisma } from '../lib/prisma.js';
import { loi } from '../lib/errors.js';
import { bamMatKhau, kiemTraMatKhau } from './mat-khau.js';
import {
  taoAccessToken,
  taoRefreshToken,
  xacThucRefreshToken,
  bamToken,
} from './token.js';

/** Chỉ trả những trường AN TOÀN để lộ ra ngoài — không bao giờ có matKhauHash. */
function locUser(u) {
  return { id: u.id, email: u.email, ten: u.ten, vaiTro: u.vaiTro };
}

export async function dangKy({ email, ten, matKhau, vaiTro }) {
  const hash = await bamMatKhau(matKhau);

  try {
    const user = await prisma.user.create({
      // ⚠️ vaiTro CHỈ được nhận khi đang chạy test (dựng dữ liệu cho nhanh).
      // Ở production, endpoint đăng ký TUYỆT ĐỐI không cho client chọn vai trò —
      // nếu không, ai cũng tự đăng ký làm admin. Đây là lỗi thật đã xảy ra
      // ở nhiều hệ thống. Việc nâng quyền phải qua endpoint riêng của admin.
      data: {
        email: email.toLowerCase(),
        ten,
        matKhauHash: hash,
        ...(process.env.CHO_PHEP_CHON_VAI_TRO === 'true' && vaiTro ? { vaiTro } : {}),
      },
    });
    return locUser(user);
  } catch (err) {
    // P2002 = trùng unique → 409 Conflict (bài học buổi 13)
    if (err.code === 'P2002') throw loi.xungDot('Email đã được sử dụng');
    throw err;
  }
}

export async function dangNhap({ email, matKhau }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // ⚠️ THÔNG ĐIỆP LỖI PHẢI GIỐNG NHAU cho cả hai trường hợp:
  // "email không tồn tại" và "mật khẩu sai".
  //
  // Nếu tách riêng, kẻ tấn công dò được email nào đã đăng ký —
  // gọi là "user enumeration". Với ứng dụng nhạy cảm (y tế, tài chính),
  // chỉ riêng việc biết một email có tài khoản đã là rò rỉ.
  const LOI_CHUNG = 'Email hoặc mật khẩu không đúng';

  if (!user) {
    // Vẫn băm một lần dù user không tồn tại, để thời gian phản hồi
    // tương đương trường hợp có user → chống dò bằng cách đo thời gian.
    await bamMatKhau('chuoi_gia_de_ton_thoi_gian_tuong_duong');
    throw loi.chuaDangNhap(LOI_CHUNG);
  }

  const dung = await kiemTraMatKhau(matKhau, user.matKhauHash);
  if (!dung) throw loi.chuaDangNhap(LOI_CHUNG);

  return capToken(user);
}

async function capToken(user) {
  const accessToken = taoAccessToken(user);
  const { token: refreshToken, tokenHash, hetHanLuc } = taoRefreshToken(user);

  await prisma.refreshToken.create({
    data: { tokenHash, userId: user.id, hetHanLuc },
  });

  return { user: locUser(user), accessToken, refreshToken };
}

/**
 * Đổi refresh token lấy cặp token mới.
 *
 * Áp dụng REFRESH TOKEN ROTATION: mỗi lần dùng, token cũ bị thu hồi
 * và cấp token mới. Nhờ vậy một token chỉ dùng được ĐÚNG MỘT LẦN.
 */
export async function lamMoiToken(refreshToken) {
  const payload = xacThucRefreshToken(refreshToken);

  const banGhi = await prisma.refreshToken.findUnique({
    where: { tokenHash: bamToken(refreshToken) },
    include: { user: true },
  });

  if (!banGhi) throw loi.chuaDangNhap('Refresh token không tồn tại');

  if (banGhi.thuHoiLuc) {
    // 🚨 Token đã dùng rồi mà lại dùng tiếp → nhiều khả năng BỊ ĐÁNH CẮP.
    // Phản ứng an toàn: thu hồi TOÀN BỘ token của user, buộc đăng nhập lại.
    await prisma.refreshToken.updateMany({
      where: { userId: banGhi.userId, thuHoiLuc: null },
      data: { thuHoiLuc: new Date() },
    });
    throw loi.chuaDangNhap('Token đã bị dùng lại — đã thu hồi toàn bộ phiên vì lý do an toàn');
  }

  if (banGhi.hetHanLuc < new Date()) throw loi.chuaDangNhap('Refresh token đã hết hạn');
  if (String(banGhi.userId) !== payload.sub) throw loi.chuaDangNhap('Token không khớp người dùng');

  // Thu hồi token cũ rồi cấp cặp mới (rotation)
  await prisma.refreshToken.update({
    where: { id: banGhi.id },
    data: { thuHoiLuc: new Date() },
  });

  return capToken(banGhi.user);
}

export async function dangXuat(refreshToken) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: bamToken(refreshToken), thuHoiLuc: null },
    data: { thuHoiLuc: new Date() },
  });
}

/** Đăng xuất khỏi MỌI thiết bị. */
export async function dangXuatTatCa(userId) {
  const kq = await prisma.refreshToken.updateMany({
    where: { userId, thuHoiLuc: null },
    data: { thuHoiLuc: new Date() },
  });
  return kq.count;
}

export async function layHoSo(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw loi.khongTimThay('Không tìm thấy người dùng');
  return locUser(user);
}
