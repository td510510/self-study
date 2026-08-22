/**
 * Buổi 05 — Ráp tất cả lại: router + parse body + xử lý lỗi tập trung.
 *
 * Đây là bản nháp của Project 1. Dữ liệu còn nằm trong RAM
 * (mất khi restart) — buổi 08 ta sẽ ghi ra file.
 *
 * Chạy:  node --watch server.js
 */

import http from 'node:http';
import { createRouter } from './lib/router.js';
import { docJson } from './lib/body.js';
import { json, khongCoNoiDung, guiLoi } from './lib/respond.js';
import { loi } from './lib/errors.js';

// ── Kho dữ liệu tạm trong RAM ────────────────────────────────────
let idKeTiep = 3;
const todos = [
  { id: 1, tieuDe: 'Học module http', xong: true },
  { id: 2, tieuDe: 'Tự viết router', xong: false },
];

// ── Kiểm tra dữ liệu đầu vào ─────────────────────────────────────
// Ở Phase 2 ta thay bằng thư viện zod, nhưng nguyên tắc thì giống hệt:
// VALIDATE Ở BIÊN — không cho dữ liệu bẩn lọt vào sâu trong hệ thống.
function kiemTraTodo(duLieu, batBuocDuTruong = true) {
  const loiTruong = {};

  if (batBuocDuTruong || duLieu.tieuDe !== undefined) {
    if (typeof duLieu.tieuDe !== 'string' || duLieu.tieuDe.trim() === '') {
      loiTruong.tieuDe = 'Bắt buộc, phải là chuỗi không rỗng';
    } else if (duLieu.tieuDe.length > 200) {
      loiTruong.tieuDe = 'Tối đa 200 ký tự';
    }
  }

  if (duLieu.xong !== undefined && typeof duLieu.xong !== 'boolean') {
    loiTruong.xong = 'Phải là true hoặc false';
  }

  if (Object.keys(loiTruong).length > 0) {
    throw loi.duLieuSai('Dữ liệu không hợp lệ', loiTruong);
  }
}

function timTodo(id) {
  const todo = todos.find((t) => t.id === Number(id));
  if (!todo) throw loi.khongTimThay(`Không có todo với id = ${id}`);
  return todo;
}

// ── Khai báo route ───────────────────────────────────────────────
const router = createRouter();

// ⚠️ THỨ TỰ QUAN TRỌNG: route CỤ THỂ phải đăng ký TRƯỚC route có tham số.
// Nếu đảo lại, '/todos/thong-ke' sẽ rơi vào '/todos/:id' với id='thong-ke'.
router.get('/todos/thong-ke', (req, res) => {
  json(res, 200, {
    tong: todos.length,
    daXong: todos.filter((t) => t.xong).length,
    conLai: todos.filter((t) => !t.xong).length,
  });
});

router.get('/todos', (req, res) => {
  let ketQua = todos;

  // Lọc theo query: /todos?xong=true
  if (req.query.xong !== undefined) {
    const muonXong = req.query.xong === 'true';
    ketQua = ketQua.filter((t) => t.xong === muonXong);
  }

  json(res, 200, { soLuong: ketQua.length, duLieu: ketQua });
});

router.get('/todos/:id', (req, res) => {
  json(res, 200, timTodo(req.params.id));
});

router.post('/todos', async (req, res) => {
  const duLieu = await docJson(req);
  if (!duLieu) throw loi.duLieuSai('Body không được rỗng');

  kiemTraTodo(duLieu);

  const todoMoi = {
    id: idKeTiep++,
    tieuDe: duLieu.tieuDe.trim(),
    xong: duLieu.xong ?? false,
  };
  todos.push(todoMoi);

  // 201 Created + header Location trỏ tới tài nguyên vừa tạo — đúng chuẩn REST
  res.setHeader('Location', `/todos/${todoMoi.id}`);
  json(res, 201, todoMoi);
});

router.put('/todos/:id', async (req, res) => {
  const todo = timTodo(req.params.id);
  const duLieu = await docJson(req);
  if (!duLieu) throw loi.duLieuSai('Body không được rỗng');

  kiemTraTodo(duLieu, true); // PUT = thay thế toàn bộ → bắt buộc đủ trường

  todo.tieuDe = duLieu.tieuDe.trim();
  todo.xong = duLieu.xong ?? false;

  json(res, 200, todo);
});

router.patch('/todos/:id', async (req, res) => {
  const todo = timTodo(req.params.id);
  const duLieu = await docJson(req);
  if (!duLieu) throw loi.duLieuSai('Body không được rỗng');

  kiemTraTodo(duLieu, false); // PATCH = sửa một phần → không bắt buộc đủ trường

  if (duLieu.tieuDe !== undefined) todo.tieuDe = duLieu.tieuDe.trim();
  if (duLieu.xong !== undefined) todo.xong = duLieu.xong;

  json(res, 200, todo);
});

router.delete('/todos/:id', (req, res) => {
  const todo = timTodo(req.params.id);
  todos.splice(todos.indexOf(todo), 1);
  khongCoNoiDung(res); // 204, không có body
});

// ── Server ───────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const batDau = process.hrtime.bigint();

  // MỘT try/catch duy nhất bọc toàn bộ ứng dụng.
  // Mọi lỗi ném ra từ bất kỳ handler nào đều rơi về đây.
  // Đây chính là ý tưởng của error-handling middleware (buổi 11).
  try {
    const daXuLy = await router.handle(req, res);
    if (!daXuLy) {
      throw loi.khongTimThay(`Không có đường dẫn ${req.method} ${req.url}`);
    }
  } catch (err) {
    guiLoi(res, err);
  } finally {
    const msec = Number(process.hrtime.bigint() - batDau) / 1e6;
    console.log(
      `${req.method.padEnd(6)} ${req.url.padEnd(28)} → ${res.statusCode} (${msec.toFixed(1)}ms)`
    );
  }
});

const PORT = process.env.PORT || 3000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Cổng ${PORT} đang bị chiếm. Đổi cổng hoặc tắt tiến trình cũ.`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`\nhttp://localhost:${PORT}`);
  console.log('Bảng route:');
  router.danhSach().forEach((d) => console.log('  ' + d));
  console.log();
});
