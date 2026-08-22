/**
 * Test e2e cho bản Express — dùng supertest.
 *
 * SO SÁNH VỚI PROJECT 1:
 *   Project 1: tự viết hàm goi() 20 dòng bằng http.request,
 *              tự mở server trên cổng 0, tự parse JSON.
 *   Ở đây   : supertest lo hết. KHÔNG cần mở cổng thật —
 *              nó tự dựng server tạm cho mỗi request.
 *
 * Đây là lý do ta tách app.js khỏi server.js (bài học buổi 09).
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
  thuMucTam = await mkdtemp(join(tmpdir(), 'todo-express-'));
  const repo = taoRepository(join(thuMucTam, 'todos.json'));
  await repo.nap();
  app = taoApp({ service: taoService(repo), logger: loggerIm, bodyLimit: 1024 });
});

after(async () => {
  await rm(thuMucTam, { recursive: true, force: true });
});

describe('Express — luồng CRUD đầy đủ', () => {
  let id;

  test('GET /health → 200', async () => {
    const r = await request(app).get('/health').expect(200);
    assert.equal(r.body.trangThai, 'ok');
  });

  test('GET /todos ban đầu rỗng', async () => {
    const r = await request(app).get('/todos').expect(200);
    assert.deepEqual(r.body.duLieu, []);
  });

  test('POST /todos → 201 kèm Location', async () => {
    const r = await request(app)
      .post('/todos')
      .send({ tieuDe: 'Học Express', uuTien: 'cao' })
      .expect(201);
    assert.equal(r.headers.location, `/todos/${r.body.id}`);
    assert.equal(r.body.xong, false);
    id = r.body.id;
  });

  test('GET /todos/:id → 200', async () => {
    const r = await request(app).get(`/todos/${id}`).expect(200);
    assert.equal(r.body.id, id);
  });

  test('PATCH sửa một phần', async () => {
    const r = await request(app).patch(`/todos/${id}`).send({ xong: true }).expect(200);
    assert.equal(r.body.xong, true);
    assert.equal(r.body.tieuDe, 'Học Express', 'trường khác giữ nguyên');
  });

  test('PUT thiếu trường → 400 kèm chi tiết', async () => {
    const r = await request(app).put(`/todos/${id}`).send({ xong: true }).expect(400);
    assert.ok(r.body.chiTiet.tieuDe);
  });

  test('GET /todos/thong-ke — route cụ thể thắng route :id', async () => {
    const r = await request(app).get('/todos/thong-ke').expect(200);
    assert.equal(r.body.tong, 1);
    assert.equal(r.body.daXong, 1);
  });

  test('DELETE → 204 không body', async () => {
    const r = await request(app).delete(`/todos/${id}`).expect(204);
    assert.equal(r.text, '');
  });

  test('GET todo đã xoá → 404', async () => {
    await request(app).get(`/todos/${id}`).expect(404);
  });
});

describe('Express — xử lý lỗi (giống hệt Project 1)', () => {
  test('404 đường dẫn lạ', async () => {
    await request(app).get('/khong-ton-tai').expect(404);
  });

  test('415 sai Content-Type', async () => {
    await request(app)
      .post('/todos')
      .set('Content-Type', 'text/plain')
      .send('abc')
      .expect(415);
  });

  test('400 JSON hỏng', async () => {
    const r = await request(app)
      .post('/todos')
      .set('Content-Type', 'application/json')
      .send('{hong')
      .expect(400);
    assert.match(r.body.loi, /JSON hợp lệ/);
  });

  test('413 body quá lớn', async () => {
    await request(app)
      .post('/todos')
      .send({ tieuDe: 'x'.repeat(2000) })
      .expect(413);
  });

  test('400 id không phải số', async () => {
    await request(app).get('/todos/abc').expect(400);
  });

  test('400 tham số phân trang sai', async () => {
    await request(app).get('/todos?trang=0').expect(400);
  });

  test('KHÔNG lộ stack trace khi lỗi 500', async () => {
    const serviceHong = {
      thongKe() { throw new Error('BÍ MẬT: postgres://user:matkhau@db'); },
    };
    const appHong = taoApp({ service: serviceHong, logger: loggerIm, bodyLimit: 1024 });

    const r = await request(appHong).get('/todos/thong-ke').expect(500);
    assert.equal(r.body.loi, 'Lỗi máy chủ nội bộ');
    assert.equal(r.text.includes('BÍ MẬT'), false);
    assert.equal(r.text.includes('at '), false);
  });
});
