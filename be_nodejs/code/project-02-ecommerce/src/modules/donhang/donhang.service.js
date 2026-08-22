/**
 * Buổi 19 — Đặt hàng: BA phiên bản để so sánh.
 *
 *   1. datHangNgayTho()   ❌ không transaction → tồn kho ÂM khi có tranh chấp
 *   2. datHangCoTransaction() ⚠️ có transaction nhưng VẪN sai
 *   3. datHangAnToan()    ✅ transaction + khoá dòng
 *
 * Chạy src/demo-tranh-chap.js để thấy khác biệt bằng số liệu thật.
 */

import { randomBytes } from 'node:crypto';
import { prisma } from '../../lib/prisma.js';
import { loi } from '../../lib/errors.js';
import { batBuocQuyen } from '../../lib/quyen.js';
import { baoChoNguoiDung, baoChoNhanVien } from '../../lib/realtime.js';

/** Mã đơn hiển thị cho khách — không lộ số đơn hàng của shop (buổi 18). */
function sinhMaDon() {
  const ngay = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const nhanNgauNhien = randomBytes(3).toString('hex').toUpperCase();
  return `DH-${ngay}-${nhanNgauNhien}`;
}

/** Lấy giỏ hàng kèm sản phẩm, hoặc ném lỗi nếu giỏ rỗng. */
async function layGioHangCoHang(userId, khach = prisma) {
  const gio = await khach.gioHang.findUnique({
    where: { userId },
    include: { items: { include: { sanPham: true } } },
  });

  if (!gio || gio.items.length === 0) throw loi.duLieuSai('Giỏ hàng đang trống');
  return gio;
}

// ═══════════════════════════════════════════════════════════════
// ❌ PHIÊN BẢN 1 — NGÂY THƠ
// ═══════════════════════════════════════════════════════════════
/**
 * Code này TRÔNG HOÀN TOÀN HỢP LÝ. Nó đọc tồn kho, kiểm tra, rồi trừ.
 *
 * Nhưng giữa lúc ĐỌC và lúc TRỪ có một khoảng thời gian.
 * Trong khoảng đó, một request khác cũng đọc được con số cũ.
 * → Cả hai đều thấy "còn 1", cả hai đều trừ → tồn kho ÂM.
 *
 * Đây là RACE CONDITION (tranh chấp) — lớp bug mà frontend
 * gần như không bao giờ gặp, vì frontend chỉ có MỘT người dùng.
 */
export async function datHangNgayTho(userId, { diaChiGiao, soDienThoai }) {
  const gio = await layGioHangCoHang(userId);

  // BƯỚC 1: ĐỌC tồn kho và kiểm tra
  for (const item of gio.items) {
    if (item.sanPham.tonKho < item.soLuong) {
      throw loi.hetHang(item.sanPham.ten, item.sanPham.tonKho);
    }
  }

  const tongTien = gio.items.reduce((s, i) => s + i.sanPham.giaVND * i.soLuong, 0);

  // BƯỚC 2: TRỪ kho
  // ⚠️ Giữa BƯỚC 1 và BƯỚC 2, request khác có thể đã trừ mất rồi.
  for (const item of gio.items) {
    await prisma.sanPham.update({
      where: { id: item.sanPhamId },
      data: { tonKho: { decrement: item.soLuong } },
    });
  }

  const don = await prisma.donHang.create({
    data: {
      maDon: sinhMaDon(),
      userId,
      diaChiGiao,
      soDienThoai,
      tongTienVND: tongTien,
      items: {
        create: gio.items.map((i) => ({
          sanPhamId: i.sanPhamId,
          tenSanPham: i.sanPham.ten,  // CHÉP LẠI lịch sử (buổi 18)
          giaVND: i.sanPham.giaVND,
          soLuong: i.soLuong,
        })),
      },
    },
    include: { items: true },
  });

  await prisma.gioHangItem.deleteMany({ where: { gioHangId: gio.id } });
  return don;
}

// ═══════════════════════════════════════════════════════════════
// ⚠️ PHIÊN BẢN 2 — CÓ TRANSACTION NHƯNG VẪN SAI
// ═══════════════════════════════════════════════════════════════
/**
 * Học viên hay nghĩ: "bọc transaction vào là xong".
 *
 * KHÔNG PHẢI. Transaction đảm bảo TÍNH NGUYÊN TỬ
 * ("hoặc làm hết, hoặc không làm gì") — nó KHÔNG tự động
 * ngăn hai transaction cùng đọc một giá trị cũ.
 *
 * Ở mức cô lập mặc định của PostgreSQL (READ COMMITTED),
 * hai transaction vẫn đọc được cùng một con số tồn kho.
 */
export async function datHangCoTransaction(userId, { diaChiGiao, soDienThoai }) {
  return prisma.$transaction(async (tx) => {
    const gio = await layGioHangCoHang(userId, tx);

    for (const item of gio.items) {
      // Vẫn là ĐỌC thường — không khoá gì cả
      const sp = await tx.sanPham.findUnique({ where: { id: item.sanPhamId } });
      if (sp.tonKho < item.soLuong) throw loi.hetHang(sp.ten, sp.tonKho);
    }

    const tongTien = gio.items.reduce((s, i) => s + i.sanPham.giaVND * i.soLuong, 0);

    for (const item of gio.items) {
      await tx.sanPham.update({
        where: { id: item.sanPhamId },
        data: { tonKho: { decrement: item.soLuong } },
      });
    }

    const don = await tx.donHang.create({
      data: {
        maDon: sinhMaDon(),
        userId,
        diaChiGiao,
        soDienThoai,
        tongTienVND: tongTien,
        items: {
          create: gio.items.map((i) => ({
            sanPhamId: i.sanPhamId,
            tenSanPham: i.sanPham.ten,
            giaVND: i.sanPham.giaVND,
            soLuong: i.soLuong,
          })),
        },
      },
      include: { items: true },
    });

    await tx.gioHangItem.deleteMany({ where: { gioHangId: gio.id } });
    return don;
  });
}

// ═══════════════════════════════════════════════════════════════
// ✅ PHIÊN BẢN 3 — AN TOÀN
// ═══════════════════════════════════════════════════════════════
/**
 * Hai kỹ thuật, dùng CẢ HAI:
 *
 * (a) KHOÁ DÒNG BI QUAN — SELECT ... FOR UPDATE
 *     Transaction đầu tiên khoá dòng sản phẩm lại.
 *     Transaction thứ hai PHẢI CHỜ tới khi cái đầu commit,
 *     rồi mới đọc — và khi đó nó đọc được con số ĐÃ CẬP NHẬT.
 *
 * (b) RÀNG BUỘC Ở TẦNG DATABASE — điều kiện trong WHERE
 *     Câu UPDATE chỉ trừ kho KHI tồn kho còn đủ.
 *     Nếu không đủ, nó cập nhật 0 dòng → ta biết và rollback.
 *     Đây là lưới an toàn cuối cùng, không phụ thuộc vào code đúng.
 */
export async function datHangAnToan(userId, { diaChiGiao, soDienThoai }) {
  return prisma.$transaction(
    async (tx) => {
      const gio = await layGioHangCoHang(userId, tx);

      // Sắp xếp theo id để MỌI transaction khoá theo CÙNG MỘT THỨ TỰ.
      // Không có bước này, hai transaction khoá chéo nhau → DEADLOCK.
      const items = [...gio.items].sort((a, b) => a.sanPhamId - b.sanPhamId);

      for (const item of items) {
        // (a) Khoá dòng. $queryRaw vì Prisma không có API cho FOR UPDATE.
        const [sp] = await tx.$queryRaw`
          SELECT id, ten, "tonKho" FROM san_phams
          WHERE id = ${item.sanPhamId}
          FOR UPDATE
        `;

        if (!sp) throw loi.khongTimThay(`Sản phẩm id=${item.sanPhamId} không tồn tại`);
        if (sp.tonKho < item.soLuong) throw loi.hetHang(sp.ten, sp.tonKho);
      }

      const tongTien = items.reduce((s, i) => s + i.sanPham.giaVND * i.soLuong, 0);

      for (const item of items) {
        // (b) Điều kiện tonKho >= soLuong nằm NGAY TRONG câu UPDATE.
        // updateMany trả về số dòng bị ảnh hưởng — 0 nghĩa là không đủ hàng.
        const kq = await tx.sanPham.updateMany({
          where: { id: item.sanPhamId, tonKho: { gte: item.soLuong } },
          data: { tonKho: { decrement: item.soLuong } },
        });

        if (kq.count === 0) {
          // Ném lỗi → toàn bộ transaction ROLLBACK, kể cả các sản phẩm đã trừ
          throw loi.hetHang(item.sanPham.ten, 0);
        }
      }

      const don = await tx.donHang.create({
        data: {
          maDon: sinhMaDon(),
          userId,
          diaChiGiao,
          soDienThoai,
          tongTienVND: tongTien,
          items: {
            create: items.map((i) => ({
              sanPhamId: i.sanPhamId,
              tenSanPham: i.sanPham.ten,
              giaVND: i.sanPham.giaVND,
              soLuong: i.soLuong,
            })),
          },
        },
        include: { items: true },
      });

      await tx.gioHangItem.deleteMany({ where: { gioHangId: gio.id } });
      return don;
    },
    {
      // Transaction giữ khoá — phải có hạn chót, nếu không một transaction
      // treo sẽ chặn mọi người mua sản phẩm đó.
      timeout: 10_000,
      maxWait: 5_000,
    }
  );
}

// ═══════════════════════════════════════════════════════════════

export async function danhSach(nguoiDung) {
  const where = nguoiDung.vaiTro === 'khach' ? { userId: nguoiDung.id } : {};

  return prisma.donHang.findMany({
    where,
    orderBy: { taoLuc: 'desc' },
    select: {
      id: true,
      maDon: true,
      trangThai: true,
      tongTienVND: true,
      taoLuc: true,
      userId: true,
      _count: { select: { items: true } },
    },
  });
}

export async function layMot(id, nguoiDung) {
  const don = await prisma.donHang.findUnique({ where: { id }, include: { items: true } });
  if (!don) throw loi.khongTimThay(`Không có đơn hàng id = ${id}`);

  // Kiểm quyền theo CHỦ SỞ HỮU (buổi 16) — TÌM → KIỂM QUYỀN → HÀNH ĐỘNG
  batBuocQuyen(nguoiDung, 'donhang:doc', don, 'userId');
  return don;
}


// ═══════════════════════════════════════════════════════════════
// Buổi 25 — Đổi trạng thái đơn + báo realtime
// ═══════════════════════════════════════════════════════════════

/**
 * Máy trạng thái: chỉ cho phép chuyển theo đúng luồng, không nhảy cóc.
 * Đưa luật này vào DỮ LIỆU thay vì rải if/else — dễ đọc, dễ sửa, dễ test.
 */
const CHUYEN_HOP_LE = {
  choXacNhan: ['daXacNhan', 'daHuy'],
  daXacNhan: ['dangGiao', 'daHuy'],
  dangGiao: ['daGiao'],
  daGiao: [],
  daHuy: [],
};

export async function doiTrangThai(id, nguoiDung, trangThaiMoi) {
  const don = await prisma.donHang.findUnique({ where: { id } });
  if (!don) throw loi.khongTimThay(`Không có đơn hàng id = ${id}`);

  batBuocQuyen(nguoiDung, 'donhang:capnhat', don, 'userId');

  const choPhep = CHUYEN_HOP_LE[don.trangThai] ?? [];
  if (!choPhep.includes(trangThaiMoi)) {
    throw loi.xungDot(
      `Không thể chuyển từ "${don.trangThai}" sang "${trangThaiMoi}". ` +
        `Chỉ cho phép: ${choPhep.join(', ') || '(trạng thái cuối)'}`
    );
  }

  const daSua = await prisma.donHang.update({
    where: { id },
    data: { trangThai: trangThaiMoi },
  });

  // ⚠️ Phát sự kiện SAU KHI ghi database thành công.
  // Phát trước mà transaction rollback là báo tin sai cho khách hàng.
  baoChoNguoiDung(don.userId, 'don-hang:doi-trang-thai', {
    id: daSua.id,
    maDon: daSua.maDon,
    trangThai: daSua.trangThai,
  });

  return daSua;
}
