/**
 * LAB 08.1 — Message Queue mini (mô hình SQS)
 *
 * Cài đầy đủ các cơ chế thật:
 *   - visibility timeout: message đang xử lý bị "ẩn" đi, hết giờ mà chưa ACK thì hiện lại
 *   - retry với exponential backoff
 *   - dead letter queue sau N lần lỗi
 *   - at-least-once delivery (KHÔNG phải exactly-once — và đó là cố ý)
 */

export const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

let seq = 0;

export class MessageQueue {
  constructor({ visibilityTimeoutMs = 300, maxRetry = 3, tenDLQ = null } = {}) {
    this.visibilityTimeoutMs = visibilityTimeoutMs;
    this.maxRetry = maxRetry;
    this.dlq = tenDLQ ? new MessageQueue({ tenDLQ: null }) : null;

    this.sanSang = [];  // message có thể nhận
    this.dangAn = new Map(); // id -> { msg, hetHanLuc } — đang được worker xử lý

    this.thongKe = { daPublish: 0, daGiao: 0, daAck: 0, vaoDLQ: 0, giaoLai: 0 };
  }

  publish(body) {
    const msg = {
      id: `msg-${++seq}`,
      body,
      soLanNhan: 0,
      publishedAt: Date.now(),
    };
    this.sanSang.push(msg);
    this.thongKe.daPublish++;
    return msg.id;
  }

  /** Đưa các message hết hạn visibility timeout trở lại hàng đợi. */
  #hoiPhucHetHan() {
    const now = Date.now();
    for (const [id, e] of this.dangAn) {
      if (e.hetHanLuc <= now) {
        this.dangAn.delete(id);
        this.sanSang.unshift(e.msg); // ưu tiên xử lý lại trước
        this.thongKe.giaoLai++;
      }
    }
  }

  /**
   * Nhận tối đa `soLuong` message. Message được nhận sẽ bị ẩn khỏi các worker khác
   * trong visibilityTimeoutMs. Nếu worker không ACK kịp → message HIỆN LẠI.
   * → Đây chính là cơ chế sinh ra "trùng lặp" trong at-least-once.
   */
  receive(soLuong = 1) {
    this.#hoiPhucHetHan();
    const lay = [];
    const now = Date.now();
    while (lay.length < soLuong && this.sanSang.length) {
      const msg = this.sanSang.shift();
      // Backoff: message vừa lỗi phải chờ trước khi được nhận lại
      if (msg.sanSangLuc && msg.sanSangLuc > now) {
        this.sanSang.push(msg); // đẩy xuống cuối, thử message khác
        if (this.sanSang.every((m) => m.sanSangLuc > now)) break;
        continue;
      }
      msg.soLanNhan++;
      this.dangAn.set(msg.id, { msg, hetHanLuc: now + this.visibilityTimeoutMs });
      lay.push(msg);
      this.thongKe.daGiao++;
    }
    return lay;
  }

  /** Xử lý xong → xoá vĩnh viễn. */
  ack(id) {
    this.dangAn.delete(id);
    this.thongKe.daAck++;
  }

  /** Xử lý lỗi → trả lại queue với backoff, hoặc đẩy vào DLQ nếu quá số lần. */
  nack(id) {
    const e = this.dangAn.get(id);
    if (!e) return;
    this.dangAn.delete(id);

    if (e.msg.soLanNhan >= this.maxRetry) {
      this.dlq?.publish(e.msg.body);
      this.thongKe.vaoDLQ++;
      return;
    }
    // Exponential backoff: 50ms, 100ms, 200ms...
    e.msg.sanSangLuc = Date.now() + 50 * 2 ** (e.msg.soLanNhan - 1);
    this.sanSang.push(e.msg);
  }

  get conLai() {
    return this.sanSang.length + this.dangAn.size;
  }
}

/**
 * Worker: vòng lặp nhận → xử lý → ack/nack.
 * @param xuLy hàm async(msg). Ném lỗi = nack.
 */
export async function chayWorker(queue, xuLy, { ten = 'w', dungKhi } = {}) {
  while (!dungKhi()) {
    const msgs = queue.receive(1);
    if (!msgs.length) {
      await ngu(5);
      continue;
    }
    for (const m of msgs) {
      try {
        await xuLy(m);
        queue.ack(m.id);
      } catch {
        queue.nack(m.id);
      }
    }
  }
}
