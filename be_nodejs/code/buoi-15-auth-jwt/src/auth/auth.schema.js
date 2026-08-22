import { z } from 'zod';

export const dangKySchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
    ten: z.string().trim().min(1, 'Không được rỗng').max(100, 'Tối đa 100 ký tự'),
    // Yêu cầu độ mạnh tối thiểu. Đừng quá khắt khe —
    // NIST khuyến nghị ưu tiên ĐỘ DÀI hơn là bắt ký tự đặc biệt.
    matKhau: z
      .string()
      .min(8, 'Tối thiểu 8 ký tự')
      .max(72, 'Tối đa 72 ký tự (giới hạn của bcrypt)'),
  })
  .strict();

export const dangNhapSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Email không hợp lệ'),
    matKhau: z.string().min(1, 'Không được rỗng'),
  })
  .strict();

export const refreshSchema = z.object({ refreshToken: z.string().min(1) }).strict();
