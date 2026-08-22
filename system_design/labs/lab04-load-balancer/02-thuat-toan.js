/**
 * LAB 04.2 — Các thuật toán cân bằng tải
 *
 * Mỗi thuật toán là một hàm: (danhSachBackendKhoe, khoaDinhTuyen) -> backend
 */

import crypto from 'node:crypto';

/** 1. Round Robin — lần lượt. Đơn giản nhất, công bằng về SỐ LƯỢNG chứ không về TẢI. */
export function roundRobin() {
  let i = 0;
  return (ds) => ds[i++ % ds.length];
}

/** 2. Random — ngẫu nhiên đều. Bất ngờ là khá tốt khi số backend lớn. */
export function random() {
  return (ds) => ds[Math.floor(Math.random() * ds.length)];
}

/**
 * 3. Least Connections — gửi tới server đang xử lý ít request nhất.
 * Tốt khi các request có thời lượng chênh lệch lớn: server chậm tự nhiên nhận ít hơn.
 */
export function leastConnections() {
  return (ds) => ds.reduce((a, b) => (b.dangXuLy < a.dangXuLy ? b : a));
}

/**
 * 4. Power of Two Choices — chọn ngẫu nhiên 2, lấy cái ít tải hơn.
 * Gần bằng least-connections nhưng KHÔNG cần quét toàn bộ danh sách
 * → dùng được khi có hàng nghìn backend, hoặc khi có nhiều LB không chia sẻ state.
 */
export function powerOfTwo() {
  return (ds) => {
    if (ds.length === 1) return ds[0];
    const a = ds[Math.floor(Math.random() * ds.length)];
    let b = ds[Math.floor(Math.random() * ds.length)];
    while (b === a && ds.length > 1) b = ds[Math.floor(Math.random() * ds.length)];
    return a.dangXuLy <= b.dangXuLy ? a : b;
  };
}

/**
 * 5. Consistent Hashing (sticky) — cùng khoá luôn về cùng backend.
 * Dùng khi cần cache locality hoặc session dính. Buổi 07 sẽ đào sâu vòng hash.
 */
export function stickyHash() {
  return (ds, khoa = '') => {
    const h = crypto.createHash('md5').update(String(khoa)).digest().readUInt32BE(0);
    return ds[h % ds.length];
  };
}

/** 6. Least Response Time — dựa vào latency trung bình trượt gần đây. */
export function leastResponseTime() {
  return (ds) => ds.reduce((a, b) => (b.emaLatency < a.emaLatency ? b : a));
}

export const THUAT_TOAN = {
  'round-robin': roundRobin,
  random: random,
  'least-conn': leastConnections,
  'power-of-2': powerOfTwo,
  'least-rt': leastResponseTime,
  sticky: stickyHash,
};

/**
 * Load Balancer.
 *
 * @param backends   danh sách Backend
 * @param chon       hàm chọn backend
 * @param healthCheck bật/tắt để thấy hậu quả khi KHÔNG có health check
 */
export class LoadBalancer {
  constructor({ backends, chon, healthCheck = true, chuKyCheckMs = 200 }) {
    this.backends = backends;
    this.chon = chon;
    this.batHealthCheck = healthCheck;
    this.khoe = new Set(backends);

    if (healthCheck) {
      this.timer = setInterval(async () => {
        for (const b of backends) {
          const ok = await b.healthCheck();
          if (ok) this.khoe.add(b);
          else this.khoe.delete(b); // ← đưa backend ốm ra khỏi vòng quay
        }
      }, chuKyCheckMs);
      this.timer.unref?.();
    }
  }

  danhSachKhaDung() {
    if (!this.batHealthCheck) return this.backends;
    // Nếu TẤT CẢ đều bị đánh là ốm, thà gửi vào một cái còn hơn từ chối 100%.
    // (Kỹ thuật này gọi là "fail open" / panic mode — Envoy có tham số y hệt.)
    return this.khoe.size ? [...this.khoe] : this.backends;
  }

  async guiRequest(khoaDinhTuyen) {
    const ds = this.danhSachKhaDung();
    const b = this.chon(ds, khoaDinhTuyen);
    const t0 = performance.now();
    try {
      await b.xuLy();
      return { ok: true, latency: performance.now() - t0, backend: b.ten };
    } catch {
      return { ok: false, latency: performance.now() - t0, backend: b.ten };
    }
  }

  dung() {
    clearInterval(this.timer);
  }
}
