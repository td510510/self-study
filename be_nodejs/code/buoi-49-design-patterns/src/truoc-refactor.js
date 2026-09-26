/**
 * Buổi 49 — TRƯỚC khi refactor: một hàm "biết tuốt".
 *
 * Code này CHẠY ĐƯỢC và có thật ở rất nhiều dự án. Vấn đề không nằm ở chỗ
 * nó sai, mà ở chỗ nó KHÔNG CHỊU ĐƯỢC THAY ĐỔI:
 *
 *   · Thêm cổng thanh toán thứ ba  → sửa hàm này (và có thể làm hỏng hai cổng cũ)
 *   · Thêm việc "cộng điểm thưởng" → sửa hàm này
 *   · Muốn test logic đặt hàng     → phải gọi cổng thanh toán THẬT
 *
 * Đếm xem hàm này có bao nhiêu LÝ DO ĐỂ BỊ SỬA. Đó là số trách nhiệm của nó.
 */

const kho = new Map([
  ['ao-thun', { ten: 'Áo thun', gia: 150_000, ton: 5 }],
  ['mu', { ten: 'Mũ', gia: 90_000, ton: 0 }],
]);

async function datHang({ sanPhamId, soLuong, cachThanhToan, email }) {
  // Trách nhiệm 1: kiểm tra tồn kho
  const sp = kho.get(sanPhamId);
  if (!sp) throw new Error('Không có sản phẩm');
  if (sp.ton < soLuong) throw new Error('Hết hàng');

  const soTien = sp.gia * soLuong;

  // Trách nhiệm 2: biết chi tiết TỪNG cổng thanh toán
  let maGiaoDich;
  if (cachThanhToan === 'vi-dien-tu') {
    // Cổng ví: tính bằng đồng, trả về { transId }
    maGiaoDich = `VI-${Date.now()}`;
    console.log(`  [ví] trừ ${soTien}đ`);
  } else if (cachThanhToan === 'the-quoc-te') {
    // Cổng thẻ: tính bằng CENT USD, trả về { id, status }
    const cent = Math.round((soTien / 25_000) * 100);
    maGiaoDich = `CARD-${Date.now()}`;
    console.log(`  [thẻ] charge ${cent} cent`);
  } else {
    throw new Error('Không hỗ trợ cách thanh toán này');
  }
  // ...cổng thứ ba sẽ là một nhánh else-if nữa, dài thêm 20 dòng

  sp.ton -= soLuong;

  // Trách nhiệm 3: gửi email
  console.log(`  [email] gửi tới ${email}: đơn ${maGiaoDich}`);

  // Trách nhiệm 4: ghi log thống kê
  console.log(`  [thống kê] +${soTien}đ doanh thu`);

  return { maGiaoDich, soTien };
}

console.log('Đặt hàng bằng ví:');
console.log(await datHang({ sanPhamId: 'ao-thun', soLuong: 2, cachThanhToan: 'vi-dien-tu', email: 'an@vd.vn' }));

console.log('\nĐặt hàng bằng thẻ:');
console.log(await datHang({ sanPhamId: 'ao-thun', soLuong: 1, cachThanhToan: 'the-quoc-te', email: 'binh@vd.vn' }));

console.log('\n→ Bốn trách nhiệm, bốn lý do để sửa, và không test được nếu không chạy thật cả bốn.');
