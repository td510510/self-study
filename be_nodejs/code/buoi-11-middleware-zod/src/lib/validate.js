/**
 * Buổi 11 — Middleware validate dùng zod.
 *
 * Đây là MIDDLEWARE FACTORY: một hàm trả về middleware.
 * Pattern này gặp ở khắp hệ sinh thái Express — và cũng chính là
 * ý tưởng của ValidationPipe trong NestJS (buổi 32).
 */

import { HttpError } from './errors.js';

/**
 * Chuyển lỗi zod thành định dạng { tenTruong: 'thông điệp' }
 * — GIỮ NGUYÊN format lỗi của Project 1 để frontend không phải sửa gì.
 */
function doiDangLoi(zodError) {
  const chiTiet = {};
  for (const issue of zodError.issues) {
    // path là mảng, ví dụ ['tieuDe'] hoặc [] nếu lỗi ở cấp object
    const ten = issue.path.length > 0 ? issue.path.join('.') : '_body';
    // Chỉ giữ lỗi ĐẦU TIÊN của mỗi trường cho gọn
    if (!chiTiet[ten]) chiTiet[ten] = issue.message;
  }
  return chiTiet;
}

/**
 * Tạo middleware validate cho một phần của request.
 *
 * @param {'body'|'query'|'params'} nguon - phần nào của request cần kiểm tra
 * @param {import('zod').ZodType} schema
 *
 * Cách dùng:
 *   router.post('/', validate('body', taoTodoSchema), handler);
 */
export function validate(nguon, schema) {
  return (req, res, next) => {
    const ketQua = schema.safeParse(req[nguon]);

    if (!ketQua.success) {
      return next(
        new HttpError(400, 'Dữ liệu không hợp lệ', { chiTiet: doiDangLoi(ketQua.error) })
      );
    }

    // ⚠️ Gán DỮ LIỆU ĐÃ LÀM SẠCH đè lên dữ liệu thô.
    // Từ đây trở đi, handler chỉ thấy dữ liệu đã trim, đã ép kiểu,
    // đã điền giá trị mặc định. Không cần kiểm tra gì thêm.
    //
    // Express 5: req.query là getter chỉ đọc → phải dùng defineProperty.
    // Đây là thay đổi so với Express 4, rất hay làm người mới vấp.
    if (nguon === 'query') {
      Object.defineProperty(req, 'query', { value: ketQua.data, writable: true });
    } else {
      req[nguon] = ketQua.data;
    }

    next();
  };
}
