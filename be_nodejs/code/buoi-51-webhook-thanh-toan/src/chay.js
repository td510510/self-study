/**
 * Chạy cổng thanh toán giả lập (4100) và shop (3100).
 *
 *   npm start
 *   curl -X POST localhost:3100/don-hang -H 'content-type: application/json' -d '{"soTien":250000}'
 *   → mở urlThanhToan trong trình duyệt, bấm "Trả tiền"
 */

import { taoCongThanhToan } from './cong-thanh-toan/app.js';
import { taoShop } from './shop/app.js';

const env = process.env;
for (const k of ['API_KEY', 'WEBHOOK_SECRET']) {
  if (!env[k]) throw new Error(`Thiếu biến môi trường ${k} (xem .env.example)`);
}
const congCong = Number(env.CONG_CONG_THANH_TOAN ?? 4100);
const congShop = Number(env.CONG_SHOP ?? 3100);
const shopUrl = `http://localhost:${congShop}`;

const cong = taoCongThanhToan({
  apiKey: env.API_KEY,
  webhookSecret: env.WEBHOOK_SECRET,
  webhookUrl: `${shopUrl}/webhook/thanh-toan`,
  lichThuLai: [0, 2000, 10_000, 60_000],
});
cong.listen(congCong, () => console.log(`Cổng thanh toán: http://localhost:${congCong}`));

const shop = taoShop({ congUrl: `http://localhost:${congCong}`, apiKey: env.API_KEY, webhookSecret: env.WEBHOOK_SECRET, shopUrl });
shop.listen(congShop, () => console.log(`Shop:            ${shopUrl}`));

// Đối soát mỗi 30 giây — production dùng job lặp của BullMQ (buổi 26)
setInterval(async () => {
  const n = await shop.locals.doiSoat().catch((e) => (console.error('Đối soát lỗi:', e.message), 0));
  if (n) console.log(`🔎 Đối soát sửa ${n} đơn`);
}, 30_000).unref();
