/**
 * Buổi 07 — Bước 5: từ callback lên Promise, và lưới an toàn cấp tiến trình.
 *
 * Chạy:  node 05-promisify-va-luoi-an-toan.js
 */

import { promisify } from 'node:util';
import fs from 'node:fs';
import { setTimeout as nghi } from 'node:timers/promises';

// ═══════════════════════════════════════════════════════════════
// PHẦN 1: Ba thế hệ code bất đồng bộ
// ═══════════════════════════════════════════════════════════════
console.log('═══ Ba thế hệ code bất đồng bộ ═══\n');

// Thế hệ 1: callback theo quy ước "lỗi đứng đầu" (error-first callback)
function theHe1(callback) {
  fs.readFile('package.json', 'utf8', (err, data) => {
    if (err) return callback(err); // ⚠️ nhớ `return`, nếu không sẽ chạy tiếp
    callback(null, JSON.parse(data).name);
  });
}

// Thế hệ 2: tự bọc thành Promise
function theHe2() {
  return new Promise((resolve, reject) => {
    fs.readFile('package.json', 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(JSON.parse(data).name);
    });
  });
}

// Thế hệ 2b: dùng promisify — Node bọc hộ
const docFile = promisify(fs.readFile);

// Thế hệ 3: dùng API promise có sẵn (khuyến nghị)
import { readFile } from 'node:fs/promises';

theHe1((err, ten) => console.log('Thế hệ 1 (callback) :', ten));
console.log('Thế hệ 2 (Promise)  :', await theHe2());
console.log('Thế hệ 2b (promisify):', JSON.parse(await docFile('package.json', 'utf8')).name);
console.log('Thế hệ 3 (fs/promises):', JSON.parse(await readFile('package.json', 'utf8')).name);

console.log('\n→ Luôn ưu tiên thế hệ 3. Chỉ dùng promisify cho thư viện cũ.\n');

// ═══════════════════════════════════════════════════════════════
// PHẦN 2: Giới hạn số việc chạy đồng thời
// ═══════════════════════════════════════════════════════════════
console.log('═══ Giới hạn số việc chạy đồng thời ═══\n');

/**
 * Promise.all với 10.000 phần tử = 10.000 kết nối database cùng lúc → sập.
 * Hàm này chạy song song nhưng KHÔNG BAO GIỜ quá `gioiHan` việc cùng lúc.
 */
async function chayCoGioiHan(danhSach, gioiHan, xuLy) {
  const ketQua = [];
  let dangChay = 0;
  let chiSo = 0;
  let dinhCaoDongThoi = 0;

  return new Promise((resolve, reject) => {
    function tiep() {
      if (chiSo >= danhSach.length && dangChay === 0) {
        resolve({ ketQua, dinhCaoDongThoi });
        return;
      }

      while (dangChay < gioiHan && chiSo < danhSach.length) {
        const i = chiSo++;
        dangChay++;
        dinhCaoDongThoi = Math.max(dinhCaoDongThoi, dangChay);

        Promise.resolve(xuLy(danhSach[i], i))
          .then((r) => { ketQua[i] = r; })
          .catch(reject)
          .finally(() => { dangChay--; tiep(); });
      }
    }
    tiep();
  });
}

const congViec = Array.from({ length: 20 }, (_, i) => `việc-${i + 1}`);

console.time('20 việc, giới hạn 5 đồng thời');
const { dinhCaoDongThoi } = await chayCoGioiHan(congViec, 5, async (ten) => {
  await nghi(100);
  return ten;
});
console.timeEnd('20 việc, giới hạn 5 đồng thời');
console.log(`Đỉnh cao đồng thời: ${dinhCaoDongThoi} (đúng bằng giới hạn)`);
console.log('→ 20 việc × 100ms ÷ 5 luồng ≈ 400ms\n');

// ═══════════════════════════════════════════════════════════════
// PHẦN 3: Lưới an toàn cấp tiến trình — DÙNG SAO CHO ĐÚNG
// ═══════════════════════════════════════════════════════════════
console.log('═══ Lưới an toàn cấp tiến trình ═══\n');

process.on('uncaughtException', (err) => {
  console.error('[NGHIÊM TRỌNG] uncaughtException:', err.message);

  // ⚠️ ĐÚNG: ghi log rồi THOÁT.
  // Sau uncaughtException, trạng thái chương trình KHÔNG CÒN ĐÁNG TIN.
  // Có thể đang giữa một transaction dở dang, một file mở chưa đóng.
  // Cố chạy tiếp = dữ liệu sai âm thầm.
  //
  // process.exit(1);   ← ở production phải bật dòng này
});

process.on('unhandledRejection', (err) => {
  console.error('[NGHIÊM TRỌNG] unhandledRejection:', err?.message);
  // process.exit(1);
});

console.log('Đã đăng ký lưới an toàn.');
console.log('⚠️  Lưới an toàn KHÔNG PHẢI để "chạy tiếp như không có gì".');
console.log('   Nó chỉ để GHI LOG rồi THOÁT SẠCH SẼ.');
console.log('   Việc khởi động lại là của PM2 / Docker / Kubernetes (buổi 42).\n');

/*
 * VÌ SAO KHÔNG ĐƯỢC "NUỐT" uncaughtException RỒI CHẠY TIẾP?
 *
 * Ví dụ thật:
 *
 *   1. Bắt đầu transaction: trừ tiền tài khoản A
 *   2. 💥 Lỗi không bắt được xảy ra
 *   3. uncaughtException bắt được, ghi log, CHẠY TIẾP
 *   4. Transaction không bao giờ commit, cũng không rollback
 *   5. Tiền đã trừ, hàng không giao. Không ai biết.
 *
 * Trạng thái sau uncaughtException là KHÔNG XÁC ĐỊNH.
 * Cách duy nhất an toàn: ghi log đầy đủ → đóng kết nối → thoát → để
 * trình quản lý tiến trình khởi động lại một bản sạch.
 *
 * Đây chính là graceful shutdown — chủ đề buổi 08.
 */
