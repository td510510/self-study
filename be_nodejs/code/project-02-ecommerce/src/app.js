/**
 * Project 2 — Ráp ứng dụng.
 */

import express from 'express';
import pinoHttp from 'pino-http';

import { cauHinhPinoHttp } from './lib/logger.js';
import { cauHinhCors, cauHinhHelmet, rateLimit } from './lib/bao-mat.js';
import { xuLyLoi, khongTimThayRoute } from './lib/xu-ly-loi.js';
import { taoAuthRouter } from './modules/auth/auth.routes.js';
import { taoSanPhamRouter } from './modules/sanpham/sanpham.routes.js';
import { taoGioHangRouter } from './modules/giohang/giohang.routes.js';
import { taoDonHangRouter } from './modules/donhang/donhang.routes.js';

export function taoApp({ logger, origins = ['http://localhost:5173'], batRateLimit = true }) {
  const app = express();

  // Sau reverse proxy (Nginx), req.ip mới đúng là IP thật của client
  app.set('trust proxy', 1);

  // 1. Log + request-id — đặt ĐẦU TIÊN để mọi log phía sau có id
  app.use(pinoHttp(cauHinhPinoHttp(logger)));

  // 2. Header bảo mật — đặt SỚM để áp cho MỌI response, kể cả response lỗi
  app.use(cauHinhHelmet());

  // 3. CORS — phải TRƯỚC route, vì preflight OPTIONS cần được trả lời
  app.use(cauHinhCors(origins));

  // 4. Rate limit TRƯỚC express.json() —
  //    chặn kẻ tấn công TRƯỚC KHI tốn công đọc body của họ (buổi 11)
  if (batRateLimit) {
    app.use(rateLimit({ soLanToiDa: 300, cuaSoGiay: 60, tien: 'chung' }));
    // Endpoint đăng nhập siết chặt hơn nhiều: bcrypt tốn CPU (buổi 15),
    // và đây là mục tiêu số một của tấn công dò mật khẩu.
    app.use('/auth/dang-nhap', rateLimit({ soLanToiDa: 5, cuaSoGiay: 60, tien: 'dangnhap' }));
  }

  // 5. Parse body
  app.use(express.json({ limit: '100kb' }));

  // 3. Route
  app.get('/health', (req, res) => {
    res.json({ trangThai: 'ok', thoiGianChay: Math.round(process.uptime()) });
  });

  app.use('/auth', taoAuthRouter());
  app.use('/san-pham', taoSanPhamRouter());
  app.use('/gio-hang', taoGioHangRouter());
  app.use('/don-hang', taoDonHangRouter());

  // 4. Không route nào khớp
  app.use(khongTimThayRoute());

  // 5. Xử lý lỗi — LUÔN CUỐI CÙNG
  app.use(xuLyLoi(logger));

  return app;
}
