/**
 * Buổi 24 — Test idempotency key.
 */

import { test, describe, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { taoApp } from '../src/app.js';
import { taoLogger } from '../src/lib/logger.js';
import { prisma } from '../src/lib/prisma.js';
import { layRedis, dongRedis } from '../src/lib/redis.js';

const app = taoApp({ logger: taoLogger({ level: 'silent' }), batRateLimit: false });
const DIA_CHI = { diaChiGiao: '123 Đường Test, Quận 1', soDienThoai: '0901234567' };

let token, sanPhamId;

async function donSach() {
  await layRedis().flushdb();
  await prisma.donHangItem.deleteMany();
  await prisma.donHang.deleteMany();
  await prisma.gioHangItem.deleteMany();
  await prisma.gioHang.deleteMany();
  await prisma.sanPham.deleteMany();
  await prisma.danhMuc.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

async function dungLai() {
  await donSach();

  const dm = await prisma.danhMuc.create({ data: { ten: 'Test', slug: 'test' } });
  const sp = await prisma.sanPham.create({
    data: { ten: 'Hàng', slug: 'hang', giaVND: 500_000, tonKho: 50, danhMucId: dm.id },
  });
  sanPhamId = sp.id;

  await request(app)
    .post('/auth/dang-ky')
    .send({ email: 'k@test.com', ten: 'K', matKhau: 'matkhau-du-dai' })
    .expect(201);

  const dn = await request(app)
    .post('/auth/dang-nhap')
    .send({ email: 'k@test.com', matKhau: 'matkhau-du-dai' })
    .expect(200);
  token = dn.body.accessToken;

  await request(app)
    .post('/gio-hang/items')
    .set('Authorization', `Bearer ${token}`)
    .send({ sanPhamId, soLuong: 1 })
    .expect(201);
}

const datHang = (khoa) => {
  const r = request(app)
    .post('/don-hang')
    .set('Authorization', `Bearer ${token}`);
  if (khoa) r.set('Idempotency-Key', khoa);
  return r.send(DIA_CHI);
};

before(dungLai);
beforeEach(dungLai);
after(async () => {
  await donSach();
  await prisma.$disconnect();
  await dongRedis();
});

describe('Không có Idempotency-Key', () => {
  test('🚨 bấm hai lần → HAI đơn hàng', async () => {
    await datHang().expect(201);

    // Giỏ đã bị xoá sau đơn 1 → đơn 2 lỗi vì giỏ trống.
    // Nên ta nạp lại giỏ để mô phỏng đúng tình huống "bấm hai lần".
    await request(app)
      .post('/gio-hang/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ sanPhamId, soLuong: 1 });

    await datHang().expect(201);

    assert.equal(await prisma.donHang.count(), 2, 'tạo ra hai đơn khác nhau');
  });
});

describe('Có Idempotency-Key', () => {
  test('gọi lại cùng khoá → trả KẾT QUẢ CŨ, không tạo đơn mới', async () => {
    const KHOA = 'khoa-dat-hang-12345';

    const lan1 = await datHang(KHOA).expect(201);
    const lan2 = await datHang(KHOA).expect(201);

    assert.equal(lan2.body.id, lan1.body.id, 'trả về CÙNG một đơn hàng');
    assert.equal(lan2.body.maDon, lan1.body.maDon);
    assert.equal(lan2.headers['idempotency-replayed'], 'true', 'báo cho client biết là bản cũ');

    assert.equal(await prisma.donHang.count(), 1, 'CHỈ MỘT đơn được tạo');
  });

  test('tồn kho chỉ bị trừ MỘT lần', async () => {
    const KHOA = 'khoa-ton-kho';
    await datHang(KHOA).expect(201);
    await datHang(KHOA).expect(201);

    const sp = await prisma.sanPham.findUnique({ where: { id: sanPhamId } });
    assert.equal(sp.tonKho, 49, 'trừ đúng 1, không phải 2');
  });

  test('🚨 cùng khoá nhưng NỘI DUNG KHÁC → 409', async () => {
    const KHOA = 'khoa-noi-dung-khac';
    await datHang(KHOA).expect(201);

    const r = await request(app)
      .post('/don-hang')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', KHOA)
      .send({ diaChiGiao: 'ĐỊA CHỈ HOÀN TOÀN KHÁC', soDienThoai: '0909999999' })
      .expect(409);

    assert.match(r.body.loi, /nội dung khác/);
  });

  test('khoá quá ngắn → 400', async () => {
    const r = await datHang('abc').expect(400);
    assert.match(r.body.loi, /8–200/);
  });

  test('hai người dùng KHÁC NHAU dùng CÙNG khoá → không đụng nhau', async () => {
    const KHOA = 'khoa-dung-chung';
    await datHang(KHOA).expect(201);

    // Người thứ hai
    await request(app)
      .post('/auth/dang-ky')
      .send({ email: 'k2@test.com', ten: 'K2', matKhau: 'matkhau-du-dai' })
      .expect(201);
    const dn2 = await request(app)
      .post('/auth/dang-nhap')
      .send({ email: 'k2@test.com', matKhau: 'matkhau-du-dai' })
      .expect(200);

    await request(app)
      .post('/gio-hang/items')
      .set('Authorization', `Bearer ${dn2.body.accessToken}`)
      .send({ sanPhamId, soLuong: 1 })
      .expect(201);

    // Khoá được gắn với userId → người 2 vẫn đặt được đơn của mình
    const r = await request(app)
      .post('/don-hang')
      .set('Authorization', `Bearer ${dn2.body.accessToken}`)
      .set('Idempotency-Key', KHOA)
      .send(DIA_CHI)
      .expect(201);

    assert.equal(r.headers['idempotency-replayed'], undefined, 'KHÔNG phải bản cũ');
    assert.equal(await prisma.donHang.count(), 2, 'hai đơn của hai người');
  });

  test('request THẤT BẠI thì khoá được giải phóng để thử lại', async () => {
    const KHOA = 'khoa-that-bai';

    // Giỏ trống → đặt hàng thất bại
    await prisma.gioHangItem.deleteMany();
    await datHang(KHOA).expect(400);

    // Nạp lại giỏ rồi thử lại CÙNG khoá → phải thành công
    await request(app)
      .post('/gio-hang/items')
      .set('Authorization', `Bearer ${token}`)
      .send({ sanPhamId, soLuong: 1 })
      .expect(201);

    await datHang(KHOA).expect(201);
  });
});
