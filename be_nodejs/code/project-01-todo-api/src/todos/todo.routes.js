/**
 * Tầng HTTP — chỗ DUY NHẤT biết về req/res.
 *
 * Nhiệm vụ: dịch HTTP thành lời gọi service, rồi dịch kết quả về HTTP.
 * KHÔNG chứa logic nghiệp vụ. Ở buổi 30, tầng này thành @Controller của NestJS.
 */

import { docJson } from '../lib/body.js';
import { json, khongCoNoiDung } from '../lib/respond.js';

export function dangKyRouteTodo(router, service, gioiHanBody) {
  // ⚠️ Route CỤ THỂ phải đăng ký TRƯỚC route có tham số (bài học buổi 05).
  // Nếu đảo lại, /todos/thong-ke sẽ rơi vào /todos/:id với id='thong-ke'.
  router.get('/todos/thong-ke', (req, res) => {
    json(res, 200, service.thongKe());
  });

  router.get('/todos', (req, res) => {
    json(res, 200, service.danhSach(req.query));
  });

  router.get('/todos/:id', (req, res) => {
    json(res, 200, service.layMot(req.params.id));
  });

  router.post('/todos', async (req, res) => {
    const body = await docJson(req, gioiHanBody);
    const todoMoi = await service.tao(body);
    // 201 + header Location trỏ tới tài nguyên vừa tạo — đúng chuẩn REST
    json(res, 201, todoMoi, { Location: `/todos/${todoMoi.id}` });
  });

  router.put('/todos/:id', async (req, res) => {
    const body = await docJson(req, gioiHanBody);
    json(res, 200, await service.thayThe(req.params.id, body));
  });

  router.patch('/todos/:id', async (req, res) => {
    const body = await docJson(req, gioiHanBody);
    json(res, 200, await service.suaMotPhan(req.params.id, body));
  });

  router.delete('/todos/:id', async (req, res) => {
    await service.xoa(req.params.id);
    khongCoNoiDung(res); // 204, không có body
  });
}
