/**
 * Khung chung cho mọi dịch vụ: DB, RabbitMQ, HTTP, health, metrics, outbox relay,
 * consumer, và TẮT MÁY ĐÚNG THỨ TỰ.
 *
 * Ba dịch vụ chỉ khác nhau ở: bảng nào, route nào, nghe sự kiện nào.
 * Phần còn lại giống hệt → viết một lần ở đây. (Ở NestJS, đây là việc của
 * module dùng chung / thư viện nội bộ.)
 */

import express from 'express';
import { taoPool } from './db.js';
import { ketNoiMq, khaiBaoHangDoi, tieuThu } from './mq.js';
import { chayRelay } from './outbox.js';
import { taoQuanSat } from './quan-sat.js';

/**
 * @param {object} p
 * @param {string} p.ten
 * @param {string} p.sql - DDL chạy lúc khởi động
 * @param {(app, deps) => void} [p.dinhTuyen]
 * @param {Array<{ ten: string, khoa: string[], xuLy: Function, tuyChon?: object }>} [p.hangDoi]
 * @param {boolean} [p.coRelay=true]
 * @param {() => void} [p.khiMatKetNoi] - RabbitMQ đứt kết nối ngoài ý muốn
 */
export async function khoiDongDichVu({ ten, dbUrl, mqUrl, sql, logger, cong = 0, dinhTuyen, hangDoi = [], coRelay = true, khiMatKetNoi }) {
  const pool = taoPool(dbUrl);
  // Migration tối giản: CREATE TABLE IF NOT EXISTS. Dự án thật dùng công cụ
  // migration có phiên bản (Prisma migrate — buổi 12) để đổi schema an toàn.
  await pool.query(sql);

  const { conn, ch } = await ketNoiMq(mqUrl);
  let dangDong = false;
  conn.on('error', (err) => logger.error({ loi: err.message }, 'RabbitMQ lỗi kết nối'));
  conn.on('close', () => {
    if (dangDong) return;
    // Chiến lược "crash-only": mất kết nối thì THOÁT, để Docker/K8s/PM2 khởi động lại
    // với trạng thái sạch. Đơn giản và đáng tin hơn tự viết logic kết nối lại.
    logger.fatal('Mất kết nối RabbitMQ');
    khiMatKetNoi?.();
  });

  const qs = taoQuanSat(ten);
  // BÃO HOÀ (tín hiệu vàng thứ tư, buổi 43): pool DB có bao nhiêu người đang XẾP HÀNG chờ kết nối?
  // Số này > 0 kéo dài = request chậm dù từng query vẫn nhanh.
  qs.gauge('db_pool_waiting', 'Số yêu cầu đang chờ lấy kết nối DB', () => pool.waitingCount);
  qs.gauge('db_pool_in_use', 'Số kết nối DB đang bị giữ', () => pool.totalCount - pool.idleCount);
  if (coRelay) {
    // Outbox dồn lên = relay kẹt hoặc RabbitMQ không nhận → cảnh báo trên con số này
    qs.gauge('outbox_pending', 'Số sự kiện trong outbox chưa gửi', async () =>
      (await pool.query('SELECT count(*)::int AS n FROM outbox WHERE da_gui_luc IS NULL')).rows[0].n
    );
  }

  const app = express();
  app.use(express.json({ limit: '32kb' }));
  app.use(qs.middleware);
  app.get('/metrics', qs.metricsHandler);

  // Buổi 43: liveness ≠ readiness
  app.get('/health/live', (req, res) => res.json({ ok: true }));
  app.get('/health/ready', async (req, res) => {
    try {
      if (dangDong) throw new Error('đang tắt');
      await pool.query('SELECT 1');
      res.json({ ok: true });
    } catch (err) {
      res.status(503).json({ ok: false, loi: err.message });
    }
  });

  dinhTuyen?.(app, { pool, ch, logger });

  app.use((err, req, res, _next) => {
    logger.error({ err }, 'lỗi không lường trước');
    res.status(500).json({ ma: 'LOI_HE_THONG', loi: 'Lỗi hệ thống' });
  });

  const consumers = [];
  for (const h of hangDoi) {
    await khaiBaoHangDoi(ch, h.ten, h.khoa);
    consumers.push(
      await tieuThu(ch, h.ten, (suKien, meta) => h.xuLy(suKien, meta, { pool, logger }), {
        logger,
        demSuKien: qs.demSuKien,
        ...h.tuyChon,
      })
    );
  }

  const dungRelay = coRelay ? chayRelay({ pool, ch, logger }) : async () => {};

  const server = await new Promise((resolve, reject) => {
    // Express 5: callback nhận `err` khi listen thất bại (vd EADDRINUSE — cổng đã có người dùng).
    // Bỏ qua tham số này = tưởng khởi động thành công trong khi server không nghe cổng nào.
    const s = app.listen(cong, (err) => (err ? reject(err) : resolve(s)));
  });
  logger.info({ cong: server.address().port }, `${ten} sẵn sàng`);

  /**
   * TẮT ĐÚNG THỨ TỰ — ngược với lúc bật:
   *   1. ngừng NHẬN việc mới (HTTP + message)
   *   2. chờ việc đang làm dở xong
   *   3. rồi mới đóng tài nguyên chúng đang dùng (RabbitMQ, DB)
   * Đóng DB trước bước 2 = message đang xử lý dở lỗi "pool đã đóng" → bị giao lại.
   */
  async function dung() {
    if (dangDong) return;
    dangDong = true;
    await Promise.all(consumers.map((c) => c.dung()));
    await new Promise((r) => server.close(r));
    await dungRelay();
    await ch.close().catch(() => {});
    await conn.close().catch(() => {});
    await pool.end();
    logger.info(`${ten} đã tắt`);
  }

  return { app, server, pool, ch, url: `http://127.0.0.1:${server.address().port}`, dung, qs };
}

/** Dùng trong main.js của từng dịch vụ: bật, và tắt êm khi nhận SIGINT/SIGTERM. */
export async function chayChinh(taoDichVu, logger) {
  let dv;
  const thoat = async (tinHieu) => {
    logger.info({ tinHieu }, 'nhận tín hiệu tắt');
    const hetGio = setTimeout(() => process.exit(1), 10_000).unref(); // đừng treo mãi
    await dv?.dung();
    clearTimeout(hetGio);
    await globalThis.__otelSdk?.shutdown(); // đẩy nốt span còn trong bộ đệm
    process.exit(0);
  };
  process.once('SIGINT', thoat);
  process.once('SIGTERM', thoat);

  try {
    dv = await taoDichVu({ khiMatKetNoi: () => process.exit(1) });
  } catch (err) {
    logger.fatal({ loi: err.message }, 'không khởi động được');
    process.exit(1);
  }
}
