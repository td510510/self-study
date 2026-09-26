/**
 * Buổi 53 — TRANSACTIONAL OUTBOX.
 *
 * BÀI TOÁN "GHI KÉP" (dual write):
 *
 *   await db.query('INSERT INTO don_hang ...');
 *   await mq.publish('don-hang.da-tao', ...);   ← chết ở đây?
 *
 *   · DB ghi xong, publish thất bại (RabbitMQ chập chờn, tiến trình bị kill)
 *     → đơn hàng tồn tại nhưng KHO KHÔNG BAO GIỜ BIẾT. Đơn treo vĩnh viễn.
 *   · Đảo thứ tự (publish trước, ghi DB sau) → kho giữ hàng cho đơn KHÔNG TỒN TẠI.
 *
 * Không có thứ tự nào đúng, vì DB và RabbitMQ là HAI hệ thống, không có
 * transaction chung.
 *
 * LỜI GIẢI: ghi sự kiện vào bảng `outbox` TRONG CÙNG TRANSACTION với dữ liệu.
 *   → Hoặc cả hai cùng có, hoặc cả hai cùng không. Postgres đảm bảo.
 * Một vòng lặp riêng (relay) đọc outbox và publish. Publish lỗi → lần sau thử lại.
 *
 * Cái giá: relay có thể publish RỒI chết trước khi đánh dấu "đã gửi" → gửi TRÙNG.
 * Outbox cho "ít nhất một lần" (at-least-once), không phải "đúng một lần".
 * → Bên nhận PHẢI khử trùng (xem xuLyMotLan trong db.js).
 */

import { context, propagation, trace } from '@opentelemetry/api';
import { phatHanh } from './mq.js';

export const SQL_OUTBOX = `
  CREATE TABLE IF NOT EXISTS outbox (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    loai        text        NOT NULL,
    du_lieu     jsonb       NOT NULL,
    ngu_canh    jsonb,                     -- ngữ cảnh trace (W3C traceparent)
    tao_luc     timestamptz NOT NULL DEFAULT now(),
    da_gui_luc  timestamptz
  );
  -- Index một phần: chỉ chứa dòng CHƯA gửi → luôn nhỏ dù bảng lớn dần
  CREATE INDEX IF NOT EXISTS outbox_chua_gui ON outbox (tao_luc) WHERE da_gui_luc IS NULL;
`;

/**
 * Ghi một sự kiện vào outbox. PHẢI gọi với `client` đang ở trong transaction.
 *
 * Lưu kèm ngữ cảnh trace: relay chạy ở một vòng lặp KHÁC, không còn biết
 * request HTTP nào đã sinh ra sự kiện này. Không lưu → trace đứt làm đôi
 * ở đúng chỗ khó gỡ lỗi nhất.
 */
export async function ghiOutbox(client, loai, duLieu) {
  const nguCanh = {};
  propagation.inject(context.active(), nguCanh);
  await client.query('INSERT INTO outbox (loai, du_lieu, ngu_canh) VALUES ($1, $2, $3)', [loai, duLieu, nguCanh]);
}

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));
const tracer = trace.getTracer('outbox-relay');

/** Chạy vòng lặp relay. Trả về hàm dừng (chờ vòng hiện tại xong — graceful shutdown). */
export function chayRelay({ pool, ch, logger, chuKyMs = 200 }) {
  let dangDung = false;

  async function motVong() {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // FOR UPDATE SKIP LOCKED: chạy NHIỀU bản sao dịch vụ thì mỗi relay lấy
      // một lô KHÁC NHAU, không đứng chờ khoá của nhau, không gửi trùng lô.
      const { rows } = await client.query(`
        SELECT id, loai, du_lieu, ngu_canh FROM outbox
        WHERE da_gui_luc IS NULL
        ORDER BY tao_luc
        LIMIT 100
        FOR UPDATE SKIP LOCKED`);

      for (const r of rows) {
        const cha = propagation.extract(context.active(), r.ngu_canh ?? {});
        await tracer.startActiveSpan(`publish ${r.loai}`, {}, cha, async (span) => {
          try {
            // "Phong bì" chuẩn cho mọi sự kiện: bên nhận biết loại gì, id gì,
            // mà không phải đoán từ routing key.
            await phatHanh(ch, r.loai, { id: r.id, loai: r.loai, duLieu: r.du_lieu }, { messageId: r.id });
          } finally {
            span.end();
          }
        });
      }

      if (rows.length) {
        await client.query('UPDATE outbox SET da_gui_luc = now() WHERE id = ANY($1)', [rows.map((r) => r.id)]);
      }
      await client.query('COMMIT');
      return rows.length;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  }

  const vongLap = (async () => {
    while (!dangDung) {
      try {
        const n = await motVong();
        if (n === 0) await ngu(chuKyMs); // có việc thì làm tiếp ngay, hết việc mới nghỉ
      } catch (err) {
        logger?.error({ loi: err.message }, 'relay outbox lỗi, thử lại sau 1s');
        await ngu(1000);
      }
    }
  })();

  return async function dung() {
    dangDung = true;
    await vongLap;
  };
}
