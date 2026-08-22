/**
 * Project 2 — Phân loại lỗi.
 *
 * PHÂN BIỆT QUAN TRỌNG NHẤT TRONG XỬ LÝ LỖI BACKEND:
 *
 *   LỖI VẬN HÀNH (operational)  — chuyện BÌNH THƯỜNG, đã lường trước
 *     · người dùng gửi dữ liệu sai
 *     · không tìm thấy bản ghi
 *     · hết hàng trong kho
 *     · mất kết nối mạng tạm thời
 *     → Xử lý được. Trả lỗi rõ ràng cho client. KHÔNG cần đánh thức ai.
 *
 *   LỖI LẬP TRÌNH (programmer)  — BUG
 *     · gọi hàm trên undefined
 *     · quên await
 *     · sai kiểu dữ liệu
 *     → KHÔNG xử lý được. Ghi log đầy đủ, cảnh báo, và trả 500 chung chung.
 *
 * Vì sao phải phân biệt? Vì nếu coi mọi lỗi là như nhau:
 *   - Log ngập tràn lỗi 400 "bình thường" → không thấy được bug thật
 *   - Hệ thống cảnh báo kêu suốt ngày → không ai còn để ý
 */

export class HttpError extends Error {
  constructor(statusCode, message, { cause, chiTiet, ma } = {}) {
    super(message, { cause });
    this.name = 'HttpError';
    this.statusCode = statusCode;

    /// Đánh dấu đây là lỗi ĐÃ LƯỜNG TRƯỚC — an toàn để lộ thông điệp
    this.laLoiVanHanh = true;

    /// Mã lỗi ổn định để frontend xử lý theo chương trình,
    /// thay vì so khớp chuỗi tiếng Việt (sẽ vỡ khi ta sửa câu chữ).
    this.ma = ma;

    this.chiTiet = chiTiet;
  }
}

export const loi = {
  duLieuSai: (t, chiTiet) => new HttpError(400, t, { ma: 'DU_LIEU_SAI', chiTiet }),
  chuaDangNhap: (t = 'Cần đăng nhập') => new HttpError(401, t, { ma: 'CHUA_DANG_NHAP' }),
  khongDuQuyen: (t = 'Không đủ quyền') => new HttpError(403, t, { ma: 'KHONG_DU_QUYEN' }),
  khongTimThay: (t = 'Không tìm thấy') => new HttpError(404, t, { ma: 'KHONG_TIM_THAY' }),
  xungDot: (t) => new HttpError(409, t, { ma: 'XUNG_DOT' }),
  hetHang: (ten, con) =>
    new HttpError(409, `Sản phẩm "${ten}" chỉ còn ${con} sản phẩm`, {
      ma: 'HET_HANG',
      chiTiet: { conLai: con },
    }),
  quaNhieuRequest: (giay) =>
    new HttpError(429, `Quá nhiều request, thử lại sau ${giay} giây`, { ma: 'QUA_NHIEU_REQUEST' }),
};

/** Ánh xạ mã lỗi Prisma → HttpError (bài học buổi 13). */
export function tuLoiPrisma(err) {
  switch (err.code) {
    case 'P2002': {
      // Prisma 7 + driver adapter: tên cột nằm sâu, không ở err.meta.target
      const cot = err.meta?.driverAdapterError?.cause?.constraint?.fields ?? err.meta?.target;
      return new HttpError(409, `Giá trị đã tồn tại: ${cot ?? 'không rõ cột'}`, {
        ma: 'TRUNG_DU_LIEU',
        cause: err,
      });
    }
    case 'P2025':
      return new HttpError(404, 'Không tìm thấy bản ghi', { ma: 'KHONG_TIM_THAY', cause: err });
    case 'P2003':
      return new HttpError(400, 'Dữ liệu tham chiếu không hợp lệ', {
        ma: 'THAM_CHIEU_SAI',
        cause: err,
      });
    default:
      return null; // không nhận ra → để nó nổi lên như lỗi lập trình
  }
}
