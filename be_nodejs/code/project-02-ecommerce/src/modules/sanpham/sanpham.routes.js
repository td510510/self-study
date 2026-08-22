import { Router } from 'express';
import { validate } from '../../lib/validate.js';
import { yeuCauDangNhap } from '../auth/auth.middleware.js';
import { locSanPhamSchema, taoSanPhamSchema, suaSanPhamSchema, idSchema } from './sanpham.schema.js';
import * as service from './sanpham.service.js';

export function taoSanPhamRouter() {
  const router = Router();

  // Xem sản phẩm KHÔNG cần đăng nhập — đây là shop công khai
  router.get('/', validate('query', locSanPhamSchema), async (req, res) => {
    res.json(await service.danhSach(req.query));
  });

  router.get('/:id', validate('params', idSchema), async (req, res) => {
    res.json(await service.layMot(req.params.id));
  });

  // Từ đây trở xuống cần đăng nhập + quyền
  router.post('/', yeuCauDangNhap(), validate('body', taoSanPhamSchema), async (req, res) => {
    const sp = await service.tao(req.nguoiDung, req.body);
    res.status(201).location(`/san-pham/${sp.id}`).json(sp);
  });

  router.patch(
    '/:id',
    yeuCauDangNhap(),
    validate('params', idSchema),
    validate('body', suaSanPhamSchema),
    async (req, res) => {
      res.json(await service.sua(req.nguoiDung, req.params.id, req.body));
    }
  );

  router.delete('/:id', yeuCauDangNhap(), validate('params', idSchema), async (req, res) => {
    await service.ngungBan(req.nguoiDung, req.params.id);
    res.sendStatus(204);
  });

  return router;
}
