import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../lib/validate.js';
import { yeuCauDangNhap } from '../auth/auth.middleware.js';
import * as service from './giohang.service.js';

const themSchema = z
  .object({
    sanPhamId: z.number().int().min(1),
    soLuong: z.number().int().min(1).max(99).default(1),
  })
  .strict();

const suaSchema = z.object({ soLuong: z.number().int().min(0).max(99) }).strict();
const idSchema = z.object({ sanPhamId: z.coerce.number().int().min(1) });

export function taoGioHangRouter() {
  const router = Router();
  router.use(yeuCauDangNhap());

  router.get('/', async (req, res) => {
    res.json(await service.xem(req.nguoiDung.id));
  });

  router.post('/items', validate('body', themSchema), async (req, res) => {
    res.status(201).json(await service.themItem(req.nguoiDung.id, req.body));
  });

  router.patch(
    '/items/:sanPhamId',
    validate('params', idSchema),
    validate('body', suaSchema),
    async (req, res) => {
      const kq = await service.suaSoLuong(req.nguoiDung.id, req.params.sanPhamId, req.body.soLuong);
      if (!kq) return res.sendStatus(204);
      res.json(kq);
    }
  );

  router.delete('/items/:sanPhamId', validate('params', idSchema), async (req, res) => {
    await service.xoaItem(req.nguoiDung.id, req.params.sanPhamId);
    res.sendStatus(204);
  });

  return router;
}
