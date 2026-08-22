import { z } from 'zod';

export const locSanPhamSchema = z.object({
  danhMuc: z.string().trim().optional(),
  tuKhoa: z.string().trim().max(100).optional(),
  giaTu: z.coerce.number().int().min(0).optional(),
  giaDen: z.coerce.number().int().min(0).optional(),
  conHang: z.enum(['true', 'false']).optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  sapXep: z.enum(['moi-nhat', 'gia-tang', 'gia-giam', 'ten']).default('moi-nhat'),
  trang: z.coerce.number().int().min(1).default(1),
  moiTrang: z.coerce.number().int().min(1).max(50).default(20),
});

export const taoSanPhamSchema = z
  .object({
    ten: z.string().trim().min(1).max(200),
    slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'Chỉ chữ thường, số và dấu gạch ngang'),
    moTa: z.string().trim().max(5000).optional(),
    // Tiền là SỐ NGUYÊN — đơn vị đồng
    giaVND: z.number().int('Giá phải là số nguyên (đơn vị: đồng)').min(0),
    tonKho: z.number().int().min(0).default(0),
    danhMucId: z.number().int().min(1),
  })
  .strict();

export const suaSanPhamSchema = taoSanPhamSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { error: 'Phải có ít nhất một trường' });

export const idSchema = z.object({ id: z.coerce.number().int().min(1) });
