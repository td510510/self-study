/**
 * Ráp ứng dụng: router + xử lý lỗi tập trung + log mỗi request.
 *
 * Tách khỏi server.js để TEST được mà không cần mở cổng thật —
 * đây chính là lý do Express tách app khỏi server, và NestJS
 * có Test.createTestingModule (buổi 36).
 */

import { createRouter } from './lib/router.js';
import { guiLoi, json } from './lib/respond.js';
import { loi } from './lib/errors.js';
import { dangKyRouteTodo } from './todos/todo.routes.js';

export function taoApp({ service, logger, bodyLimit, dangTat }) {
  const router = createRouter();

  router.get('/health', (req, res) => {
    // 503 khi đang tắt → load balancer biết ngừng gửi request tới (buổi 43)
    json(res, dangTat() ? 503 : 200, {
      trangThai: dangTat() ? 'dang-tat' : 'ok',
      thoiGianChay: Math.round(process.uptime()),
    });
  });

  dangKyRouteTodo(router, service, bodyLimit);

  /** Handler chính — MỘT try/catch duy nhất bọc toàn bộ ứng dụng. */
  async function xuLy(req, res) {
    const batDau = process.hrtime.bigint();

    try {
      // Từ chối tử tế khi đang tắt (trừ /health để còn kiểm tra được)
      if (dangTat() && !req.url.startsWith('/health')) {
        throw loi.dangTat();
      }

      const ketQua = router.tim(req.method, req.url, req.headers.host ?? 'localhost');

      if (ketQua.loai === 'khong-thay') {
        throw loi.khongTimThay(`Không có đường dẫn ${req.method} ${req.url}`);
      }

      if (ketQua.loai === 'sai-method') {
        throw loi.khongChoPhep(
          `Method ${req.method} không được hỗ trợ cho đường dẫn này`,
          ketQua.choPhep
        );
      }

      req.params = ketQua.params;
      req.query = ketQua.query;
      await ketQua.handler(req, res);
    } catch (err) {
      guiLoi(res, err, logger);
    } finally {
      const msec = Number(process.hrtime.bigint() - batDau) / 1e6;
      logger.info('request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        msec: Number(msec.toFixed(1)),
      });
    }
  }

  return { xuLy, danhSachRoute: router.danhSach() };
}
