import { z } from 'zod';

export const datHangSchema = z
  .object({
    diaChiGiao: z.string().trim().min(5, 'Địa chỉ quá ngắn').max(300),
    soDienThoai: z
      .string()
      .trim()
      .regex(/^0\d{9}$/, 'Số điện thoại phải có 10 chữ số, bắt đầu bằng 0'),
  })
  .strict();

export const idSchema = z.object({ id: z.coerce.number().int().min(1) });
