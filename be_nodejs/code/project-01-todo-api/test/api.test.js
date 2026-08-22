/**
 * Test end-to-end: gọi qua HTTP THẬT.
 *
 * Bắt được những lỗi mà unit test không thấy: routing sai, status code sai,
 * header thiếu, thứ tự route sai.
 *
 * Không dùng thư viện ngoài (supertest) — ta tự dựng server trên cổng ngẫu nhiên.
 * Ở buổi 17 sẽ thay bằng supertest cho gọn.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { taoRepository } from '../src/todos/todo.repository.js';
import { taoService } from '../src/todos/todo.service.js';
import { taoApp } from '../src/app.js';

let server, cong, thuMucTam;
const loggerIm = { debug() {}, info() {}, warn() {}, error() {} };

before(async () => {
  // Dữ liệu test nằm ở thư mục tạm — không đụng vào data/ thật
  thuMucTam = await mkdtemp(join(tmpdir(), 'todo-test-'));
  const repo = taoRepository(join(thuMucTam, 'todos.json'));
  await repo.nap();

  const app = taoApp({
    service: taoService(repo),
    logger: loggerIm,
    bodyLimit: 1024,          // giới hạn nhỏ để test 413 cho nhanh
    dangTat: () => false,
  });

  server = http.createServer(app.xuLy);
  await new Promise((r) => server.listen(0, r)); // cổng 0 = hệ điều hành tự chọn
  cong = server.address().port;
});

after(async () => {
  await new Promise((r) => server.close(r));
  await rm(thuMucTam, { recursive: true, force: true });
});

function goi(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const dulieu = body === undefined ? null
      : typeof body === 'string' ? body : JSON.stringify(body);

    const req = http.request(
      { host: 'localhost', port: cong, path, method, agent: false,
        headers: { ...(dulieu !== null && { 'Content-Type': 'application/json' }), ...headers } },
      (res) => {
        let tho = '';
        res.on('data', (c) => (tho += c));
        res.on('end', () => {
          let json = null;
          try { json = tho ? JSON.parse(tho) : null; } catch { /* body không phải JSON */ }
          resolve({ status: res.statusCode, headers: res.headers, body: json, tho });
        });
      }
    );
    req.on('error', reject);
    if (dulieu !== null) req.write(dulieu);
    req.end();
  });
}

describe('E2E — luồng CRUD đầy đủ', () => {
  let idVuaTao;

  test('GET /health → 200', async () => {
    const r = await goi('GET', '/health');
    assert.equal(r.status, 200);
    assert.equal(r.body.trangThai, 'ok');
  });

  test('GET /todos ban đầu rỗng', async () => {
    const r = await goi('GET', '/todos');
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.duLieu, []);
    assert.equal(r.body.phanTrang.tong, 0);
  });

  test('POST /todos → 201 kèm header Location', async () => {
    const r = await goi('POST', '/todos', { tieuDe: 'Học Node thuần', uuTien: 'cao' });
    assert.equal(r.status, 201);
    assert.equal(r.headers.location, `/todos/${r.body.id}`);
    assert.equal(r.body.tieuDe, 'Học Node thuần');
    assert.equal(r.body.xong, false);
    assert.ok(r.body.taoLuc, 'phải có mốc thời gian tạo');
    idVuaTao = r.body.id;
  });

  test('GET /todos/:id → 200', async () => {
    const r = await goi('GET', `/todos/${idVuaTao}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.id, idVuaTao);
  });

  test('PATCH /todos/:id sửa một phần', async () => {
    const r = await goi('PATCH', `/todos/${idVuaTao}`, { xong: true });
    assert.equal(r.status, 200);
    assert.equal(r.body.xong, true);
    assert.equal(r.body.tieuDe, 'Học Node thuần', 'trường khác giữ nguyên');
    assert.ok(r.body.suaLuc, 'phải cập nhật mốc thời gian sửa');
  });

  test('PUT thiếu trường → 400 kèm chi tiết', async () => {
    const r = await goi('PUT', `/todos/${idVuaTao}`, { xong: true });
    assert.equal(r.status, 400);
    assert.ok(r.body.chiTiet.tieuDe);
  });

  test('GET /todos/thong-ke — route cụ thể thắng route :id', async () => {
    const r = await goi('GET', '/todos/thong-ke');
    assert.equal(r.status, 200, 'KHÔNG được rơi vào /todos/:id');
    assert.equal(r.body.tong, 1);
    assert.equal(r.body.daXong, 1);
  });

  test('DELETE /todos/:id → 204 không body', async () => {
    const r = await goi('DELETE', `/todos/${idVuaTao}`);
    assert.equal(r.status, 204);
    assert.equal(r.tho, '');
  });

  test('GET todo đã xoá → 404', async () => {
    const r = await goi('GET', `/todos/${idVuaTao}`);
    assert.equal(r.status, 404);
  });
});

describe('E2E — xử lý lỗi', () => {
  test('404 cho đường dẫn không tồn tại', async () => {
    assert.equal((await goi('GET', '/khong-ton-tai')).status, 404);
  });

  test('405 kèm header Allow', async () => {
    const r = await goi('DELETE', '/todos');
    assert.equal(r.status, 405);
    assert.equal(r.headers.allow, 'GET, POST');
  });

  test('415 khi sai Content-Type', async () => {
    const r = await goi('POST', '/todos', 'khong-phai-json', { 'Content-Type': 'text/plain' });
    assert.equal(r.status, 415);
  });

  test('400 khi JSON hỏng', async () => {
    const r = await goi('POST', '/todos', '{hong');
    assert.equal(r.status, 400);
    assert.match(r.body.loi, /JSON hợp lệ/);
  });

  test('413 khi body quá lớn', async () => {
    const r = await goi('POST', '/todos', { tieuDe: 'x'.repeat(2000) });
    assert.equal(r.status, 413);
  });

  test('400 khi id không phải số', async () => {
    assert.equal((await goi('GET', '/todos/abc')).status, 400);
  });

  test('400 khi tham số phân trang sai', async () => {
    assert.equal((await goi('GET', '/todos?trang=0')).status, 400);
  });

  test('lỗi ngoài dự kiến → 500 GIẤU chi tiết, không lộ stack trace', async () => {
    // Dựng một app riêng có service cố tình ném lỗi lạ,
    // để kiểm chứng đúng nhánh xử lý "bug ngoài dự kiến".
    const serviceHong = {
      thongKe() { throw new Error('BÍ MẬT: chuỗi kết nối database postgres://user:matkhau@db'); },
    };
    const appHong = taoApp({
      service: serviceHong, logger: loggerIm, bodyLimit: 1024, dangTat: () => false,
    });
    const srv = http.createServer(appHong.xuLy);
    await new Promise((r) => srv.listen(0, r));
    const p = srv.address().port;

    const r = await new Promise((resolve) => {
      http.get({ host: 'localhost', port: p, path: '/todos/thong-ke', agent: false }, (res) => {
        let tho = '';
        res.on('data', (c) => (tho += c));
        res.on('end', () => resolve({ status: res.statusCode, tho }));
      });
    });
    await new Promise((r) => srv.close(r));

    assert.equal(r.status, 500);
    assert.equal(JSON.parse(r.tho).loi, 'Lỗi máy chủ nội bộ', 'chỉ trả thông điệp chung chung');
    assert.equal(r.tho.includes('BÍ MẬT'), false, 'không được lộ thông điệp lỗi gốc');
    assert.equal(r.tho.includes('postgres://'), false, 'không được lộ chuỗi kết nối');
    assert.equal(r.tho.includes('at '), false, 'không được chứa stack trace');
    assert.equal(JSON.parse(r.tho).stack, undefined, 'không được có trường stack');
  });
});

describe('E2E — dữ liệu bền vững', () => {
  test('todo tạo ra vẫn còn sau nhiều request', async () => {
    await goi('POST', '/todos', { tieuDe: 'Bền vững 1' });
    await goi('POST', '/todos', { tieuDe: 'Bền vững 2' });
    const r = await goi('GET', '/todos');
    assert.equal(r.body.phanTrang.tong, 2);
  });

  test('lọc và phân trang hoạt động', async () => {
    const r = await goi('GET', '/todos?xong=false&moiTrang=1');
    assert.equal(r.body.duLieu.length, 1);
    assert.equal(r.body.phanTrang.tongSoTrang, 2);
  });
});
