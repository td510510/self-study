/**
 * LAB 09.1 — Retry: backoff và jitter
 */

export const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

/** Các chiến lược tính thời gian chờ trước lần thử thứ `lan` (lan bắt đầu từ 0). */
export const CHIEN_LUOC_CHO = {
  /** Thử lại NGAY — cách nhanh nhất để giết một service đang ngộp. */
  'ngay lập tức': () => 0,

  /** Chờ cố định. Vẫn khiến mọi client đồng loạt gõ cửa cùng lúc. */
  'cố định 100ms': () => 100,

  /** Backoff mũ: giãn dần ra. Nhưng mọi client vẫn giãn theo CÙNG một nhịp. */
  'backoff mũ': (lan, base = 50) => base * 2 ** lan,

  /** Full jitter (khuyến nghị của AWS): rải đều trong khoảng [0, backoff]. */
  'backoff + full jitter': (lan, base = 50) => Math.random() * base * 2 ** lan,

  /** Decorrelated jitter: dựa trên lần chờ TRƯỚC, rải rộng hơn nữa. */
  'decorrelated jitter': (lan, base = 50, truoc = base) =>
    Math.min(20_000, base + Math.random() * (truoc * 3 - base)),
};

/**
 * Gọi `fn` với retry.
 * @param nenRetry hàm quyết định lỗi này CÓ ĐƯỢC PHÉP retry không — cực kỳ quan trọng.
 */
export async function goiCoRetry(fn, {
  soLanToiDa = 4,
  tinhCho = CHIEN_LUOC_CHO['backoff + full jitter'],
  nenRetry = () => true,
  onRetry = () => {},
} = {}) {
  let choTruoc = 50;
  let loiCuoi;
  for (let lan = 0; lan < soLanToiDa; lan++) {
    try {
      return await fn(lan);
    } catch (e) {
      loiCuoi = e;
      // Không phải lỗi nào cũng nên thử lại: 400/404/403 thử lại cũng lỗi y hệt,
      // chỉ tổ đốt tài nguyên của cả hai bên.
      if (!nenRetry(e) || lan === soLanToiDa - 1) throw e;
      const cho = tinhCho(lan, 50, choTruoc);
      choTruoc = cho;
      onRetry(lan + 1, cho);
      await ngu(cho);
    }
  }
  throw loiCuoi;
}

/** Quy tắc mặc định: chỉ thử lại lỗi tạm thời. */
export function nenRetryMacDinh(e) {
  const code = e?.status ?? 0;
  if (code === 429 || code === 503 || code === 502 || code === 504) return true;
  if (code >= 400 && code < 500) return false; // lỗi của client — thử lại vô ích
  return true; // lỗi mạng / 500
}
