/**
 * Buổi 07 — Bước 1: tuần tự vs song song.
 *
 * Cùng một công việc, cùng số lượng, chênh nhau nhiều lần thời gian.
 * Đây là tối ưu dễ nhất và bị bỏ lỡ nhiều nhất ở backend.
 *
 * Chạy:  node 01-tuan-tu-vs-song-song.js
 */

/** Giả lập một lời gọi mạng / truy vấn database mất 300ms. */
function goiApi(ten, msec = 300) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(`kết quả của ${ten}`), msec);
  });
}

const DANH_SACH = ['user', 'orders', 'products', 'reviews', 'inventory'];

// ═══════════════════════════════════════════════════════════════
// ❌ TUẦN TỰ — chờ xong cái này mới gọi cái kia
// ═══════════════════════════════════════════════════════════════
async function tuanTu() {
  const ketQua = [];
  for (const ten of DANH_SACH) {
    ketQua.push(await goiApi(ten)); // ← await trong vòng lặp
  }
  return ketQua;
}

// ═══════════════════════════════════════════════════════════════
// ✅ SONG SONG — bắn hết đi rồi chờ chung
// ═══════════════════════════════════════════════════════════════
async function songSong() {
  // .map KHÔNG await → tất cả promise được tạo NGAY LẬP TỨC
  const cacPromise = DANH_SACH.map((ten) => goiApi(ten));
  return Promise.all(cacPromise);
}

console.log(`${DANH_SACH.length} lời gọi, mỗi lời gọi 300ms\n`);

console.time('❌ Tuần tự  ');
await tuanTu();
console.timeEnd('❌ Tuần tự  ');

console.time('✅ Song song');
await songSong();
console.timeEnd('✅ Song song');

console.log('\n→ Tuần tự  ≈ 5 × 300ms = 1500ms');
console.log('→ Song song ≈     300ms (tất cả chạy cùng lúc)\n');

/*
 * KHI NÀO DÙNG TUẦN TỰ, KHI NÀO SONG SONG?
 *
 * SONG SONG khi các việc ĐỘC LẬP với nhau:
 *   - lấy thông tin user + lấy danh sách đơn hàng + lấy giỏ hàng
 *
 * TUẦN TỰ khi việc sau CẦN kết quả của việc trước:
 *   const user = await timUser(id);
 *   const donHang = await timDonHang(user.id);   ← cần user.id
 *
 * ⚠️ CẢNH BÁO: song song KHÔNG phải lúc nào cũng tốt.
 *    Promise.all với 10.000 phần tử = 10.000 kết nối database cùng lúc
 *    → sập database. Khi đó cần giới hạn số việc chạy đồng thời
 *      (xem bài tập về nhà).
 */
