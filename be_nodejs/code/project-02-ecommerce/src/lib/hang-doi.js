/**
 * Buổi 26 — Background job với BullMQ.
 *
 * VÌ SAO CẦN?
 *   Gửi email xác nhận đơn hàng mất 2 giây. Nếu làm ĐỒNG BỘ trong request:
 *     · Khách chờ thêm 2 giây mới thấy "đặt hàng thành công"
 *     · Dịch vụ email chết → ĐƠN HÀNG KHÔNG ĐẶT ĐƯỢC (dù database vẫn ổn)
 *     · Nhớ buổi 20: nếu nằm trong transaction, nó giữ kết nối DB suốt 2 giây
 *
 *   Đẩy ra hàng đợi:
 *     · Request trả về trong vài chục mili-giây
 *     · Email chết → job nằm chờ, tự thử lại sau
 *     · Đơn hàng vẫn được đặt
 */

import { Queue, Worker } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6380';

/** BullMQ cần cấu hình kết nối riêng, không dùng chung ioredis client. */
function ketNoi() {
  const u = new URL(REDIS_URL);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    // BullMQ YÊU CẦU maxRetriesPerRequest: null —
    // nếu không, worker sẽ chết khi Redis chập chờn.
    maxRetriesPerRequest: null,
  };
}

export const TEN_HANG_DOI = 'viec-nen';

let _queue = null;

export function layHangDoi() {
  if (_queue) return _queue;

  _queue = new Queue(TEN_HANG_DOI, {
    connection: ketNoi(),
    defaultJobOptions: {
      // Thử lại 3 lần với khoảng chờ TĂNG DẦN: 1s → 2s → 4s.
      // Vì sao tăng dần? Dịch vụ đang quá tải mà ta dội liên tục
      // thì chỉ làm nó chết sâu hơn.
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },

      // Dọn job đã xong để Redis không phình vô hạn
      removeOnComplete: { age: 3600, count: 1000 },
      // Giữ job LỖI lâu hơn — để còn điều tra
      removeOnFail: { age: 24 * 3600 },
    },
  });

  return _queue;
}

/**
 * Thêm việc vào hàng đợi.
 *
 * @param {string} ten - loại việc
 * @param {object} duLieu - CHỈ dữ liệu tối thiểu, xem ghi chú bên dưới
 * @param {object} [opts]
 */
export async function themViec(ten, duLieu, opts = {}) {
  return layHangDoi().add(ten, duLieu, opts);
}

/**
 * ⚠️ QUY TẮC VÀNG: JOB CHỈ CHỨA ID, KHÔNG CHỨA CẢ OBJECT.
 *
 *   ❌ themViec('gui-email', { donHang: donHangDayDu })
 *   ✅ themViec('gui-email', { donHangId: 42 })
 *
 * Ba lý do:
 *   1. Job có thể chạy vài phút sau — dữ liệu đã CŨ
 *   2. Redis lưu trong RAM, object lớn tốn bộ nhớ
 *   3. Dữ liệu nhạy cảm không nên nằm trong Redis
 */

// ═══════════════════════════════════════════════════════════════
// WORKER
// ═══════════════════════════════════════════════════════════════

/**
 * @param {object} xuLy - map { tenViec: async (duLieu, job) => {} }
 */
export function taoWorker(xuLy, { logger, soViecCungLuc = 5 } = {}) {
  const worker = new Worker(
    TEN_HANG_DOI,
    async (job) => {
      const ham = xuLy[job.name];
      if (!ham) throw new Error(`Không có bộ xử lý cho việc "${job.name}"`);
      return ham(job.data, job);
    },
    {
      connection: ketNoi(),
      // Giới hạn số việc chạy song song — nhớ buổi 07.
      // Không giới hạn thì worker kéo hết job về và làm sập database.
      concurrency: soViecCungLuc,
    }
  );

  worker.on('completed', (job) => {
    logger?.debug?.({ jobId: job.id, ten: job.name }, 'job xong');
  });

  worker.on('failed', (job, err) => {
    const conThu = (job?.attemptsMade ?? 0) < (job?.opts?.attempts ?? 1);
    logger?.[conThu ? 'warn' : 'error']?.(
      { jobId: job?.id, ten: job?.name, lanThu: job?.attemptsMade, loi: err.message },
      conThu ? 'job lỗi, sẽ thử lại' : 'job LỖI HẲN sau khi hết lượt thử'
    );
  });

  // ⚠️ Không bắt sự kiện 'error' → EventEmitter ném uncaughtException (buổi 07)
  worker.on('error', (err) => {
    logger?.error?.({ err: err.message }, 'worker lỗi');
  });

  return worker;
}
