/**
 * OBSERVER — "đơn hàng đã đặt" là một SỰ KIỆN; ai quan tâm thì tự đăng ký.
 *
 * Service đặt hàng không cần biết có bao nhiêu việc phụ (email, điểm thưởng,
 * thống kê...). Thêm việc phụ thứ năm = đăng ký thêm một listener,
 * KHÔNG sửa service.
 *
 * ⚠️ BẪY: EventEmitter của Node gọi listener ĐỒNG BỘ và KHÔNG await.
 *   · Listener async ném lỗi → unhandledRejection → tiến trình chết (buổi 07)
 *   · Listener đồng bộ ném lỗi → lỗi bay ngược vào emit() → ĐƠN HÀNG THẤT BẠI
 *     chỉ vì gửi email lỗi.
 *
 * Nên ta tự viết một bus nhỏ: chạy mọi listener, BẮT lỗi từng cái,
 * và một listener hỏng không kéo theo những cái khác.
 */

export class BusSuKien {
  #nghe = new Map();

  constructor({ logger = console } = {}) {
    this.logger = logger;
  }

  dangKy(tenSuKien, xuLy) {
    const ds = this.#nghe.get(tenSuKien) ?? [];
    ds.push(xuLy);
    this.#nghe.set(tenSuKien, ds);
  }

  /** Trả về số listener bị lỗi — để test kiểm chứng được. */
  async phat(tenSuKien, duLieu) {
    const ds = this.#nghe.get(tenSuKien) ?? [];
    const kq = await Promise.allSettled(ds.map(async (xuLy) => xuLy(duLieu)));
    const loi = kq.filter((k) => k.status === 'rejected');
    for (const l of loi) {
      this.logger.error?.(`  ✗ listener "${tenSuKien}" lỗi: ${l.reason.message}`);
    }
    return loi.length;
  }
}

/**
 * ⚠️ Giới hạn của bus trong bộ nhớ: tiến trình chết giữa chừng là MẤT sự kiện.
 * Email chưa gửi thì không bao giờ được gửi nữa.
 *
 * Đó là lý do buổi 52–53 đưa sự kiện ra message broker (RabbitMQ)
 * và dùng Outbox pattern. Ý tưởng Observer giữ nguyên, chỉ đổi nơi chứa.
 */
