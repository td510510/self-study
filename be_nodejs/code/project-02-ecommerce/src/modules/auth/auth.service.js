import { prisma } from '../../lib/prisma.js';
import { loi } from '../../lib/errors.js';
import { bamMatKhau, kiemTraMatKhau } from './mat-khau.js';
import { taoAccessToken, taoRefreshToken, xacThucRefreshToken, bamToken } from './token.js';

function locUser(u) {
  return { id: u.id, email: u.email, ten: u.ten, vaiTro: u.vaiTro };
}

export async function dangKy({ email, ten, matKhau }) {
  const hash = await bamMatKhau(matKhau);
  try {
    // Tạo user KÈM giỏ hàng rỗng trong một lời gọi.
    // Nhờ vậy không bao giờ có user không có giỏ — bớt một nhánh if ở mọi nơi.
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), ten, matKhauHash: hash, gioHang: { create: {} } },
    });
    return locUser(user);
  } catch (err) {
    if (err.code === 'P2002') throw loi.xungDot('Email đã được sử dụng');
    throw err;
  }
}

export async function dangNhap({ email, matKhau }) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  const LOI_CHUNG = 'Email hoặc mật khẩu không đúng';

  if (!user) {
    // Băm giả để thời gian phản hồi tương đương — chống dò tài khoản (buổi 15)
    await bamMatKhau('chuoi_gia_de_ton_thoi_gian_tuong_duong');
    throw loi.chuaDangNhap(LOI_CHUNG);
  }

  if (!(await kiemTraMatKhau(matKhau, user.matKhauHash))) throw loi.chuaDangNhap(LOI_CHUNG);
  return capToken(user);
}

async function capToken(user) {
  const accessToken = taoAccessToken(user);
  const { token: refreshToken, tokenHash, hetHanLuc } = taoRefreshToken(user);
  await prisma.refreshToken.create({ data: { tokenHash, userId: user.id, hetHanLuc } });
  return { user: locUser(user), accessToken, refreshToken };
}

export async function lamMoiToken(refreshToken) {
  const payload = xacThucRefreshToken(refreshToken);
  const banGhi = await prisma.refreshToken.findUnique({
    where: { tokenHash: bamToken(refreshToken) },
    include: { user: true },
  });

  if (!banGhi) throw loi.chuaDangNhap('Refresh token không tồn tại');

  if (banGhi.thuHoiLuc) {
    // Dùng lại token đã thu hồi → nghi bị đánh cắp → thu hồi toàn bộ (buổi 15)
    await prisma.refreshToken.updateMany({
      where: { userId: banGhi.userId, thuHoiLuc: null },
      data: { thuHoiLuc: new Date() },
    });
    throw loi.chuaDangNhap('Token đã bị dùng lại — đã thu hồi toàn bộ phiên');
  }

  if (banGhi.hetHanLuc < new Date()) throw loi.chuaDangNhap('Refresh token đã hết hạn');
  if (String(banGhi.userId) !== payload.sub) throw loi.chuaDangNhap('Token không khớp');

  await prisma.refreshToken.update({ where: { id: banGhi.id }, data: { thuHoiLuc: new Date() } });
  return capToken(banGhi.user);
}

export async function dangXuat(refreshToken) {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: bamToken(refreshToken), thuHoiLuc: null },
    data: { thuHoiLuc: new Date() },
  });
}

export async function layHoSo(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw loi.khongTimThay('Không tìm thấy người dùng');
  return locUser(user);
}
