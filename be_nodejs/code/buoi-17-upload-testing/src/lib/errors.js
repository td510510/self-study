export class HttpError extends Error {
  constructor(statusCode, message, { cause, chiTiet } = {}) {
    super(message, { cause });
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.chiTiet = chiTiet;
  }
}
