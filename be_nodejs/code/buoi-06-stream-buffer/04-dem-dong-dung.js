/**
 * Buổi 06 — Bước 4: hai cách đếm ĐÚNG.
 *
 * Chạy:  node 04-dem-dong-dung.js
 * So sánh kết quả với 03-dem-dong-sai.js
 */

import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const TU_KHOA = 'từ chối';
const FILE = 'data/access.log';

// ═══════════════════════════════════════════════════════════════
// CÁCH 1: tự giữ phần dư giữa các chunk
// ═══════════════════════════════════════════════════════════════
async function cach1_TuGiuPhanDu() {
  let soDong = 0;
  let soLanTuKhoa = 0;
  let phanDu = ''; // ⭐ CHÌA KHOÁ: phần dòng chưa hoàn chỉnh của chunk trước

  const stream = createReadStream(FILE, {
    highWaterMark: 1024,
    encoding: 'utf8', // ⭐ Node tự lo ranh giới ký tự UTF-8 giúp ta
  });

  for await (const chunk of stream) {
    // Nối phần dư của chunk trước vào đầu chunk này
    const text = phanDu + chunk;
    const cacDong = text.split('\n');

    // Phần tử CUỐI có thể là dòng chưa hoàn chỉnh → để dành cho chunk sau
    phanDu = cacDong.pop();

    for (const dong of cacDong) {
      soDong++;
      if (dong.includes(TU_KHOA)) soLanTuKhoa++;
    }
  }

  // Đừng quên dòng cuối cùng nếu file không kết thúc bằng '\n'
  if (phanDu.length > 0) {
    soDong++;
    if (phanDu.includes(TU_KHOA)) soLanTuKhoa++;
  }

  return { soDong, soLanTuKhoa };
}

// ═══════════════════════════════════════════════════════════════
// CÁCH 2: dùng readline — Node lo hết
// ═══════════════════════════════════════════════════════════════
async function cach2_Readline() {
  let soDong = 0;
  let soLanTuKhoa = 0;

  const rl = createInterface({
    input: createReadStream(FILE),
    crlfDelay: Infinity, // xử lý đúng cả file kiểu Windows (\r\n)
  });

  // readline đảm bảo mỗi lần lặp là MỘT DÒNG HOÀN CHỈNH
  for await (const dong of rl) {
    soDong++;
    if (dong.includes(TU_KHOA)) soLanTuKhoa++;
  }

  return { soDong, soLanTuKhoa };
}

// ═══════════════════════════════════════════════════════════════

console.log('Đang đọc (cách ĐÚNG)...\n');

console.time('Cách 1 — tự giữ phần dư');
const kq1 = await cach1_TuGiuPhanDu();
console.timeEnd('Cách 1 — tự giữ phần dư');
console.log(`  Số dòng: ${kq1.soDong.toLocaleString('vi-VN')}`);
console.log(`  Số dòng có "${TU_KHOA}": ${kq1.soLanTuKhoa}\n`);

console.time('Cách 2 — readline');
const kq2 = await cach2_Readline();
console.timeEnd('Cách 2 — readline');
console.log(`  Số dòng: ${kq2.soDong.toLocaleString('vi-VN')}`);
console.log(`  Số dòng có "${TU_KHOA}": ${kq2.soLanTuKhoa}\n`);

console.log('Bộ nhớ đỉnh:', (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1), 'MB');
console.log('(file 31 MB — nhưng ta không bao giờ nạp hết vào RAM)\n');

/*
 * SO SÁNH VỚI BÀI 03
 *
 *   03-dem-dong-sai.js  →  496 dòng   ❌ (thiếu 4)
 *   04 cách 1 & cách 2  →  500 dòng   ✅
 *
 * 4 lần thiếu = 4 từ khoá nằm vắt qua ranh giới chunk.
 *
 * ⚠️ ĐIỀU ĐÁNG SỢ NHẤT: bài 03 KHÔNG BÁO LỖI.
 *    Nó chạy nhanh hơn, không crash, và trả về một con số trông hợp lý.
 *    Chỉ khi đối chiếu với `grep -c` mới biết là sai.
 *
 *
 * DÙNG CÁCH NÀO?
 *
 *   readline  → khi dữ liệu chia theo DÒNG (log, CSV, JSONL). Gọn, khó sai.
 *   phần dư   → khi cần tự kiểm soát (parse binary, giao thức riêng),
 *               hoặc khi cần hiệu năng tối đa.
 *
 * Trong công việc thật: mặc định dùng readline.
 * Nhưng phải HIỂU cách 1, vì đó là thứ readline làm bên trong.
 */
