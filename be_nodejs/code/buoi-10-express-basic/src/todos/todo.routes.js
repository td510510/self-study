/**
 * Tầng HTTP viết bằng Express.
 *
 * SO SÁNH VỚI PROJECT 1:
 *   - Project 1: cần lib/router.js (80 dòng) + lib/body.js (50 dòng)
 *                + lib/respond.js (40 dòng) mới chạy được file này.
 *   - Express  : cả 170 dòng đó biến mất. express.Router() và express.json() lo hộ.
 *
 * Nhưng LOGIC thì giống hệt — vì ta đã hiểu bản chất từ Phase 1.
 */

import { Router } from 'express';

export function taoTodoRouter(service) {
  const router = Router();

  // ⚠️ Thứ tự route VẪN QUAN TRỌNG y hệt Node thuần.
  // Express cũng duyệt từ trên xuống, route nào khớp trước thì thắng.
  // Đăng ký '/thong-ke' SAU '/:id' là hỏng ngay.
  router.get('/thong-ke', (req, res) => {
    res.json(service.thongKe());
  });

  router.get('/', (req, res) => {
    res.json(service.danhSach(req.query));
  });

  router.get('/:id', (req, res) => {
    res.json(service.layMot(req.params.id));
  });

  router.post('/', async (req, res) => {
    const todoMoi = await service.tao(req.body ?? null);
    // .status().location().json() — chuỗi phương thức thay cho writeHead thủ công
    res.status(201).location(`/todos/${todoMoi.id}`).json(todoMoi);
  });

  router.put('/:id', async (req, res) => {
    res.json(await service.thayThe(req.params.id, req.body ?? null));
  });

  router.patch('/:id', async (req, res) => {
    res.json(await service.suaMotPhan(req.params.id, req.body ?? null));
  });

  router.delete('/:id', async (req, res) => {
    await service.xoa(req.params.id);
    res.sendStatus(204);
  });

  return router;
}

/*
 * BA THỨ EXPRESS LÀM HỘ TRONG FILE NÀY
 *
 * 1. req.params  — Express tự parse ':id', ta không cần pathToRegex
 * 2. req.query   — Express tự parse query string
 * 3. req.body    — express.json() đã parse sẵn (khai báo ở app.js)
 *
 * VÀ MỘT THỨ EXPRESS 5 LÀM HỘ MÀ EXPRESS 4 KHÔNG:
 *
 *   Handler async ném lỗi → Express 5 TỰ ĐỘNG chuyển tới error middleware.
 *   Ở Express 4, phải tự bọc:
 *
 *     const asyncHandler = (fn) => (req, res, next) =>
 *       Promise.resolve(fn(req, res, next)).catch(next);
 *
 *   Quên bọc ở Express 4 = lỗi bị nuốt, request treo mãi không trả lời.
 *   Đây là bug kinh điển nhất của Express 4. Xem file 02-express4-async-trap.js.
 */
