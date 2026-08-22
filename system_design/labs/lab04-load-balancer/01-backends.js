/**
 * LAB 04.1 — Các backend giả lập
 *
 * Mỗi backend có:
 *   - baseMs: tốc độ xử lý cơ bản (server mạnh/yếu khác nhau)
 *   - capacity: xử lý được bao nhiêu request song song trước khi bắt đầu xếp hàng
 *   - khoe: có đang khoẻ không (health check sẽ phát hiện)
 *
 * Điểm quan trọng: latency TĂNG theo số request đang xử lý — đúng như buổi 03 đã đo.
 */

export class Backend {
  constructor({ ten, baseMs, capacity = 4 }) {
    this.ten = ten;
    this.baseMs = baseMs;
    this.capacity = capacity;

    this.dangXuLy = 0; // số request đang chạy (least-connections dùng cái này)
    this.tongNhan = 0;
    this.tongLoi = 0;
    this.khoe = true;
    this.emaLatency = baseMs; // trung bình trượt, cho thuật toán least-response-time
  }

  /** Mô phỏng xử lý 1 request. Trả về latency (ms) hoặc ném lỗi nếu backend đang ốm. */
  async xuLy() {
    this.tongNhan++;
    if (!this.khoe) {
      this.tongLoi++;
      // Backend ốm vẫn "ngốn" thời gian trước khi lỗi — đây là điều khiến nó nguy hiểm:
      // nó không chỉ trả lỗi, nó còn giữ tài nguyên của client.
      await ngu(this.baseMs * 2);
      throw new Error(`${this.ten} đang ốm`);
    }

    this.dangXuLy++;
    // Quá capacity → phần vượt phải xếp hàng → latency tăng tuyến tính (định luật Little)
    const heSoTaiTrong = Math.max(1, this.dangXuLy / this.capacity);
    const latency = this.baseMs * heSoTaiTrong * (0.8 + Math.random() * 0.4);

    await ngu(latency);
    this.dangXuLy--;
    this.emaLatency = this.emaLatency * 0.9 + latency * 0.1;
    return latency;
  }

  /** LB gọi định kỳ. Trong thực tế đây là `GET /health/ready`. */
  async healthCheck() {
    return this.khoe;
  }

  thongKe() {
    return { ten: this.ten, nhan: this.tongNhan, loi: this.tongLoi, khoe: this.khoe };
  }
}

export const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

/** Cụm 4 backend: 3 bình thường + 1 chậm gấp 5 lần (rất hay gặp trong thực tế). */
export function taoCum() {
  return [
    new Backend({ ten: 'srv-A', baseMs: 20, capacity: 4 }),
    new Backend({ ten: 'srv-B', baseMs: 20, capacity: 4 }),
    new Backend({ ten: 'srv-C', baseMs: 20, capacity: 4 }),
    new Backend({ ten: 'srv-D', baseMs: 100, capacity: 4 }), // ← con "rùa": ổ cứng lỗi, GC, hàng xóm ồn
  ];
}
