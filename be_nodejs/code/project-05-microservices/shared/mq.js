/**
 * Buổi 52 — RabbitMQ: phát hành, tiêu thụ, thử lại, dead letter.
 *
 * Mô hình dùng trong project:
 *
 *   Dịch vụ A ──publish(routingKey)──▶ [exchange "su-kien" (topic)]
 *                                          │  binding theo routing key
 *                         ┌────────────────┼────────────────┐
 *                         ▼                ▼                ▼
 *                  hàng đợi của B    hàng đợi của C     (không ai nghe → message bị bỏ)
 *
 * NGƯỜI GỬI KHÔNG BIẾT AI NHẬN. Thêm dịch vụ D nghe "don-hang.*" =
 * tạo hàng đợi + binding, KHÔNG sửa dịch vụ A. (Observer của buổi 49,
 * nhưng qua mạng và sống sót khi tiến trình chết.)
 *
 * Mỗi hàng đợi chính đi kèm hai hàng đợi phụ:
 *
 *   q ──lỗi tạm thời──▶ q.thu-lai (message có TTL) ──hết TTL──▶ q   (thử lại có độ trễ)
 *   q ──lỗi vĩnh viễn / hết lượt──▶ q.dlq                            (người điều tra)
 */

import amqp from 'amqplib';

export const EXCHANGE = 'su-kien';

export class LoiVinhVien extends Error {
  /** Lỗi mà thử lại bao nhiêu lần cũng vậy (dữ liệu sai) → vào thẳng DLQ. */
  constructor(message) {
    super(message);
    this.name = 'LoiVinhVien';
    this.vinhVien = true;
  }
}

export async function ketNoiMq(url) {
  const conn = await amqp.connect(url);
  // ConfirmChannel: broker XÁC NHẬN đã nhận từng message.
  // Channel thường thì publish() là "gửi rồi mong" — broker chết giữa chừng là mất.
  const ch = await conn.createConfirmChannel();
  await ch.assertExchange(EXCHANGE, 'topic', { durable: true });
  return { conn, ch };
}

/** Khai báo hàng đợi chính + thử lại + DLQ, và gắn vào exchange theo các routing key. */
export async function khaiBaoHangDoi(ch, ten, khoaList) {
  // durable: hàng đợi sống qua lần RabbitMQ khởi động lại.
  // (Message cũng phải persistent — xem phatHanh — thì mới không mất.)
  await ch.assertQueue(ten, { durable: true });
  for (const khoa of khoaList) await ch.bindQueue(ten, EXCHANGE, khoa);

  await ch.assertQueue(`${ten}.thu-lai`, {
    durable: true,
    arguments: {
      // Hết TTL → message "chết" → đi tới dead-letter exchange.
      // '' là default exchange: routing key = tên hàng đợi → quay về đúng hàng đợi chính.
      'x-dead-letter-exchange': '',
      'x-dead-letter-routing-key': ten,
    },
  });
  await ch.assertQueue(`${ten}.dlq`, { durable: true });
}

const guiCho = (ch, fn) =>
  new Promise((resolve, reject) => fn((err) => (err ? reject(err) : resolve())));

/** Phát hành lên exchange và CHỜ broker xác nhận. */
export function phatHanh(ch, khoa, noiDung, { messageId, headers } = {}) {
  return guiCho(ch, (cb) =>
    ch.publish(EXCHANGE, khoa, Buffer.from(JSON.stringify(noiDung)), {
      persistent: true, // ghi xuống đĩa — sống qua lần broker khởi động lại
      contentType: 'application/json',
      messageId,
      headers,
    }, cb)
  );
}

/**
 * Tiêu thụ một hàng đợi.
 *
 * @param {(suKien: object, meta: { messageId: string, lan: number }) => Promise<void>} xuLy
 */
export async function tieuThu(ch, ten, xuLy, { logger, soLanToiDa = 4, choCoSoMs = 500, demSuKien, prefetch = 10 } = {}) {
  // prefetch: tối đa N message CHƯA ACK cùng lúc cho consumer này.
  // Không đặt → broker đẩy HẾT hàng đợi vào RAM của tiến trình (buổi 07, 20, 26: cùng bài học).
  await ch.prefetch(prefetch);

  // Theo dõi message ĐANG xử lý dở — để lúc tắt máy chờ chúng xong
  // rồi mới đóng kết nối DB (buổi 08: graceful shutdown).
  const dangXuLy = new Set();

  const { consumerTag } = await ch.consume(ten, (msg) => {
    if (!msg) return; // broker huỷ consumer (hàng đợi bị xoá...)
    const p = xuLyMessage(msg).finally(() => dangXuLy.delete(p));
    dangXuLy.add(p);
  });

  async function xuLyMessage(msg) {
    const { messageId, headers = {} } = msg.properties;
    const lan = Number(headers['x-so-lan-thu'] ?? 0);

    try {
      try {
        // Lỗi parse JSON cũng là lỗi vĩnh viễn: thử lại vẫn là rác đó
        let suKien;
        try {
          suKien = JSON.parse(msg.content.toString());
        } catch {
          throw new LoiVinhVien('Message không phải JSON hợp lệ');
        }
        await xuLy(suKien, { messageId, lan });
        demSuKien?.inc({ hang_doi: ten, ket_qua: 'thanh_cong' });
      } catch (err) {
        const opts = {
          persistent: true,
          contentType: 'application/json',
          messageId,
          headers: { ...headers, 'x-so-lan-thu': lan + 1, 'x-loi-cuoi': err.message },
        };
        if (err.vinhVien || lan + 1 >= soLanToiDa) {
          await guiCho(ch, (cb) => ch.sendToQueue(`${ten}.dlq`, msg.content, opts, cb));
          demSuKien?.inc({ hang_doi: ten, ket_qua: 'dlq' });
          logger?.error({ hangDoi: ten, messageId, lan: lan + 1, loi: err.message }, 'message vào DLQ');
        } else {
          // Backoff tăng dần — lần 1 chờ 0.5s, lần 2 chờ 1s, lần 3 chờ 2s...
          const cho = choCoSoMs * 2 ** lan;
          await guiCho(ch, (cb) => ch.sendToQueue(`${ten}.thu-lai`, msg.content, { ...opts, expiration: String(cho) }, cb));
          demSuKien?.inc({ hang_doi: ten, ket_qua: 'thu_lai' });
          logger?.warn({ hangDoi: ten, messageId, lan: lan + 1, choMs: cho, loi: err.message }, 'lỗi tạm thời, sẽ thử lại');
        }
      }
      // ACK SAU CÙNG — chỉ khi message đã được xử lý XONG hoặc đã chuyển đi an toàn.
      // Tiến trình chết trước dòng này → broker giao lại message cho consumer khác.
      ch.ack(msg);
    } catch (err) {
      // Không chuyển được sang thu-lai/dlq (mất kết nối): KHÔNG ack.
      // Broker sẽ giao lại khi kết nối mới được mở. At-least-once.
      logger?.error({ hangDoi: ten, messageId, loi: err.message }, 'không xử lý được message, để broker giao lại');
    }
  }

  return {
    consumerTag,
    /** Ngừng nhận message mới, chờ các message đang xử lý dở hoàn tất. */
    async dung() {
      await ch.cancel(consumerTag).catch(() => {});
      await Promise.allSettled([...dangXuLy]);
    },
  };
}
