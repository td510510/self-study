import { Router } from 'express';
import { validate } from '../../lib/validate.js';
import { dangKySchema, dangNhapSchema, refreshSchema } from './auth.schema.js';
import { yeuCauDangNhap } from './auth.middleware.js';
import * as service from './auth.service.js';

export function taoAuthRouter() {
  const router = Router();

  router.post('/dang-ky', validate('body', dangKySchema), async (req, res) => {
    res.status(201).json(await service.dangKy(req.body));
  });

  router.post('/dang-nhap', validate('body', dangNhapSchema), async (req, res) => {
    res.json(await service.dangNhap(req.body));
  });

  router.post('/lam-moi', validate('body', refreshSchema), async (req, res) => {
    res.json(await service.lamMoiToken(req.body.refreshToken));
  });

  router.post('/dang-xuat', validate('body', refreshSchema), async (req, res) => {
    await service.dangXuat(req.body.refreshToken);
    res.sendStatus(204);
  });

  router.get('/toi', yeuCauDangNhap(), async (req, res) => {
    res.json(await service.layHoSo(req.nguoiDung.id));
  });

  return router;
}
