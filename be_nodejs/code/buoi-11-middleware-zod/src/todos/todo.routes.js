/**
 * Tầng HTTP — giờ mỗi route KHAI BÁO rõ nó nhận dữ liệu hình dạng nào.
 *
 * So với buổi 10: handler gọn hơn vì không còn phải lo dữ liệu bẩn.
 * Đọc một dòng route là biết ngay nó nhận gì.
 */

import { Router } from 'express';
import { validate } from '../lib/validate.js';
import {
  taoTodoSchema,
  thayTheTodoSchema,
  suaTodoSchema,
  locTodoSchema,
  idParamSchema,
} from './todo.schema.js';

export function taoTodoRouter(service) {
  const router = Router();

  // Route CỤ THỂ trước route CÓ THAM SỐ (bài học buổi 05, vẫn đúng)
  router.get('/thong-ke', (req, res) => {
    res.json(service.thongKe());
  });

  router.get('/', validate('query', locTodoSchema), (req, res) => {
    res.json(service.danhSach(req.query));
  });

  router.get('/:id', validate('params', idParamSchema), (req, res) => {
    res.json(service.layMot(req.params.id));
  });

  router.post('/', validate('body', taoTodoSchema), async (req, res) => {
    const todoMoi = await service.tao(req.body);
    res.status(201).location(`/todos/${todoMoi.id}`).json(todoMoi);
  });

  // Nhiều middleware validate nối tiếp nhau — chạy theo đúng thứ tự khai báo
  router.put(
    '/:id',
    validate('params', idParamSchema),
    validate('body', thayTheTodoSchema),
    async (req, res) => {
      res.json(await service.thayThe(req.params.id, req.body));
    }
  );

  router.patch(
    '/:id',
    validate('params', idParamSchema),
    validate('body', suaTodoSchema),
    async (req, res) => {
      res.json(await service.suaMotPhan(req.params.id, req.body));
    }
  );

  router.delete('/:id', validate('params', idParamSchema), async (req, res) => {
    await service.xoa(req.params.id);
    res.sendStatus(204);
  });

  return router;
}
