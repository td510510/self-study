/**
 * Buổi 49 — chạy cùng kịch bản với truoc-refactor.js, nhưng qua kiến trúc mới.
 *
 *   npm run demo
 */

import { taoUngDung } from './container.js';

async function chay(tieuDe, cauHinh, yeuCau) {
  console.log(`\n── ${tieuDe}`);
  let app;
  try {
    app = taoUngDung(cauHinh);
    const don = await app.service.datHang(yeuCau);
    console.log(`  ✅ ${don.cong} · ${don.soTien}đ · mã GD ${don.maGiaoDich}`);
  } catch (err) {
    console.log(`  ❌ ${err.name}: ${err.message}`);
  }
  if (!app) return;
  for (const s of app.soDo) console.log(`  ⏱  ${s.cong} ${s.ketQua} sau ${s.ms.toFixed(0)} ms`);
  const sp = await app.kho.tim(yeuCau.sanPhamId);
  console.log(`  📦 tồn kho "${sp.ten}" còn ${sp.ton}`);
}

await chay('Ví điện tử', { cachThanhToan: 'vi-dien-tu' }, { sanPhamId: 'ao-thun', soLuong: 2, email: 'an@vd.vn' });

await chay('Thẻ quốc tế', { cachThanhToan: 'the-quoc-te' }, { sanPhamId: 'ao-thun', soLuong: 1, email: 'binh@vd.vn' });

await chay(
  'Ví lỗi mạng 2 lần đầu → decorator thử lại',
  { cachThanhToan: 'vi-dien-tu', viLoiLanDau: 2 },
  { sanPhamId: 'ao-thun', soLuong: 1, email: 'chi@vd.vn' }
);

await chay(
  'Ví lỗi mạng 5 lần → hết lượt thử, hàng được trả lại kho',
  { cachThanhToan: 'vi-dien-tu', viLoiLanDau: 5 },
  { sanPhamId: 'ao-thun', soLuong: 1, email: 'dung@vd.vn' }
);

await chay('Hết hàng', { cachThanhToan: 'vi-dien-tu' }, { sanPhamId: 'mu', soLuong: 1, email: 'em@vd.vn' });

await chay('Cổng không tồn tại', { cachThanhToan: 'tien-mat' }, { sanPhamId: 'ao-thun', soLuong: 1, email: 'g@vd.vn' });
