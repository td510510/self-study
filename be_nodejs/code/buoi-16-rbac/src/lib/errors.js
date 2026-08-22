export class HttpError extends Error {
  constructor(statusCode, message, { cause, chiTiet } = {}) {
    super(message, { cause });
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.chiTiet = chiTiet;
  }
}

export const loi = {
  duLieuSai: (t, c) => new HttpError(400, t, { chiTiet: c }),
  chuaDangNhap: (t = 'Cần đăng nhập') => new HttpError(401, t),
  khongDuQuyen: (t = 'Không đủ quyền') => new HttpError(403, t),
  khongTimThay: (t = 'Không tìm thấy') => new HttpError(404, t),
  xungDot: (t) => new HttpError(409, t),
};
