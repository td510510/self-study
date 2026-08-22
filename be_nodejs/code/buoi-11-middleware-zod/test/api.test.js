/**
 * Buổi 11 — Test cho validation zod + middleware.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { taoRepository } from '../src/todos/todo.repository.js';
import { taoService } from '../src/todos/todo.service.js';
import { taoApp } from '../src/app.js';

let app, thuMucTam;
const loggerIm = { debug() {}, info() {}, warn() {}, error() {} };

before(async () => {
  thuMucTam = await mkdtemp(join(tmpdir(), 'todo-zod-'));
  const repo = taoRepository(join(thuMucTam, 'todos.json'));
  await repo.nap();
  app = taoApp({
    service: taoService(repo),
    logger: loggerIm,
    bodyLimit: 1024,
    gioiHanRate: { soLanToiDa: 10_000, cuaSoMs: 60_000 },
  });
});

after(async () => { await rm(thuMucTam, { recursive: true, force: true }); });

describe('zod — làm sạch dữ liệu', () => {
  test('tự trim và điền giá trị mặc định', async () => {
    const r = await request(app).post('/todos').send({ tieuDe: '  Học zod  ' }).expect(201);
    assert.equal(r.body.tieuDe, 'Học zod', 'phải trim');
    assert.equal(r.body.xong, false, 'mặc định');
    assert.equal(r.body.uuTien, 'trung', 'mặc định');
  });

  test('ép kiểu query string thành số', async () => {
    const r = await request(app).get('/todos?trang=1&moiTrang=5').expect(200);
    assert.equal(r.body.phanTrang.trang, 1);
    assert.equal(r.body.phanTrang.moiTrang, 5);
    assert.equal(typeof r.body.phanTrang.trang, 'number', 'phải là SỐ, không phải chuỗi');
  });

  test('ép kiểu route param thành số', async () => {
    const tao = await request(app).post('/todos').send({ tieuDe: 'X' }).expect(201);
    await request(app).get(`/todos/${tao.body.id}`).expect(200);
  });
});

describe('zod — báo lỗi', () => {
  test('gộp NHIỀU lỗi trong một response', async () => {
    const r = await request(app)
      .post('/todos')
      .send({ tieuDe: '', uuTien: 'khan-cap' })
      .expect(400);

    assert.ok(r.body.chiTiet.tieuDe, 'phải báo lỗi tieuDe');
    assert.ok(r.body.chiTiet.uuTien, 'phải báo lỗi uuTien');
    assert.equal(Object.keys(r.body.chiTiet).length, 2, 'báo CẢ HAI lỗi cùng lúc');
  });

  test('CHỐNG MASS ASSIGNMENT: .strict() TỪ CHỐI trường lạ', async () => {
    const r = await request(app)
      .post('/todos')
      .send({ tieuDe: 'hợp lệ', vaiTro: 'admin', id: 999 })
      .expect(400);
    assert.ok(r.body.chiTiet, 'phải báo lỗi thay vì lặng lẽ bỏ qua');
  });

  test('PATCH rỗng → 400', async () => {
    const tao = await request(app).post('/todos').send({ tieuDe: 'Y' }).expect(201);
    await request(app).patch(`/todos/${tao.body.id}`).send({}).expect(400);
  });

  test('id không phải số → 400', async () => {
    const r = await request(app).get('/todos/abc').expect(400);
    assert.ok(r.body.chiTiet.id);
  });

  test('phân trang sai → 400', async () => {
    await request(app).get('/todos?trang=0').expect(400);
    await request(app).get('/todos?moiTrang=101').expect(400);
  });

  test('mọi lỗi đều kèm requestId để tra log', async () => {
    const r = await request(app).get('/todos/abc').expect(400);
    assert.ok(r.body.requestId, 'response lỗi phải có requestId');
    assert.equal(r.headers['x-request-id'], r.body.requestId, 'khớp với header');
  });
});

describe('middleware', () => {
  test('requestId có trong header mọi response', async () => {
    const r = await request(app).get('/health').expect(200);
    assert.match(r.headers['x-request-id'], /^[0-9a-f-]{36}$/);
  });

  test('tôn trọng X-Request-Id do client gửi', async () => {
    const r = await request(app).get('/health').set('X-Request-Id', 'test-123').expect(200);
    assert.equal(r.headers['x-request-id'], 'test-123');
  });

  test('rate limit trả 429 kèm Retry-After', async () => {
    const appChat = taoApp({
      service: taoService(taoRepository(join(thuMucTam, 'rl.json'))),
      logger: loggerIm,
      bodyLimit: 1024,
      gioiHanRate: { soLanToiDa: 3, cuaSoMs: 60_000 },
    });

    for (let i = 0; i < 3; i++) await request(appChat).get('/health').expect(200);

    const r = await request(appChat).get('/health').expect(429);
    assert.ok(r.headers['retry-after'], 'phải có header Retry-After');
    assert.match(r.body.loi, /Quá nhiều request/);
  });

  test('415 sai Content-Type', async () => {
    await request(app).post('/todos').set('Content-Type', 'text/plain').send('abc').expect(415);
  });
});
