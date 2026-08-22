/**
 * Buổi 19 — Test tranh chấp.
 *
 * Loại test này ÍT KHI được viết, nhưng lại canh giữ lớp bug đắt giá nhất:
 * bug chỉ xuất hiện khi có nhiều người dùng đồng thời.
 */

import { test, describe, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import { prisma } from '../src/lib/prisma.js';
import { dongRedis } from '../src/lib/redis.js';
import {
  datHangNgayTho,
  datHangCoTransaction,
  datHangAnToan,
} from '../src/modules/donhang/donhang.service.js';

const TON_KHO = 5;
const SO_NGUOI = 10;
const DIA_CHI = { diaChiGiao: '123 Đường Test, Quận 1', soDienThoai: '0901234567' };

let sanPhamId;
let users = [];

async function donSach() {
  await prisma.donHangItem.deleteMany();
  await prisma.donHang.deleteMany();
  await prisma.gioHangItem.deleteMany();
  await prisma.gioHang.deleteMany();
  await prisma.sanPham.deleteMany();
  await prisma.danhMuc.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

/** Dựng lại: 1 sản phẩm còn 5 cái, 10 người mỗi người 1 món trong giỏ. */
async function dungLai() {
  await donSach();

  const dm = await prisma.danhMuc.create({ data: { ten: 'Test', slug: 'test' } });
  const sp = await prisma.sanPham.create({
    data: { ten: 'Hàng hiếm', slug: 'hang-hiem', giaVND: 1_000_000, tonKho: TON_KHO, danhMucId: dm.id },
  });
  sanPhamId = sp.id;

  users = [];
  for (let i = 0; i < SO_NGUOI; i++) {
    users.push(
      await prisma.user.create({
        data: {
          email: `nguoi${i}@test.com`,
          ten: `Người ${i}`,
          matKhauHash: '$2b$04$khonglaimatkhauthatchidedemo000000000000000000000000',
          gioHang: { create: { items: { create: { sanPhamId: sp.id, soLuong: 1 } } } },
        },
      })
    );
  }
}

/** Bắn tất cả cùng lúc — đây là chìa khoá tái hiện tranh chấp. */
async function datHangDongThoi(datHang) {
  const kq = await Promise.allSettled(users.map((u) => datHang(u.id, DIA_CHI)));
  const sp = await prisma.sanPham.findUnique({ where: { id: sanPhamId } });

  return {
    thanhCong: kq.filter((r) => r.status === 'fulfilled').length,
    thatBai: kq.filter((r) => r.status === 'rejected').length,
    tonKho: sp.tonKho,
    soDon: await prisma.donHang.count(),
  };
}

before(async () => { await dungLai(); });
beforeEach(async () => { await dungLai(); });
after(async () => {
  await donSach();
  await prisma.$disconnect();
  // ⚠️ Redis giữ một handle đang mở → không đóng thì tiến trình test
  // KHÔNG BAO GIỜ THOÁT (nhớ bài học buổi 08 về process.exitCode).
  await dongRedis();
});

describe('🚨 Tranh chấp — chứng minh hai phiên bản SAI', () => {
  test('KHÔNG transaction → bán quá số hàng, tồn kho ÂM', async () => {
    const r = await datHangDongThoi(datHangNgayTho);

    assert.ok(r.thanhCong > TON_KHO, `bán ${r.thanhCong} cái dù chỉ có ${TON_KHO}`);
    assert.ok(r.tonKho < 0, `tồn kho phải ÂM, thực tế: ${r.tonKho}`);
  });

  test('CÓ transaction nhưng KHÔNG khoá → VẪN sai', async () => {
    const r = await datHangDongThoi(datHangCoTransaction);

    // Điểm dạy: bọc transaction KHÔNG đủ.
    // Transaction đảm bảo tính nguyên tử, không ngăn được đọc giá trị cũ.
    assert.ok(r.thanhCong > TON_KHO, 'transaction một mình không đủ');
    assert.ok(r.tonKho < 0, 'tồn kho vẫn âm');
  });
});

describe('✅ Phiên bản an toàn', () => {
  test('transaction + khoá dòng → bán ĐÚNG số hàng có', async () => {
    const r = await datHangDongThoi(datHangAnToan);

    assert.equal(r.thanhCong, TON_KHO, `phải bán đúng ${TON_KHO} cái`);
    assert.equal(r.thatBai, SO_NGUOI - TON_KHO);
    assert.equal(r.tonKho, 0, 'tồn kho về 0, KHÔNG âm');
    assert.equal(r.soDon, TON_KHO, 'số đơn khớp số hàng bán ra');
  });

  test('rollback: đơn thất bại KHÔNG để lại rác', async () => {
    await datHangDongThoi(datHangAnToan);

    // 5 người thất bại — giỏ hàng của họ phải CÒN NGUYÊN,
    // vì transaction rollback trả lại mọi thứ như cũ.
    const soGioConHang = await prisma.gioHangItem.count();
    assert.equal(soGioConHang, SO_NGUOI - TON_KHO, 'giỏ của người thất bại còn nguyên');

    // Và không có DonHangItem mồ côi
    const soItem = await prisma.donHangItem.count();
    assert.equal(soItem, TON_KHO);
  });

  test('mua nhiều hơn tồn kho → từ chối với mã HET_HANG', async () => {
    await dungLai();
    await prisma.gioHangItem.updateMany({ data: { soLuong: 99 } });

    await assert.rejects(
      () => datHangAnToan(users[0].id, DIA_CHI),
      (err) => {
        assert.equal(err.statusCode, 409);
        assert.equal(err.ma, 'HET_HANG');
        return true;
      }
    );

    const sp = await prisma.sanPham.findUnique({ where: { id: sanPhamId } });
    assert.equal(sp.tonKho, TON_KHO, 'tồn kho KHÔNG bị trừ khi đơn thất bại');
  });

  test('giỏ rỗng → 400', async () => {
    await prisma.gioHangItem.deleteMany();
    await assert.rejects(() => datHangAnToan(users[0].id, DIA_CHI), /trống/);
  });
});

describe('Đơn hàng chép lại lịch sử (buổi 18)', () => {
  test('đổi giá sản phẩm KHÔNG làm đổi đơn hàng cũ', async () => {
    const don = await datHangAnToan(users[0].id, DIA_CHI);
    const giaLucMua = don.items[0].giaVND;

    // Shop tăng giá gấp đôi
    await prisma.sanPham.update({
      where: { id: sanPhamId },
      data: { giaVND: giaLucMua * 2, ten: 'Tên mới hoàn toàn' },
    });

    const donSauKhiDoiGia = await prisma.donHang.findUnique({
      where: { id: don.id },
      include: { items: true },
    });

    assert.equal(donSauKhiDoiGia.items[0].giaVND, giaLucMua, 'giá trong đơn GIỮ NGUYÊN');
    assert.equal(donSauKhiDoiGia.items[0].tenSanPham, 'Hàng hiếm', 'tên cũng giữ nguyên');
    assert.equal(donSauKhiDoiGia.tongTienVND, don.tongTienVND);
  });

  test('KHÔNG xoá được sản phẩm còn trong đơn hàng', async () => {
    await datHangAnToan(users[0].id, DIA_CHI);

    // Database TỪ CHỐI — vì DonHangItem không dùng onDelete: Cascade
    await assert.rejects(
      () => prisma.sanPham.delete({ where: { id: sanPhamId } }),
      (err) => {
        assert.equal(err.code, 'P2003', 'vi phạm ràng buộc khoá ngoại');
        return true;
      }
    );
  });
});
