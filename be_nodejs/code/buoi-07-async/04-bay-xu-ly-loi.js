/**
 * Buổi 07 — Bước 4: ba cái bẫy khi bắt lỗi bất đồng bộ.
 *
 * Chạy:  node 04-bay-xu-ly-loi.js
 */

const nghi = (ms) => new Promise((r) => setTimeout(r, ms));

// ── LƯỚI AN TOÀN CẤP TIẾN TRÌNH ──────────────────────────────────
// Đăng ký TRƯỚC mọi thứ khác. Không có hai bộ này, các bẫy bên dưới
// sẽ giết tiến trình ngay lập tức.
// (Bài 05 sẽ bàn kỹ: dùng chúng thế nào cho ĐÚNG ở production.)

process.on('uncaughtException', (err) => {
  console.log(`   🔴 uncaughtException bắt được: "${err.message}"`);
  console.log('      → Không có lưới này, TIẾN TRÌNH ĐÃ CHẾT.\n');
});

process.on('unhandledRejection', (err) => {
  console.log(`   🔴 unhandledRejection bắt được: "${err.message}"`);
  console.log('      → Promise bị từ chối mà không ai bắt.\n');
});

// ═══════════════════════════════════════════════════════════════
// BẪY 1: try/catch KHÔNG bắt được lỗi ném ra trong callback
// ═══════════════════════════════════════════════════════════════
console.log('═══ BẪY 1: try/catch quanh callback ═══\n');

try {
  setTimeout(() => {
    // Lỗi này ném ra ở một "lượt" KHÁC của Event Loop (nhớ buổi 02).
    // Lúc đó khối try/catch bên dưới đã thoát từ lâu.
    throw new Error('Lỗi ném trong setTimeout');
  }, 10);
} catch (err) {
  console.log('   KHÔNG BAO GIỜ chạy tới đây');
}
console.log('   try/catch đã thoát, chưa có lỗi nào. Chờ 10ms...\n');

await nghi(50);

// ═══════════════════════════════════════════════════════════════
// BẪY 2: quên await → lỗi thành unhandledRejection
// ═══════════════════════════════════════════════════════════════
console.log('═══ BẪY 2: quên await ═══\n');

async function coTheLoi() {
  throw new Error('Lỗi bên trong hàm async');
}

try {
  coTheLoi(); // ❌ QUÊN await
  console.log('   ❌ try/catch KHÔNG bắt được — vì không có await\n');
} catch (err) {
  console.log('   không tới đây');
}

await nghi(50);

try {
  await coTheLoi(); // ✅ CÓ await
} catch (err) {
  console.log(`   ✅ Có await → bắt được: "${err.message}"\n`);
}

// ═══════════════════════════════════════════════════════════════
// BẪY 3: Promise.all NUỐT LẶNG LẼ các lỗi sau lỗi đầu tiên
// ═══════════════════════════════════════════════════════════════
console.log('═══ BẪY 3: lỗi bị nuốt lặng lẽ trong Promise.all ═══\n');

const loi = (ten, ms) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(ten)), ms));

try {
  await Promise.all([loi('lỗi 1', 10), loi('lỗi 2', 30)]);
} catch (err) {
  console.log(`   Bắt được lỗi ĐẦU TIÊN: "${err.message}"`);
}

await nghi(100);

console.log('   ⚠️  "lỗi 2" đâu rồi? KHÔNG có log nào cả.');
console.log('      Promise.all đã gắn handler vào MỌI promise, nên "lỗi 2"');
console.log('      KHÔNG thành unhandledRejection — nó bị NUỐT LẶNG LẼ.');
console.log('      Điều này còn tệ hơn: bạn không bao giờ biết nó tồn tại.\n');

// So sánh: allSettled xử lý được MỌI lỗi
console.log('   ✅ Với allSettled thì không lỗi nào bị bỏ sót:');
const kq = await Promise.allSettled([loi('lỗi A', 10), loi('lỗi B', 20)]);
kq.forEach((r, i) => console.log(`      [${i}] ${r.status}: ${r.reason.message}`));

// ═══════════════════════════════════════════════════════════════
console.log('\n═══ BỐN QUY TẮC ═══\n');
console.log('1. try/catch CHỈ bắt lỗi trong cùng "lượt" Event Loop.');
console.log('   → Với callback: phải xử lý lỗi NGAY TRONG callback.');
console.log('2. LUÔN await trước hàm async — kể cả khi không cần kết quả.');
console.log('3. Promise.all ném lỗi đầu tiên và NUỐT phần còn lại.');
console.log('   → Cần biết mọi lỗi thì dùng allSettled.');
console.log('4. Luôn đăng ký lưới an toàn cấp tiến trình (xem bài 05).\n');

/*
 * VÌ SAO try/catch KHÔNG BẮT ĐƯỢC LỖI TRONG CALLBACK?
 *
 * Nhớ lại Event Loop ở buổi 02:
 *
 *   1. Chạy tới setTimeout → ĐĂNG KÝ callback → THOÁT khỏi khối try
 *   2. ... Event Loop quay tiếp ...
 *   3. 10ms sau, pha `timers` chạy callback → callback ném lỗi
 *   4. Lúc này ngăn xếp lời gọi HOÀN TOÀN KHÁC.
 *      Khối try/catch ở bước 1 đã không còn tồn tại.
 *
 * async/await sinh ra chính là để giải quyết vấn đề này:
 * `await` giữ được ngữ cảnh try/catch qua các lượt của Event Loop.
 */
