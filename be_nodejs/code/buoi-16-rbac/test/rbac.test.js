/**
 * Buổi 16 — Test phân quyền.
 *
 * Trọng tâm: chứng minh IDOR (Insecure Direct Object Reference) bị chặn.
 * Đây là lỗ hổng đứng ĐẦU BẢNG OWASP Top 10 (Broken Access Control).
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { taoApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = taoApp({ logger: { error() {} } });

/** Tạo user với vai trò cho trước, trả về token và id. */
async function taoNguoiDung(email, vaiTro) {
  await request(app)
    .post('/auth/dang-ky')
    .send({ email, ten: email, matKhau: 'matkhau-du-dai', vaiTro })
    .expect(201);

  const r = await request(app)
    .post('/auth/dang-nhap')
    .send({ email, matKhau: 'matkhau-du-dai' })
    .expect(200);

  return { token: r.body.accessToken, id: r.body.user.id, vaiTro };
}

/** Gọi API kèm token. */
const nhu = (u) => ({
  get: (p) => request(app).get(p).set('Authorization', `Bearer ${u.token}`),
  post: (p) => request(app).post(p).set('Authorization', `Bearer ${u.token}`),
  patch: (p) => request(app).patch(p).set('Authorization', `Bearer ${u.token}`),
  delete: (p) => request(app).delete(p).set('Authorization', `Bearer ${u.token}`),
});

let an, binh, bienTap, admin;
let baiCuaAn;

before(async () => {
  await prisma.user.deleteMany();

  an = await taoNguoiDung('an@example.com', 'user');
  binh = await taoNguoiDung('binh@example.com', 'user');
  bienTap = await taoNguoiDung('bientap@example.com', 'bienTap');
  admin = await taoNguoiDung('admin@example.com', 'admin');
});

after(async () => {
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('Tạo bài viết', () => {
  test('user tạo được bài của mình', async () => {
    const r = await nhu(an).post('/bai-viet').send({ tieuDe: 'Bài của An', noiDung: 'ND' }).expect(201);

    assert.equal(r.body.tacGiaId, an.id, 'tác giả phải là người đang đăng nhập');
    assert.equal(r.body.daDang, false, 'mặc định chưa đăng');
    baiCuaAn = r.body.id;
  });

  test('🚨 KHÔNG mạo danh được tác giả khác', async () => {
    // Kẻ tấn công cố gửi tacGiaId của người khác
    const r = await nhu(an)
      .post('/bai-viet')
      .send({ tieuDe: 'Mạo danh', noiDung: 'ND', tacGiaId: binh.id })
      .expect(400);

    assert.ok(r.body.chiTiet, '.strict() phải TỪ CHỐI trường lạ');
  });

  test('chưa đăng nhập → 401', async () => {
    await request(app).post('/bai-viet').send({ tieuDe: 'X', noiDung: 'Y' }).expect(401);
  });
});

describe('🚨 IDOR — sửa/xoá tài nguyên của người khác', () => {
  test('Bình KHÔNG sửa được bài của An → 403', async () => {
    const r = await nhu(binh).patch(`/bai-viet/${baiCuaAn}`).send({ tieuDe: 'Bị chiếm' }).expect(403);
    assert.match(r.body.loi, /Không đủ quyền/);
  });

  test('Bình KHÔNG xoá được bài của An → 403', async () => {
    await nhu(binh).delete(`/bai-viet/${baiCuaAn}`).expect(403);
  });

  test('bài của An vẫn NGUYÊN VẸN sau các lần tấn công', async () => {
    const r = await nhu(an).get(`/bai-viet/${baiCuaAn}`).expect(200);
    assert.equal(r.body.tieuDe, 'Bài của An', 'nội dung không bị đổi');
  });

  test('An sửa được bài của chính mình → 200', async () => {
    const r = await nhu(an).patch(`/bai-viet/${baiCuaAn}`).send({ tieuDe: 'Đã sửa' }).expect(200);
    assert.equal(r.body.tieuDe, 'Đã sửa');
  });
});

describe('Phân quyền theo vai trò', () => {
  test('biên tập SỬA ĐƯỢC bài người khác (quyền any)', async () => {
    const r = await nhu(bienTap)
      .patch(`/bai-viet/${baiCuaAn}`)
      .send({ tieuDe: 'Biên tập sửa' })
      .expect(200);
    assert.equal(r.body.tieuDe, 'Biên tập sửa');
  });

  test('biên tập KHÔNG xoá được bài người khác (quyền own)', async () => {
    // Cùng một vai trò nhưng quyền khác nhau tuỳ hành động —
    // đây là lý do cần BẢNG QUYỀN thay vì if/else rải rác
    await nhu(bienTap).delete(`/bai-viet/${baiCuaAn}`).expect(403);
  });

  test('admin xoá được bài của bất kỳ ai', async () => {
    const tao = await nhu(binh).post('/bai-viet').send({ tieuDe: 'Của Bình', noiDung: 'ND' });
    await nhu(admin).delete(`/bai-viet/${tao.body.id}`).expect(204);
  });
});

describe('Bài chưa đăng — trả 404 chứ không 403', () => {
  let baiRieng;

  before(async () => {
    const r = await nhu(an).post('/bai-viet').send({ tieuDe: 'Bản nháp', noiDung: 'Bí mật' });
    baiRieng = r.body.id;
  });

  test('tác giả xem được bản nháp của mình', async () => {
    await nhu(an).get(`/bai-viet/${baiRieng}`).expect(200);
  });

  test('🔒 người khác nhận 404, KHÔNG phải 403', async () => {
    // Trả 403 sẽ tiết lộ rằng bài đó TỒN TẠI.
    // Với nội dung riêng tư, chính sự tồn tại đã là thông tin rò rỉ.
    const r = await nhu(binh).get(`/bai-viet/${baiRieng}`).expect(404);
    assert.equal(r.text.includes('Bí mật'), false, 'không được lộ nội dung');
  });

  test('admin vẫn xem được', async () => {
    await nhu(admin).get(`/bai-viet/${baiRieng}`).expect(200);
  });

  test('sau khi đăng thì ai cũng xem được', async () => {
    await nhu(an).post(`/bai-viet/${baiRieng}/dang`).expect(200);
    await nhu(binh).get(`/bai-viet/${baiRieng}`).expect(200);
  });
});

describe('Danh sách bị lọc theo quyền', () => {
  test('user chỉ thấy bài ĐÃ ĐĂNG của người khác + toàn bộ bài của mình', async () => {
    await nhu(binh).post('/bai-viet').send({ tieuDe: 'Nháp của Bình', noiDung: 'x' });

    const r = await nhu(an).get('/bai-viet').expect(200);
    const nhapCuaNguoiKhac = r.body.filter((b) => !b.daDang && b.tacGiaId !== an.id);

    assert.equal(nhapCuaNguoiKhac.length, 0, 'KHÔNG được thấy bản nháp của người khác');
  });

  test('admin thấy tất cả', async () => {
    const cuaAdmin = await nhu(admin).get('/bai-viet').expect(200);
    const cuaAn = await nhu(an).get('/bai-viet').expect(200);

    assert.ok(cuaAdmin.body.length > cuaAn.body.length, 'admin phải thấy nhiều hơn');
  });

  test('?cuaToi=true chỉ trả bài của mình', async () => {
    const r = await nhu(an).get('/bai-viet?cuaToi=true').expect(200);
    assert.ok(r.body.every((b) => b.tacGiaId === an.id));
  });
});

describe('Không tồn tại vs không đủ quyền', () => {
  test('id không tồn tại → 404', async () => {
    await nhu(an).patch('/bai-viet/999999').send({ tieuDe: 'X' }).expect(404);
  });

  test('id sai định dạng → 400', async () => {
    await nhu(an).get('/bai-viet/abc').expect(400);
  });
});
