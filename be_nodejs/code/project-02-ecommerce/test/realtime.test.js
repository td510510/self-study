/**
 * Buổi 25 — Test realtime với Socket.IO client thật.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import request from 'supertest';
import { io as taoClient } from 'socket.io-client';

import { taoApp } from '../src/app.js';
import { taoLogger } from '../src/lib/logger.js';
import { prisma } from '../src/lib/prisma.js';
import { layRedis, dongRedis } from '../src/lib/redis.js';
import { taoRealtime, dongRealtime } from '../src/lib/realtime.js';

const logger = taoLogger({ level: 'silent' });
const app = taoApp({ logger, batRateLimit: false });

let server, cong, tokenKhach, tokenAdmin, idKhach, sanPhamId;

/** Chờ một sự kiện, hoặc hết giờ. */
function choSuKien(socket, ten, msec = 3000) {
  return new Promise((resolve, reject) => {
    const dongHo = setTimeout(() => reject(new Error(`Hết giờ chờ sự kiện "${ten}"`)), msec);
    socket.once(ten, (duLieu) => {
      clearTimeout(dongHo);
      resolve(duLieu);
    });
  });
}

function ketNoi(token) {
  return new Promise((resolve, reject) => {
    const s = taoClient(`http://localhost:${cong}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
    });
    s.on('connect', () => resolve(s));
    s.on('connect_error', reject);
  });
}

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

before(async () => {
  await donSach();

  server = http.createServer(app);
  taoRealtime(server, { origins: ['http://localhost:5173'], logger });
  await new Promise((r) => server.listen(0, r));
  cong = server.address().port;

  const dm = await prisma.danhMuc.create({ data: { ten: 'Test', slug: 'test' } });
  const sp = await prisma.sanPham.create({
    data: { ten: 'Hàng', slug: 'hang', giaVND: 500_000, tonKho: 50, danhMucId: dm.id },
  });
  sanPhamId = sp.id;

  for (const [email, vaiTro] of [['khach@t.com', 'khach'], ['admin@t.com', 'admin']]) {
    await request(app)
      .post('/auth/dang-ky')
      .send({ email, ten: email, matKhau: 'matkhau-du-dai' })
      .expect(201);
    if (vaiTro !== 'khach') {
      await prisma.user.update({ where: { email }, data: { vaiTro } });
    }
  }

  const dnK = await request(app)
    .post('/auth/dang-nhap')
    .send({ email: 'khach@t.com', matKhau: 'matkhau-du-dai' });
  tokenKhach = dnK.body.accessToken;
  idKhach = dnK.body.user.id;

  const dnA = await request(app)
    .post('/auth/dang-nhap')
    .send({ email: 'admin@t.com', matKhau: 'matkhau-du-dai' });
  tokenAdmin = dnA.body.accessToken;
});

after(async () => {
  await dongRealtime();
  await new Promise((r) => server.close(r));
  await donSach();
  await prisma.$disconnect();
  await dongRedis();
});

describe('Xác thực WebSocket', () => {
  test('token hợp lệ → kết nối được', async () => {
    const s = await ketNoi(tokenKhach);
    assert.equal(s.connected, true);
    s.disconnect();
  });

  test('🚨 KHÔNG có token → TỪ CHỐI kết nối', async () => {
    await assert.rejects(() => ketNoi(undefined), /Thiếu token/);
  });

  test('🚨 token giả → TỪ CHỐI kết nối', async () => {
    await assert.rejects(() => ketNoi('token.gia.mao'), /không hợp lệ/);
  });
});

describe('Room — gửi đúng người', () => {
  test('khách nhận được thông báo đơn hàng CỦA MÌNH', async () => {
    const s = await ketNoi(tokenKhach);

    await request(app)
      .post('/gio-hang/items')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({ sanPhamId, soLuong: 1 })
      .expect(201);

    const don = await request(app)
      .post('/don-hang')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({ diaChiGiao: '123 Đường Test', soDienThoai: '0901234567' })
      .expect(201);

    const cho = choSuKien(s, 'don-hang:doi-trang-thai');

    await request(app)
      .patch(`/don-hang/${don.body.id}/trang-thai`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ trangThai: 'daXacNhan' })
      .expect(200);

    const tin = await cho;
    assert.equal(tin.maDon, don.body.maDon);
    assert.equal(tin.trangThai, 'daXacNhan');

    s.disconnect();
  });

  test('nhân viên nhận được thông báo ĐƠN MỚI', async () => {
    const sAdmin = await ketNoi(tokenAdmin);
    const cho = choSuKien(sAdmin, 'don-hang:moi');

    await request(app)
      .post('/gio-hang/items')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({ sanPhamId, soLuong: 1 })
      .expect(201);

    await request(app)
      .post('/don-hang')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({ diaChiGiao: '456 Đường Khác', soDienThoai: '0901234567' })
      .expect(201);

    const tin = await cho;
    assert.ok(tin.maDon);
    sAdmin.disconnect();
  });

  test('🔒 khách KHÔNG nhận được thông báo dành cho nhân viên', async () => {
    const sKhach = await ketNoi(tokenKhach);

    let nhanNham = false;
    sKhach.on('don-hang:moi', () => { nhanNham = true; });

    await request(app)
      .post('/gio-hang/items')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({ sanPhamId, soLuong: 1 })
      .expect(201);

    await request(app)
      .post('/don-hang')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({ diaChiGiao: '789 Đường Nữa', soDienThoai: '0901234567' })
      .expect(201);

    await new Promise((r) => setTimeout(r, 300));
    assert.equal(nhanNham, false, 'khách KHÔNG được vào room nhân viên');

    sKhach.disconnect();
  });
});

describe('Máy trạng thái đơn hàng', () => {
  /** Tạo một đơn mới cho mỗi test — độc lập, không phụ thuộc thứ tự. */
  async function taoDon() {
    const g = await request(app)
      .post('/gio-hang/items')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({ sanPhamId, soLuong: 1 });
    if (g.status !== 201) throw new Error(`thêm giỏ lỗi ${g.status}: ${JSON.stringify(g.body)}`);

    const r = await request(app)
      .post('/don-hang')
      .set('Authorization', `Bearer ${tokenKhach}`)
      .send({ diaChiGiao: '12 Đường Test', soDienThoai: '0901234567' });
    if (r.status !== 201) throw new Error(`đặt hàng lỗi ${r.status}: ${JSON.stringify(r.body)}`);
    return r.body.id;
  }

  const doi = (donId, trangThai, token = tokenAdmin) =>
    request(app)
      .patch(`/don-hang/${donId}/trang-thai`)
      .set('Authorization', `Bearer ${token}`)
      .send({ trangThai });

  test('🚨 KHÔNG cho nhảy cóc trạng thái', async () => {
    const donId = await taoDon();
    // choXacNhan → daGiao là nhảy cóc, bỏ qua daXacNhan và dangGiao
    const r = await doi(donId, 'daGiao').expect(409);
    assert.match(r.body.loi, /Không thể chuyển/);
  });

  test('chuyển đúng luồng → 200', async () => {
    const donId = await taoDon();
    await doi(donId, 'daXacNhan').expect(200);
    await doi(donId, 'dangGiao').expect(200);
    await doi(donId, 'daGiao').expect(200);
  });

  test('🚨 trạng thái CUỐI không chuyển được nữa', async () => {
    const donId = await taoDon();
    await doi(donId, 'daXacNhan').expect(200);
    await doi(donId, 'dangGiao').expect(200);
    await doi(donId, 'daGiao').expect(200);

    const r = await doi(donId, 'daHuy').expect(409);
    assert.match(r.body.loi, /trạng thái cuối/);
  });

  test('khách KHÔNG đổi được trạng thái đơn → 403', async () => {
    const donId = await taoDon();
    await doi(donId, 'daHuy', tokenKhach).expect(403);
  });
});
