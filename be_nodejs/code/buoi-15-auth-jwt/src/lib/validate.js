import { HttpError } from './errors.js';

function doiDangLoi(zodError) {
  const chiTiet = {};
  for (const issue of zodError.issues) {
    const ten = issue.path.length > 0 ? issue.path.join('.') : '_body';
    if (!chiTiet[ten]) chiTiet[ten] = issue.message;
  }
  return chiTiet;
}

export function validate(nguon, schema) {
  return (req, res, next) => {
    const kq = schema.safeParse(req[nguon]);
    if (!kq.success) {
      return next(new HttpError(400, 'Dữ liệu không hợp lệ', { chiTiet: doiDangLoi(kq.error) }));
    }
    if (nguon === 'query') {
      Object.defineProperty(req, 'query', { value: kq.data, writable: true });
    } else {
      req[nguon] = kq.data;
    }
    next();
  };
}
