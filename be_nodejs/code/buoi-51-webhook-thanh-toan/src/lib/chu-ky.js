/**
 * Ký & xác minh webhook bằng HMAC-SHA256.
 *
 * Định dạng header (giống Stripe):   X-Chu-Ky: t=1790000000,v1=<hex>
 *   v1 = HMAC_SHA256(secret, `${t}.${rawBody}`)
 *
 * VÌ SAO PHẢI KÝ?
 *   URL webhook của ta là CÔNG KHAI. Ai cũng POST được:
 *     curl -X POST https://shop.vn/webhook/thanh-toan \
 *          -d '{"loai":"thanh-toan.thanh-cong","duLieu":{"donHangId":42}}'
 *   Không kiểm chữ ký = ai cũng tự "thanh toán" đơn hàng của mình miễn phí.
 *
 * VÌ SAO KÝ CẢ TIMESTAMP?
 *   Kẻ tấn công bắt được MỘT webhook hợp lệ (log lộ, proxy...) có thể
 *   gửi lại nó mãi mãi. Timestamp nằm TRONG phần được ký → không sửa được;
 *   ta từ chối chữ ký cũ hơn vài phút.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export function kyWebhook(secret, rawBody, t = Math.floor(Date.now() / 1000)) {
  const v1 = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  return `t=${t},v1=${v1}`;
}

/**
 * @param {object} p
 * @param {string} p.secret
 * @param {string|undefined} p.header - giá trị X-Chu-Ky
 * @param {Buffer|string} p.rawBody - BODY GỐC, chưa qua JSON.parse
 * @param {number} [p.dungSaiGiay=300]
 * @returns {{ hopLe: true } | { hopLe: false, lyDo: string }}
 */
export function xacMinhChuKy({ secret, header, rawBody, dungSaiGiay = 300, bayGio = Date.now() }) {
  if (!header) return { hopLe: false, lyDo: 'thiếu header chữ ký' };
  if (!Buffer.isBuffer(rawBody) && typeof rawBody !== 'string') {
    // Gặp khi express.json() đã chạy trước → req.body là OBJECT, mất body gốc.
    return { hopLe: false, lyDo: 'body không phải dữ liệu thô — express.json() đã parse mất rồi?' };
  }

  const phan = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const t = Number(phan.t);
  if (!Number.isInteger(t) || !phan.v1) return { hopLe: false, lyDo: 'header sai định dạng' };

  if (Math.abs(bayGio / 1000 - t) > dungSaiGiay) return { hopLe: false, lyDo: 'chữ ký quá cũ (phát lại?)' };

  const mongDoi = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest();
  const nhanDuoc = Buffer.from(phan.v1, 'hex');

  // timingSafeEqual thay vì ===:
  // === dừng ở byte SAI ĐẦU TIÊN → đo thời gian phản hồi đoán được dần từng byte.
  // timingSafeEqual luôn so HẾT, thời gian không phụ thuộc chỗ sai.
  // (Nó ném lỗi nếu hai buffer khác độ dài → kiểm độ dài trước.)
  if (nhanDuoc.length !== mongDoi.length || !timingSafeEqual(nhanDuoc, mongDoi)) {
    return { hopLe: false, lyDo: 'chữ ký không khớp' };
  }
  return { hopLe: true };
}
