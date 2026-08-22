/**
 * Lớp lỗi mang theo HTTP status code (buổi 05).
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
  khongChoPhep: (thongDiep, choPhep) =>
    Object.assign(new HttpError(405, thongDiep), { choPhep }),
  quaLon: (thongDiep) => new HttpError(413, thongDiep),
  saiKieuNoiDung: (thongDiep) => new HttpError(415, thongDiep),
  dangTat: () => new HttpError(503, 'Server đang tắt, thử lại sau'),
};
