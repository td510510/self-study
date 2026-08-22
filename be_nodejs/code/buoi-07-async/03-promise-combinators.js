/**
 * Buổi 07 — Bước 3: bốn cách gộp Promise.
 *
 * Chọn sai combinator = lỗi logic khó tìm.
 *
 * Chạy:  node 03-promise-combinators.js
 */

function thanhCong(ten, msec) {
  return new Promise((resolve) => setTimeout(() => resolve(`✔ ${ten}`), msec));
}

function thatBai(ten, msec) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`✘ ${ten} lỗi`)), msec)
  );
}

const taoBoTest = () => [
  thanhCong('nhanh', 100),
  thatBai('hỏng', 200),
  thanhCong('chậm', 400),
];

// ═══════════════════════════════════════════════════════════════
console.log('═══ Promise.all — MỘT cái lỗi là HỎNG HẾT ═══\n');
try {
  await Promise.all(taoBoTest());
  console.log('không bao giờ tới đây');
} catch (err) {
  console.log('Bị ném lỗi ngay khi có cái đầu tiên thất bại:', err.message);
  console.log('⚠️  Kết quả của "nhanh" và "chậm" BỊ VỨT BỎ hoàn toàn\n');
}

// ═══════════════════════════════════════════════════════════════
console.log('═══ Promise.allSettled — chờ HẾT, báo cáo đầy đủ ═══\n');
const ketQua = await Promise.allSettled(taoBoTest());
ketQua.forEach((r, i) => {
  if (r.status === 'fulfilled') {
    console.log(`  [${i}] thành công: ${r.value}`);
  } else {
    console.log(`  [${i}] thất bại  : ${r.reason.message}`);
  }
});
console.log();

// ═══════════════════════════════════════════════════════════════
console.log('═══ Promise.race — ai xong TRƯỚC thì thắng (kể cả lỗi) ═══\n');
try {
  const nhanhNhat = await Promise.race(taoBoTest());
  console.log('Người thắng:', nhanhNhat, '\n');
} catch (err) {
  console.log('Lỗi thắng cuộc đua:', err.message, '\n');
}

// ═══════════════════════════════════════════════════════════════
console.log('═══ Promise.any — ai THÀNH CÔNG trước thì thắng ═══\n');
try {
  const dauTien = await Promise.any([
    thatBai('hỏng 1', 50),
    thatBai('hỏng 2', 80),
    thanhCong('cuối cùng cũng được', 300),
  ]);
  console.log('Kết quả thành công đầu tiên:', dauTien, '\n');
} catch (err) {
  console.log('TẤT CẢ đều lỗi:', err.errors.map((e) => e.message), '\n');
}

// ═══════════════════════════════════════════════════════════════
console.log('═══ ỨNG DỤNG THẬT: timeout cho lời gọi mạng ═══\n');

/**
 * Promise.race dùng để đặt hạn chót cho một tác vụ.
 * Đây là pattern gặp hằng ngày ở backend.
 */
function voiTimeout(promise, msec) {
  const hetGio = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Quá hạn ${msec}ms`)), msec)
  );
  return Promise.race([promise, hetGio]);
}

try {
  await voiTimeout(thanhCong('api chậm', 2000), 500);
} catch (err) {
  console.log('Bắt được:', err.message);
  console.log('→ Không để người dùng chờ vô tận vì một service bên thứ ba treo\n');
}

/*
 * BẢNG CHỌN
 *
 *   Promise.all         Cần TẤT CẢ thành công. Một cái lỗi → hỏng hết.
 *                       Ví dụ: lấy user + giỏ hàng để render trang.
 *
 *   Promise.allSettled  Muốn biết kết quả của TỪNG cái, lỗi cũng không sao.
 *                       Ví dụ: gửi thông báo cho 100 người, ai lỗi thì ghi log.
 *
 *   Promise.race        Ai xong trước thì lấy — KỂ CẢ LỖI.
 *                       Ví dụ: đặt timeout (như trên).
 *
 *   Promise.any         Ai THÀNH CÔNG trước thì lấy, bỏ qua lỗi.
 *                       Ví dụ: gọi 3 máy chủ dự phòng, lấy cái nào trả lời được.
 *
 *
 * ⚠️ LỖI HAY GẶP: dùng Promise.all cho việc gửi email hàng loạt.
 *    Một email lỗi → toàn bộ dừng, những người còn lại không nhận được gì.
 *    Đúng ra phải dùng allSettled.
 */
