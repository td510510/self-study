/**
 * Buổi 11 — Bộ middleware tự viết, dùng lại được ở mọi dự án.
 */

import { randomUUID } from 'node:crypto';
import { HttpError } from './errors.js';

/**
 * 1. REQUEST ID — gắn mã định danh cho mỗi request.
 *
 * Vì sao cần? Ở production có hàng nghìn request/phút, log trộn lẫn nhau.
 * Có request-id thì lọc được toàn bộ log của MỘT request cụ thể khi có sự cố.
 * Trả về qua header để frontend đính kèm khi báo lỗi.
 */
export function requestId() {
  return (req, res, next) => {
    // Tôn trọng id do reverse proxy/load balancer gửi xuống, nếu có
    req.id = req.headers['x-request-id'] ?? randomUUID();
    res.setHeader('X-Request-Id', req.id);
    next();
  };
}

/**
 * 2. RATE LIMIT — chống gọi API quá nhiều.
 *
 * ⚠️ Bản này lưu bộ đếm trong RAM nên CHỈ ĐÚNG khi chạy MỘT tiến trình.
 *    Chạy nhiều bản sao (buổi 44) thì mỗi bản đếm riêng → giới hạn thật
 *    bị nhân lên. Ở buổi 22 ta chuyển bộ đếm sang Redis.
 */
export function rateLimit({ soLanToiDa = 100, cuaSoMs = 60_000 } = {}) {
  const kho = new Map(); // ip -> { dem, hetHanLuc }

  return (req, res, next) => {
    const ip = req.ip ?? req.socket.remoteAddress;
    const bayGio = Date.now();
    const ban = kho.get(ip);

    if (!ban || bayGio > ban.hetHanLuc) {
      kho.set(ip, { dem: 1, hetHanLuc: bayGio + cuaSoMs });
      return next();
    }

    ban.dem++;

    if (ban.dem > soLanToiDa) {
      const conLaiGiay = Math.ceil((ban.hetHanLuc - bayGio) / 1000);
      // 429 + Retry-After là chuẩn HTTP — client biết chờ bao lâu
      res.setHeader('Retry-After', conLaiGiay);
      return next(new HttpError(429, `Quá nhiều request, thử lại sau ${conLaiGiay} giây`));
    }

    next();
  };
}

/**
 * 3. TIMEOUT — không để request treo vô hạn.
 *
 * Nhớ buổi 07: Promise.race đặt hạn chót. Ở đây ta làm điều tương tự
 * ở tầng HTTP, dựa vào sự kiện của response.
 */
export function timeout(ms = 10_000) {
  return (req, res, next) => {
    const dongHo = setTimeout(() => {
      if (!res.headersSent) {
        next(new HttpError(503, `Xử lý quá ${ms}ms`));
      }
    }, ms);

    // Dọn dẹp dù response kết thúc bình thường hay bị client ngắt
    res.on('finish', () => clearTimeout(dongHo));
    res.on('close', () => clearTimeout(dongHo));

    next();
  };
}

/**
 * 4. LOG REQUEST — đo thời gian bằng sự kiện 'finish'.
 */
export function logRequest(logger) {
  return (req, res, next) => {
    const batDau = process.hrtime.bigint();

    res.on('finish', () => {
      const msec = Number(process.hrtime.bigint() - batDau) / 1e6;
      logger.info('request', {
        id: req.id,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        msec: Number(msec.toFixed(1)),
      });
    });

    next();
  };
}

/**
 * 5. CHỈ CHẤP NHẬN JSON — khôi phục hành vi 415 (bài học buổi 10).
 */
export function chiChapNhanJson() {
  return (req, res, next) => {
    const coBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
    const contentType = req.headers['content-type'] ?? '';

    if (coBody && !contentType.startsWith('application/json')) {
      return next(
        new HttpError(415, `Content-Type phải là application/json, nhận được: ${contentType || '(trống)'}`)
      );
    }
    next();
  };
}
