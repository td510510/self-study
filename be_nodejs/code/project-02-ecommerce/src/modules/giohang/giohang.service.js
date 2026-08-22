import { prisma } from '../../lib/prisma.js';
import { loi } from '../../lib/errors.js';

async function layGio(userId) {
  const gio = await prisma.gioHang.findUnique({ where: { userId } });
  if (!gio) throw loi.khongTimThay('Không tìm thấy giỏ hàng');
  return gio;
}

export async function xem(userId) {
  const gio = await prisma.gioHang.findUnique({
    where: { userId },
    include: { items: { include: { sanPham: { select: { ten: true, giaVND: true, tonKho: true } } } } },
  });
  if (!gio) throw loi.khongTimThay('Không tìm thấy giỏ hàng');

  const tongTien = gio.items.reduce((s, i) => s + i.sanPham.giaVND * i.soLuong, 0);
  return { items: gio.items, tongTienVND: tongTien };
}

export async function themItem(userId, { sanPhamId, soLuong }) {
  const gio = await layGio(userId);

  const sp = await prisma.sanPham.findUnique({ where: { id: sanPhamId } });
  if (!sp || !sp.conBan) throw loi.khongTimThay(`Không có sản phẩm id = ${sanPhamId}`);

  // Nhờ @@unique([gioHangId, sanPhamId]) ở schema, upsert xử lý gọn
  // cả hai trường hợp: chưa có thì tạo, có rồi thì cộng dồn số lượng.
  // Không có ràng buộc đó, hai request đồng thời sẽ tạo hai dòng trùng.
  return prisma.gioHangItem.upsert({
    where: { gioHangId_sanPhamId: { gioHangId: gio.id, sanPhamId } },
    update: { soLuong: { increment: soLuong } },
    create: { gioHangId: gio.id, sanPhamId, soLuong },
  });
}

export async function suaSoLuong(userId, sanPhamId, soLuong) {
  const gio = await layGio(userId);

  if (soLuong === 0) {
    await prisma.gioHangItem.deleteMany({ where: { gioHangId: gio.id, sanPhamId } });
    return null;
  }

  const kq = await prisma.gioHangItem.updateMany({
    where: { gioHangId: gio.id, sanPhamId },
    data: { soLuong },
  });
  if (kq.count === 0) throw loi.khongTimThay('Sản phẩm không có trong giỏ');

  return prisma.gioHangItem.findFirst({ where: { gioHangId: gio.id, sanPhamId } });
}

export async function xoaItem(userId, sanPhamId) {
  const gio = await layGio(userId);
  const kq = await prisma.gioHangItem.deleteMany({ where: { gioHangId: gio.id, sanPhamId } });
  if (kq.count === 0) throw loi.khongTimThay('Sản phẩm không có trong giỏ');
}
