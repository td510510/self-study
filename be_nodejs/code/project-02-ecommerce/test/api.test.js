/**
 * Project 2 — Test khung ứng dụng.
 *
 * ⚠️ Chạy trên DATABASE RIÊNG (shop_test), không đụng dữ liệu phát triển.
 * Xem npm script: `node --env-file=.env.test --test`
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { taoApp } from '../src/app.js';
import { taoLogger } from '../src/lib/logger.js';
import { prisma } from '../src/lib/prisma.js';
import { layRedis, dongRedis } from '../src/lib/redis.js';

const logger = taoLogger({ level: 'silent' });
// batRateLimit: false — test gọi hàng trăm request, bật rate limit là fail
const app = taoApp({ logger, batRateLimit: false });

let danhMucId;

async function donSach() {
  // ⚠️ Xoá cache trước: danh sách sản phẩm được cache (buổi 21),
  // không xoá thì test sau đọc phải dữ liệu của test trước.
  await layRedis().flushdb();

  // Xoá theo thứ tự NGƯỢC với quan hệ phụ thuộc,
  // nếu không sẽ vướng ràng buộc khoá ngoại.
  await prisma.donHangItem.deleteMany();
  await prisma.donHang.deleteMany();
  await prisma.gioHangItem.deleteMany();
  await prisma.sanPham.deleteMany();
  await prisma.danhMuc.deleteMany();
  await prisma.user.deleteMany();
}

async function taoNguoiDung(email, vaiTro) {
  await request(app)
    .post('/auth/dang-ky')
    .send({ email, ten: email, matKhau: 'matkhau-du-dai' })
    .expect(201);

  // Nâng quyền trực tiếp qua database — endpoint đăng ký KHÔNG cho chọn vai trò
  if (vaiTro !== 'khach') {
    await prisma.user.update({ where: { email }, data: { vaiTro } });
  }

  const r = await request(app)
    .post('/auth/dang-nhap')
    .send({ email, matKhau: 'matkhau-du-dai' })
    .expect(200);

  return { token: r.body.accessToken, id: r.body.user.id };
}

const nhu = (u) => ({
  get: (p) => request(app).get(p).set('Authorization', `Bearer ${u.token}`),
  post: (p) => request(app).post(p).set('Authorization', `Bearer ${u.token}`),
  patch: (p) => request(app).patch(p).set('Authorization', `Bearer ${u.token}`),
  delete: (p) => request(app).delete(p).set('Authorization', `Bearer ${u.token}`),
});

let khach, admin;

before(async () => {
  await donSach();

  const dm = await prisma.danhMuc.create({ data: { ten: 'Phụ kiện', slug: 'phu-kien' } });
  danhMucId = dm.id;

  await prisma.sanPham.createMany({
    data: [
      { ten: 'Tai nghe', slug: 'tai-nghe', giaVND: 1_290_000, tonKho: 10, danhMucId },
      { ten: 'Sạc nhanh', slug: 'sac-nhanh', giaVND: 450_000, tonKho: 0, danhMucId },
      { ten: 'Ốp lưng', slug: 'op-lung', giaVND: 120_000, tonKho: 50, danhMucId },
    ],
  });

  khach = await taoNguoiDung('khach@test.com', 'khach');
  admin = await taoNguoiDung('admin@test.com', 'admin');
});

after(async () => {
  await donSach();
  await prisma.$disconnect();
  // ⚠️ Redis giữ một handle đang mở → không đóng thì tiến trình test
  // KHÔNG BAO GIỜ THOÁT (nhớ bài học buổi 08 về process.exitCode).
  await dongRedis();
});

describe('Khung ứng dụng', () => {
  test('GET /health → 200', async () => {
    const r = await request(app).get('/health').expect(200);
    assert.equal(r.body.trangThai, 'ok');
  });

  test('mọi response có header X-Request-Id', async () => {
    const r = await request(app).get('/health').expect(200);
    assert.match(r.headers['x-request-id'], /^[0-9a-f-]{36}$/);
  });

  test('404 kèm mã lỗi ổn định', async () => {
    const r = await request(app).get('/khong-ton-tai').expect(404);
    assert.equal(r.body.ma, 'KHONG_TIM_THAY', 'frontend so khớp MÃ, không so khớp chuỗi tiếng Việt');
    assert.ok(r.body.requestId, 'lỗi phải kèm requestId để tra log');
  });
});

describe('Sản phẩm — công khai', () => {
  test('xem danh sách KHÔNG cần đăng nhập', async () => {
    const r = await request(app).get('/san-pham').expect(200);
    assert.equal(r.body.phanTrang.tong, 3);
  });

  test('lọc theo còn hàng', async () => {
    const r = await request(app).get('/san-pham?conHang=true').expect(200);
    assert.equal(r.body.phanTrang.tong, 2, 'sản phẩm hết hàng bị loại');
  });

  test('sắp xếp theo giá tăng dần', async () => {
    const r = await request(app).get('/san-pham?sapXep=gia-tang').expect(200);
    const gia = r.body.duLieu.map((s) => s.giaVND);
    assert.deepEqual(gia, [...gia].sort((a, b) => a - b));
  });

  test('lọc theo khoảng giá', async () => {
    const r = await request(app).get('/san-pham?giaTu=100000&giaDen=500000').expect(200);
    assert.equal(r.body.phanTrang.tong, 2);
  });

  test('tìm theo từ khoá, không phân biệt hoa thường', async () => {
    const r = await request(app).get('/san-pham?tuKhoa=TAI NGHE').expect(200);
    assert.equal(r.body.phanTrang.tong, 1);
  });

  test('tham số phân trang sai → 400', async () => {
    const r = await request(app).get('/san-pham?trang=0').expect(400);
    assert.equal(r.body.ma, 'DU_LIEU_SAI');
  });
});

describe('Sản phẩm — quản trị', () => {
  test('khách KHÔNG tạo được sản phẩm → 403', async () => {
    const r = await nhu(khach)
      .post('/san-pham')
      .send({ ten: 'X', slug: 'x', giaVND: 1000, danhMucId })
      .expect(403);
    assert.equal(r.body.ma, 'KHONG_DU_QUYEN');
  });

  test('chưa đăng nhập → 401 (không phải 403)', async () => {
    await request(app)
      .post('/san-pham')
      .send({ ten: 'X', slug: 'x', giaVND: 1000, danhMucId })
      .expect(401);
  });

  test('admin tạo được sản phẩm → 201', async () => {
    const r = await nhu(admin)
      .post('/san-pham')
      .send({ ten: 'Cáp sạc', slug: 'cap-sac', giaVND: 99_000, tonKho: 30, danhMucId })
      .expect(201);
    assert.equal(r.body.giaVND, 99_000);
  });

  test('slug trùng → 409 với mã TRUNG_DU_LIEU', async () => {
    const r = await nhu(admin)
      .post('/san-pham')
      .send({ ten: 'Khác', slug: 'cap-sac', giaVND: 1000, danhMucId })
      .expect(409);
    assert.equal(r.body.ma, 'TRUNG_DU_LIEU');
  });

  test('giá là số thực → 400 (tiền phải là số nguyên)', async () => {
    const r = await nhu(admin)
      .post('/san-pham')
      .send({ ten: 'Y', slug: 'y', giaVND: 99.5, danhMucId })
      .expect(400);
    assert.ok(r.body.chiTiet.giaVND);
  });

  test('slug sai định dạng → 400', async () => {
    await nhu(admin)
      .post('/san-pham')
      .send({ ten: 'Z', slug: 'Chữ Hoa Và Dấu Cách', giaVND: 1000, danhMucId })
      .expect(400);
  });

  test('xoá là XOÁ MỀM — sản phẩm biến khỏi danh sách nhưng còn trong DB', async () => {
    const tao = await nhu(admin)
      .post('/san-pham')
      .send({ ten: 'Tạm', slug: 'tam', giaVND: 1000, danhMucId })
      .expect(201);

    await nhu(admin).delete(`/san-pham/${tao.body.id}`).expect(204);

    await request(app).get(`/san-pham/${tao.body.id}`).expect(404);

    const conTrongDb = await prisma.sanPham.findUnique({ where: { id: tao.body.id } });
    assert.ok(conTrongDb, 'bản ghi VẪN CÒN trong database');
    assert.equal(conTrongDb.conBan, false, 'chỉ đánh dấu ngừng bán');
  });
});

describe('Xác thực', () => {
  test('đăng ký tự tạo giỏ hàng rỗng', async () => {
    const gio = await prisma.gioHang.findUnique({ where: { userId: khach.id } });
    assert.ok(gio, 'mỗi user phải có sẵn một giỏ hàng');
  });

  test('đăng ký KHÔNG cho tự chọn vai trò', async () => {
    // .strict() từ chối trường lạ — chống tự nâng quyền thành admin
    await request(app)
      .post('/auth/dang-ky')
      .send({ email: 'hacker@test.com', ten: 'H', matKhau: 'matkhau-du-dai', vaiTro: 'admin' })
      .expect(400);
  });

  test('không lộ hash mật khẩu ở bất kỳ đâu', async () => {
    const r = await nhu(khach).get('/auth/toi').expect(200);
    assert.equal(r.body.matKhauHash, undefined);
    assert.equal(r.text.includes('$2b$'), false);
  });
});
