import { prisma } from '../../lib/prisma.js';
import { loi } from '../../lib/errors.js';
import { batBuocQuyen } from '../../lib/quyen.js';
import { cacheAside, xoaCacheTheoMau } from '../../lib/redis.js';

const CACHE_TTL = Number(process.env.CACHE_TTL_GIAY ?? 60);

/**
 * Khoá cache phải chứa MỌI tham số ảnh hưởng tới kết quả (buổi 21).
 * Thiếu một tham số → mọi bộ lọc dùng chung một cache → trả sai dữ liệu.
 * Sắp xếp khoá để {a,b} và {b,a} cho ra CÙNG một chuỗi.
 */
function khoaCacheDanhSach(q) {
  const phan = Object.entries(q)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join(':');
  return `sanpham:list:${phan || 'all'}`;
}

/** Gọi sau MỌI thao tác ghi để cache không trả dữ liệu cũ. */
async function xoaCacheSanPham() {
  await xoaCacheTheoMau('sanpham:*');
}

const SAP_XEP = {
  'moi-nhat': { taoLuc: 'desc' },
  'gia-tang': { giaVND: 'asc' },
  'gia-giam': { giaVND: 'desc' },
  ten: { ten: 'asc' },
};

export async function danhSach(q) {
  // Danh sách sản phẩm là dữ liệu CÔNG KHAI, giống nhau với mọi người
  // → cache được. Đơn hàng thì KHÔNG, vì mỗi người thấy dữ liệu khác nhau.
  const { duLieu, tuCache } = await cacheAside(khoaCacheDanhSach(q), CACHE_TTL, () =>
    truyVanDanhSach(q)
  );
  return { ...duLieu, tuCache };
}

async function truyVanDanhSach(q) {
  const where = {
    conBan: true,
    ...(q.danhMuc && { danhMuc: { slug: q.danhMuc } }),
    ...(q.conHang === true && { tonKho: { gt: 0 } }),
    ...(q.conHang === false && { tonKho: 0 }),
    ...((q.giaTu !== undefined || q.giaDen !== undefined) && {
      giaVND: {
        ...(q.giaTu !== undefined && { gte: q.giaTu }),
        ...(q.giaDen !== undefined && { lte: q.giaDen }),
      },
    }),
    ...(q.tuKhoa && {
      OR: [
        { ten: { contains: q.tuKhoa, mode: 'insensitive' } },
        { moTa: { contains: q.tuKhoa, mode: 'insensitive' } },
      ],
    }),
  };

  // Chạy SONG SONG hai truy vấn độc lập (bài học buổi 07) —
  // thay vì await lần lượt, tiết kiệm một nửa thời gian.
  const [tong, duLieu] = await Promise.all([
    prisma.sanPham.count({ where }),
    prisma.sanPham.findMany({
      where,
      orderBy: SAP_XEP[q.sapXep],
      skip: (q.trang - 1) * q.moiTrang,
      take: q.moiTrang,
      select: {
        id: true,
        ten: true,
        slug: true,
        giaVND: true,
        tonKho: true,
        danhMuc: { select: { ten: true, slug: true } },
      },
    }),
  ]);

  return {
    duLieu,
    phanTrang: {
      tong,
      trang: q.trang,
      moiTrang: q.moiTrang,
      tongSoTrang: Math.max(1, Math.ceil(tong / q.moiTrang)),
    },
  };
}

export async function layMot(id) {
  const sp = await prisma.sanPham.findUnique({
    where: { id },
    include: { danhMuc: { select: { ten: true, slug: true } } },
  });
  if (!sp || !sp.conBan) throw loi.khongTimThay(`Không có sản phẩm id = ${id}`);
  return sp;
}

export async function tao(nguoiDung, duLieu) {
  batBuocQuyen(nguoiDung, 'sanpham:tao');
  const sp = await prisma.sanPham.create({ data: duLieu });
  await xoaCacheSanPham();
  return sp;
}

export async function sua(nguoiDung, id, duLieu) {
  batBuocQuyen(nguoiDung, 'sanpham:sua');
  const sp = await prisma.sanPham.findUnique({ where: { id } });
  if (!sp) throw loi.khongTimThay(`Không có sản phẩm id = ${id}`);
  const daSua = await prisma.sanPham.update({ where: { id }, data: duLieu });
  await xoaCacheSanPham();
  return daSua;
}

export async function ngungBan(nguoiDung, id) {
  batBuocQuyen(nguoiDung, 'sanpham:xoa');
  const sp = await prisma.sanPham.findUnique({ where: { id } });
  if (!sp) throw loi.khongTimThay(`Không có sản phẩm id = ${id}`);

  // XOÁ MỀM: sản phẩm còn nằm trong đơn hàng cũ,
  // xoá thật sẽ phá vỡ lịch sử (và database cũng từ chối vì khoá ngoại).
  const kq = await prisma.sanPham.update({ where: { id }, data: { conBan: false } });
  await xoaCacheSanPham();
  return kq;
}
