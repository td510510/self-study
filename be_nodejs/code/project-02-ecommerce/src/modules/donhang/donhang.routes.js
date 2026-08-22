import { Router } from 'express';
import { validate } from '../../lib/validate.js';
import { yeuCauDangNhap } from '../auth/auth.middleware.js';
import { z } from 'zod';
import { datHangSchema, idSchema } from './donhang.schema.js';
import { idempotency } from '../../lib/idempotency.js';
import { baoChoNhanVien } from '../../lib/realtime.js';
import * as service from './donhang.service.js';

export function taoDonHangRouter() {
  const router = Router();
  router.use(yeuCauDangNhap());

  router.get('/', async (req, res) => {
    res.json(await service.danhSach(req.nguoiDung));
  });

  router.get('/:id', validate('params', idSchema), async (req, res) => {
    res.json(await service.layMot(req.params.id, req.nguoiDung));
  });

  // Đặt hàng là thao tác KHÔNG idempotent tự nhiên (POST tạo mới mỗi lần gọi)
  // → cần idempotency key để chống bấm hai lần / retry của client.
  router.post('/', idempotency(), validate('body', datHangSchema), async (req, res) => {
    // Dùng phiên bản AN TOÀN — có transaction + khoá dòng.
    // Hai phiên bản kia chỉ để dạy, không dùng thật.
    const don = await service.datHangAnToan(req.nguoiDung.id, req.body);
    // Báo cho nhân viên có đơn mới — họ không phải F5 liên tục
    baoChoNhanVien('don-hang:moi', { id: don.id, maDon: don.maDon, tongTienVND: don.tongTienVND });
    res.status(201).location(`/don-hang/${don.id}`).json(don);
  });

  router.patch(
    '/:id/trang-thai',
    validate('params', idSchema),
    validate(
      'body',
      z
        .object({
          trangThai: z.enum(['daXacNhan', 'dangGiao', 'daGiao', 'daHuy']),
        })
        .strict()
    ),
    async (req, res) => {
      res.json(await service.doiTrangThai(req.params.id, req.nguoiDung, req.body.trangThai));
    }
  );

  return router;
}
