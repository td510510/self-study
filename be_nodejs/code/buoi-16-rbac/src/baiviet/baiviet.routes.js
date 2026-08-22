import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../lib/validate.js';
import { yeuCauDangNhap } from '../auth/auth.middleware.js';
import * as service from './baiviet.service.js';

const taoSchema = z
  .object({
    tieuDe: z.string().trim().min(1, 'Không được rỗng').max(200, 'Tối đa 200 ký tự'),
    noiDung: z.string().trim().min(1, 'Không được rỗng'),
    // ⚠️ CỐ TÌNH KHÔNG CÓ tacGiaId ở đây.
    // .strict() sẽ TỪ CHỐI nếu client cố gửi lên — chống mạo danh tác giả.
  })
  .strict();

const suaSchema = taoSchema.partial().refine((d) => Object.keys(d).length > 0, {
  error: 'Phải có ít nhất một trường để cập nhật',
});

const idSchema = z.object({ id: z.coerce.number().int().min(1) });

export function taoBaiVietRouter() {
  const router = Router();

  // Toàn bộ router yêu cầu đăng nhập.
  // Đặt ở đây thay vì lặp lại từng route → không thể quên sót.
  router.use(yeuCauDangNhap());

  router.get('/', async (req, res) => {
    res.json(await service.danhSach(req.nguoiDung, { chiCuaToi: req.query.cuaToi === 'true' }));
  });

  router.get('/:id', validate('params', idSchema), async (req, res) => {
    res.json(await service.layMot(req.params.id, req.nguoiDung));
  });

  router.post('/', validate('body', taoSchema), async (req, res) => {
    const bai = await service.tao(req.nguoiDung, req.body);
    res.status(201).location(`/bai-viet/${bai.id}`).json(bai);
  });

  router.patch(
    '/:id',
    validate('params', idSchema),
    validate('body', suaSchema),
    async (req, res) => {
      res.json(await service.sua(req.params.id, req.nguoiDung, req.body));
    }
  );

  router.post('/:id/dang', validate('params', idSchema), async (req, res) => {
    res.json(await service.dang(req.params.id, req.nguoiDung));
  });

  router.delete('/:id', validate('params', idSchema), async (req, res) => {
    await service.xoa(req.params.id, req.nguoiDung);
    res.sendStatus(204);
  });

  return router;
}
