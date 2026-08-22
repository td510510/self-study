/**
 * HttpError — GIỮ NGUYÊN từ Project 1.
 *
 * Điểm dạy: Express KHÔNG bắt ta đổi cách định nghĩa lỗi.
 * Toàn bộ file này copy nguyên xi từ Node thuần sang.
 */

export class HttpError extends Error {
  constructor(statusCode, message, { cause, chiTiet } = {}) {
    super(message, { cause });
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.chiTiet = chiTiet;
  }
}

export const loi = {
  duLieuSai: (thongDiep, chiTiet) => new HttpError(400, thongDiep, { chiTiet }),
  khongTimThay: (thongDiep = 'Không tìm thấy tài nguyên') => new HttpError(404, thongDiep),
  quaLon: (thongDiep) => new HttpError(413, thongDiep),
};
