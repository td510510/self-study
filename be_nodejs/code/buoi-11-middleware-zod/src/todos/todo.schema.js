/**
 * Buổi 11 — Schema zod thay cho validator viết tay.
 *
 * SO SÁNH: todo.validator.js của Project 1 dài ~70 dòng if/else.
 * Toàn bộ file này làm đúng việc đó, ngắn hơn nhiều, và còn CHẶT HƠN.
 */

import { z } from 'zod';

const UU_TIEN = ['thap', 'trung', 'cao'];

/**
 * .strict() — CHỐNG MASS ASSIGNMENT.
 *
 * Ở Project 1 ta chống bằng cách xây object `sach` mới và chỉ gán
 * các trường cho phép. zod làm việc đó bằng một lời gọi:
 * gửi kèm trường lạ như { vaiTro: 'admin' } → BỊ TỪ CHỐI ngay với lỗi 400.
 *
 * Chú ý khác biệt về ngữ nghĩa:
 *   Project 1: LẶNG LẼ LOẠI BỎ trường lạ
 *   .strict(): BÁO LỖI khi có trường lạ  ← chặt hơn, tốt hơn
 */
/**
 * Schema GỐC — mô tả hình dạng dữ liệu, KHÔNG có giá trị mặc định.
 * Ta tách riêng vì lý do ở phần suaTodoSchema bên dưới.
 */
const todoGoc = z
  .object({
    tieuDe: z
      .string({ error: 'Bắt buộc, phải là chuỗi' })
      .trim()
      .min(1, 'Không được rỗng')
      .max(200, 'Tối đa 200 ký tự'),
    xong: z.boolean('Phải là true hoặc false'),
    uuTien: z.enum(UU_TIEN, `Phải là một trong: ${UU_TIEN.join(', ')}`),
  })
  .strict();

/** POST — thêm giá trị mặc định cho các trường không bắt buộc. */
export const taoTodoSchema = todoGoc.extend({
  xong: todoGoc.shape.xong.default(false),
  uuTien: todoGoc.shape.uuTien.default('trung'),
});

/** PUT = thay thế toàn bộ → dùng lại schema tạo mới. */
export const thayTheTodoSchema = taoTodoSchema;

/**
 * PATCH = sửa một phần.
 *
 * ⚠️ BẪY ZOD — phải dùng todoGoc (KHÔNG default) chứ không phải taoTodoSchema:
 *
 *   taoTodoSchema.partial().parse({})  →  { xong: false, uuTien: 'trung' }
 *   todoGoc.partial().parse({})        →  {}   ✅
 *
 * Vì .partial() chỉ biến trường thành TUỲ CHỌN, nó KHÔNG gỡ bỏ .default().
 * Dùng nhầm thì PATCH với body rỗng sẽ lặng lẽ ghi đè xong=false, uuTien='trung'
 * lên dữ liệu đang có — mất dữ liệu mà không báo lỗi gì.
 */
export const suaTodoSchema = todoGoc
  .partial()
  .refine((d) => Object.keys(d).length > 0, {
    error: 'Phải có ít nhất một trường để cập nhật',
  });

/**
 * Query string LUÔN là chuỗi — cần ép kiểu.
 * Ở Project 1 ta tự viết Number() rồi kiểm tra Number.isInteger.
 */
export const locTodoSchema = z.object({
  xong: z
    .enum(['true', 'false'], 'Phải là true hoặc false')
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),

  uuTien: z.enum(UU_TIEN, `Phải là một trong: ${UU_TIEN.join(', ')}`).optional(),

  trang: z.coerce.number().int('Phải là số nguyên').min(1, 'Phải >= 1').default(1),

  moiTrang: z.coerce
    .number()
    .int('Phải là số nguyên')
    .min(1, 'Phải >= 1')
    .max(100, 'Tối đa 100')
    .default(20),
});

/** Route param cũng là chuỗi — ép về số nguyên dương. */
export const idParamSchema = z.object({
  id: z.coerce.number().int('id phải là số nguyên').min(1, 'id phải >= 1'),
});
