/**
 * Buổi 15 — Test luồng xác thực, kể cả các kịch bản tấn công.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import { taoApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const app = taoApp({ logger: { error() {} } });
const NGUOI_DUNG = { email: 'test@example.com', ten: 'Người Test', matKhau: 'matkhau-du-dai' };

before(async () => {
  await prisma.user.deleteMany();
});

after(async () => {
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('Đăng ký', () => {
  test('tạo tài khoản → 201, KHÔNG trả về hash mật khẩu', async () => {
    const r = await request(app).post('/auth/dang-ky').send(NGUOI_DUNG).expect(201);

    assert.equal(r.body.email, NGUOI_DUNG.email);
    assert.equal(r.body.matKhauHash, undefined, 'TUYỆT ĐỐI không được lộ hash');
    assert.equal(r.text.includes(NGUOI_DUNG.matKhau), false, 'không được lộ mật khẩu thô');
  });

  test('mật khẩu được BĂM trong database, không lưu thô', async () => {
    const u = await prisma.user.findUnique({ where: { email: NGUOI_DUNG.email } });
    assert.notEqual(u.matKhauHash, NGUOI_DUNG.matKhau);
    // Định dạng bcrypt: $2b$12$....
    assert.ok(/^\$2[aby]\$\d{2}\$/.test(u.matKhauHash), 'phải là định dạng bcrypt');
  });

  test('email trùng → 409', async () => {
    await request(app).post('/auth/dang-ky').send(NGUOI_DUNG).expect(409);
  });

  test('mật khẩu quá ngắn → 400', async () => {
    const r = await request(app)
      .post('/auth/dang-ky')
      .send({ email: 'a@b.com', ten: 'A', matKhau: '123' })
      .expect(400);
    assert.ok(r.body.chiTiet.matKhau);
  });

  test('email sai định dạng → 400', async () => {
    await request(app)
      .post('/auth/dang-ky')
      .send({ email: 'khong-phai-email', ten: 'A', matKhau: 'matkhau-du-dai' })
      .expect(400);
  });
});

describe('Đăng nhập', () => {
  test('đúng thông tin → trả access + refresh token', async () => {
    const r = await request(app)
      .post('/auth/dang-nhap')
      .send({ email: NGUOI_DUNG.email, matKhau: NGUOI_DUNG.matKhau })
      .expect(200);

    assert.ok(r.body.accessToken);
    assert.ok(r.body.refreshToken);
    assert.equal(r.body.user.matKhauHash, undefined);
  });

  test('CHỐNG DÒ TÀI KHOẢN: sai mật khẩu và email không tồn tại cho CÙNG thông điệp', async () => {
    const saiMatKhau = await request(app)
      .post('/auth/dang-nhap')
      .send({ email: NGUOI_DUNG.email, matKhau: 'sai-mat-khau' })
      .expect(401);

    const khongCoEmail = await request(app)
      .post('/auth/dang-nhap')
      .send({ email: 'khong-ton-tai@example.com', matKhau: 'gi-cung-duoc' })
      .expect(401);

    assert.equal(
      saiMatKhau.body.loi,
      khongCoEmail.body.loi,
      'hai thông điệp phải GIỐNG HỆT nhau'
    );
  });
});

describe('Route được bảo vệ', () => {
  let accessToken;

  before(async () => {
    const r = await request(app)
      .post('/auth/dang-nhap')
      .send({ email: NGUOI_DUNG.email, matKhau: NGUOI_DUNG.matKhau });
    accessToken = r.body.accessToken;
  });

  test('có token hợp lệ → 200', async () => {
    const r = await request(app)
      .get('/auth/toi')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    assert.equal(r.body.email, NGUOI_DUNG.email);
  });

  test('thiếu header → 401', async () => {
    await request(app).get('/auth/toi').expect(401);
  });

  test('sai định dạng (thiếu "Bearer") → 401', async () => {
    await request(app).get('/auth/toi').set('Authorization', accessToken).expect(401);
  });

  test('token bị sửa nội dung → 401', async () => {
    const hong = accessToken.slice(0, -3) + 'xxx';
    await request(app).get('/auth/toi').set('Authorization', `Bearer ${hong}`).expect(401);
  });

  test('TẤN CÔNG alg=none bị chặn', async () => {
    // Kẻ tấn công tự tạo token với alg "none" — không cần biết secret
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: '1', vaiTro: 'admin' })).toString('base64url');
    const tokenGia = `${header}.${payload}.`;

    await request(app).get('/auth/toi').set('Authorization', `Bearer ${tokenGia}`).expect(401);
  });

  test('token ký bằng secret KHÁC → 401', async () => {
    const tokenGia = jwt.sign({ sub: '1', vaiTro: 'admin' }, 'secret-cua-ke-tan-cong', {
      expiresIn: '15m',
      issuer: 'hocbe-auth',
    });
    await request(app).get('/auth/toi').set('Authorization', `Bearer ${tokenGia}`).expect(401);
  });

  test('token ĐÃ HẾT HẠN → 401', async () => {
    const hetHan = jwt.sign({ sub: '1' }, process.env.JWT_ACCESS_SECRET, {
      expiresIn: '-1s',
      issuer: 'hocbe-auth',
    });
    const r = await request(app)
      .get('/auth/toi')
      .set('Authorization', `Bearer ${hetHan}`)
      .expect(401);
    assert.match(r.body.loi, /hết hạn/);
  });

  test('user thường gọi route admin → 403 (không phải 401)', async () => {
    await request(app)
      .get('/auth/chi-admin')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });
});

describe('Refresh token rotation', () => {
  let refreshToken;

  before(async () => {
    const r = await request(app)
      .post('/auth/dang-nhap')
      .send({ email: NGUOI_DUNG.email, matKhau: NGUOI_DUNG.matKhau });
    refreshToken = r.body.refreshToken;
  });

  test('đổi refresh token lấy cặp token MỚI', async () => {
    const r = await request(app).post('/auth/lam-moi').send({ refreshToken }).expect(200);

    assert.ok(r.body.accessToken);
    assert.notEqual(r.body.refreshToken, refreshToken, 'phải cấp refresh token MỚI');
  });

  test('🚨 DÙNG LẠI token cũ → thu hồi TOÀN BỘ phiên', async () => {
    const dn = await request(app)
      .post('/auth/dang-nhap')
      .send({ email: NGUOI_DUNG.email, matKhau: NGUOI_DUNG.matKhau });
    const cu = dn.body.refreshToken;

    // Dùng lần 1 — hợp lệ
    const lan1 = await request(app).post('/auth/lam-moi').send({ refreshToken: cu }).expect(200);

    // Dùng lại lần 2 — dấu hiệu token bị đánh cắp
    const lan2 = await request(app).post('/auth/lam-moi').send({ refreshToken: cu }).expect(401);
    assert.match(lan2.body.loi, /dùng lại/);

    // Token cấp ở lần 1 cũng bị thu hồi theo — buộc đăng nhập lại
    await request(app)
      .post('/auth/lam-moi')
      .send({ refreshToken: lan1.body.refreshToken })
      .expect(401);
  });

  test('đăng xuất → refresh token không dùng được nữa', async () => {
    const dn = await request(app)
      .post('/auth/dang-nhap')
      .send({ email: NGUOI_DUNG.email, matKhau: NGUOI_DUNG.matKhau });

    await request(app)
      .post('/auth/dang-xuat')
      .send({ refreshToken: dn.body.refreshToken })
      .expect(204);

    await request(app)
      .post('/auth/lam-moi')
      .send({ refreshToken: dn.body.refreshToken })
      .expect(401);
  });

  test('refresh token KHÔNG dùng được như access token', async () => {
    const dn = await request(app)
      .post('/auth/dang-nhap')
      .send({ email: NGUOI_DUNG.email, matKhau: NGUOI_DUNG.matKhau });

    // Vì hai loại token ký bằng HAI SECRET KHÁC NHAU
    await request(app)
      .get('/auth/toi')
      .set('Authorization', `Bearer ${dn.body.refreshToken}`)
      .expect(401);
  });
});

describe('JWT payload không được mã hoá', () => {
  test('AI CŨNG đọc được nội dung token', async () => {
    const dn = await request(app)
      .post('/auth/dang-nhap')
      .send({ email: NGUOI_DUNG.email, matKhau: NGUOI_DUNG.matKhau });

    // Giải mã KHÔNG cần secret — payload chỉ là base64url
    const phanGiua = dn.body.accessToken.split('.')[1];
    const payload = JSON.parse(Buffer.from(phanGiua, 'base64url').toString('utf8'));

    assert.equal(payload.email, NGUOI_DUNG.email, 'email đọc được mà không cần secret');
    assert.ok(payload.exp, 'có thời điểm hết hạn');
    // → BÀI HỌC: không bao giờ đưa dữ liệu nhạy cảm vào payload
  });
});
