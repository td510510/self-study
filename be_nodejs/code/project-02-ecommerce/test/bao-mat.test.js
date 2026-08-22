/**
 * Buổi 23 — Test lớp phòng thủ ở biên.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import { taoApp } from '../src/app.js';
import { taoLogger } from '../src/lib/logger.js';
import { prisma } from '../src/lib/prisma.js';
import { layRedis, dongRedis } from '../src/lib/redis.js';

const logger = taoLogger({ level: 'silent' });
const ORIGIN_CHO_PHEP = 'http://localhost:5173';

const app = taoApp({ logger, origins: [ORIGIN_CHO_PHEP], batRateLimit: false });

before(async () => {
  await layRedis().flushdb();
});

after(async () => {
  await layRedis().flushdb();
  await prisma.$disconnect();
  await dongRedis();
});

describe('Helmet — header bảo mật', () => {
  test('ẩn X-Powered-By', async () => {
    const r = await request(app).get('/health').expect(200);
    assert.equal(r.headers['x-powered-by'], undefined, 'đừng khoe đang dùng Express');
  });

  test('chống clickjacking', async () => {
    const r = await request(app).get('/health');
    assert.equal(r.headers['x-frame-options'], 'DENY');
  });

  test('chặn trình duyệt tự đoán kiểu file', async () => {
    const r = await request(app).get('/health');
    assert.equal(r.headers['x-content-type-options'], 'nosniff');
  });

  test('có Content-Security-Policy', async () => {
    const r = await request(app).get('/health');
    assert.match(r.headers['content-security-policy'], /default-src 'none'/);
  });

  test('không gửi Referer sang site khác', async () => {
    const r = await request(app).get('/health');
    assert.equal(r.headers['referrer-policy'], 'no-referrer');
  });

  test('HSTS buộc dùng HTTPS', async () => {
    const r = await request(app).get('/health');
    assert.match(r.headers['strict-transport-security'], /max-age=31536000/);
  });
});

describe('CORS', () => {
  test('origin được phép → có header cho phép', async () => {
    const r = await request(app).get('/health').set('Origin', ORIGIN_CHO_PHEP).expect(200);
    assert.equal(r.headers['access-control-allow-origin'], ORIGIN_CHO_PHEP);
    assert.equal(r.headers['access-control-allow-credentials'], 'true');
  });

  test('🚨 origin LẠ → KHÔNG có header cho phép', async () => {
    const r = await request(app).get('/health').set('Origin', 'https://ke-tan-cong.com');

    // Điểm dạy: server VẪN trả dữ liệu, nhưng thiếu header
    // → TRÌNH DUYỆT là bên từ chối đưa dữ liệu cho JavaScript.
    assert.equal(r.headers['access-control-allow-origin'], undefined);
  });

  test('không có Origin (curl, mobile) → cho qua', async () => {
    await request(app).get('/health').expect(200);
  });

  test('preflight OPTIONS được trả lời', async () => {
    const r = await request(app)
      .options('/san-pham')
      .set('Origin', ORIGIN_CHO_PHEP)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Authorization');

    assert.ok([200, 204].includes(r.status));
    assert.match(r.headers['access-control-allow-methods'], /POST/);
    assert.match(r.headers['access-control-allow-headers'], /Authorization/);
    assert.equal(r.headers['access-control-max-age'], '600', 'cache preflight để bớt request');
  });

  test('header tự đặt phải được KHAI để frontend đọc được', async () => {
    const r = await request(app).get('/health').set('Origin', ORIGIN_CHO_PHEP);
    // Thiếu exposedHeaders thì JavaScript phía client KHÔNG đọc được
    // X-Request-Id, dù server có gửi.
    assert.match(r.headers['access-control-expose-headers'], /X-Request-Id/i);
  });
});

describe('Rate limit (Redis)', () => {
  const appRL = taoApp({ logger, origins: [ORIGIN_CHO_PHEP], batRateLimit: true });

  test('có header RateLimit-*', async () => {
    const r = await request(appRL).get('/health').expect(200);
    assert.ok(r.headers['ratelimit-limit']);
    assert.ok(r.headers['ratelimit-remaining']);
  });

  test('endpoint đăng nhập bị siết chặt hơn (5 lần/phút)', async () => {
    const goi = () =>
      request(appRL)
        .post('/auth/dang-nhap')
        .send({ email: 'khong-ton-tai@test.com', matKhau: 'sai-mat-khau' });

    // 5 lần đầu: được xử lý (trả 401 vì sai mật khẩu)
    for (let i = 0; i < 5; i++) {
      const r = await goi();
      assert.equal(r.status, 401, `lần ${i + 1} phải là 401 chứ không phải 429`);
    }

    // Lần thứ 6: bị chặn
    const r = await goi();
    assert.equal(r.status, 429);
    assert.equal(r.body.ma, 'QUA_NHIEU_REQUEST');
    assert.ok(r.headers['retry-after'], 'phải nói client chờ bao lâu');
  });

  test('bộ đếm nằm ở Redis, không ở RAM tiến trình', async () => {
    const khoas = await layRedis().keys('rl:*');
    assert.ok(khoas.length > 0, 'phải thấy khoá rate limit trong Redis');
  });
});
