/**
 * Buổi 05 — Lớp lỗi mang theo status code.
 *
 * Nối tiếp DataError của buổi 03: ta phân biệt
 * "lỗi đã lường trước" với "bug thật sự".
 *
 * Lần này lỗi mang thêm statusCode, để tầng trên biết trả HTTP mã nào.
 */

export class HttpError extends Error {
  /**
   * @param {number} statusCode - mã HTTP trả về cho client
   * @param {string} message    - thông điệp AN TOÀN để lộ ra ngoài
   * @param {object} [options]
   * @param {Error}  [options.cause]   - lỗi gốc, chỉ dùng để ghi log
   * @param {object} [options.chiTiet] - chi tiết thêm cho client (lỗi validate...)
   */
  constructor(statusCode, message, { cause, chiTiet } = {}) {
    super(message, { cause });
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.chiTiet = chiTiet;
  }
}

/** Các lỗi hay dùng — viết sẵn cho gọn. */
export const loi = {
  khongTimThay: (thongDiep = 'Không tìm thấy tài nguyên') => new HttpError(404, thongDiep),
  duLieuSai: (thongDiep, chiTiet) => new HttpError(400, thongDiep, { chiTiet }),
  chuaDangNhap: (thongDiep = 'Cần đăng nhập') => new HttpError(401, thongDiep),
  khongDuQuyen: (thongDiep = 'Không đủ quyền truy cập') => new HttpError(403, thongDiep),
  xungDot: (thongDiep) => new HttpError(409, thongDiep),
};

/*
 * VÌ SAO TÁCH statusCode VÀO LỚP LỖI?
 *
 * Không có nó, mỗi handler phải tự nhớ trả mã nào:
 *
 *   if (!todo) { res.writeHead(404); res.end('...'); return; }   ← lặp khắp nơi
 *
 * Có nó, handler chỉ cần ném lỗi:
 *
 *   if (!todo) throw loi.khongTimThay(`Không có todo id=${id}`);
 *
 * và MỘT chỗ duy nhất ở tầng trên lo việc chuyển lỗi thành response.
 *
 * Đây chính là ý tưởng của:
 *   - error-handling middleware trong Express  (buổi 11)
 *   - Exception Filter trong NestJS            (buổi 35)
 *
 * Học viên viết tay hôm nay để hiểu bản chất, framework làm hộ sau.
 */
