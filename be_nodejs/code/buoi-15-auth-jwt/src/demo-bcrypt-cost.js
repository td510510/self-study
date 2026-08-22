/**
 * Buổi 15 — Vì sao bcrypt cố tình CHẬM, và chọn cost bao nhiêu.
 *
 * Chạy:  node --env-file=.env src/demo-bcrypt-cost.js
 */

import bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';

const MAT_KHAU = 'matkhau-cua-nguoi-dung';

console.log('═══ 1. SHA-256 nhanh tới mức NGUY HIỂM cho mật khẩu ═══\n');

const batDauSha = process.hrtime.bigint();
const SO_LAN = 100_000;
for (let i = 0; i < SO_LAN; i++) {
  createHash('sha256').update(MAT_KHAU + i).digest('hex');
}
const msecSha = Number(process.hrtime.bigint() - batDauSha) / 1e6;

console.log(`  ${SO_LAN.toLocaleString('vi-VN')} lần băm SHA-256: ${msecSha.toFixed(0)}ms`);
console.log(`  → ${Math.round(SO_LAN / (msecSha / 1000)).toLocaleString('vi-VN')} lần/giây trên MỘT nhân CPU`);
console.log('  → Kẻ tấn công có GPU thử được HÀNG TỶ mật khẩu mỗi giây.');
console.log('  → Dùng SHA-256 cho mật khẩu = mọi mật khẩu yếu bị dò ra trong vài phút.\n');

console.log('═══ 2. bcrypt cố tình chậm — cost tăng 1 thì chậm GẤP ĐÔI ═══\n');
console.log('  cost | thời gian | số lần thử được mỗi giây');
console.log('  -----|-----------|-------------------------');

for (const cost of [10, 11, 12, 13]) {
  const batDau = process.hrtime.bigint();
  await bcrypt.hash(MAT_KHAU, cost);
  const msec = Number(process.hrtime.bigint() - batDau) / 1e6;

  const moiGiay = (1000 / msec).toFixed(1);
  console.log(`  ${String(cost).padStart(4)} | ${msec.toFixed(0).padStart(7)}ms | ${moiGiay.padStart(10)} lần/giây`);
}

console.log(`
→ Mỗi lần tăng cost thêm 1, thời gian băm TĂNG GẤP ĐÔI.
  Đó là ý đồ thiết kế: khi CPU nhanh gấp đôi, ta chỉ cần tăng cost lên 1
  để giữ nguyên mức bảo vệ.

  CHỌN COST THẾ NÀO?
    - Mục tiêu: mỗi lần băm mất khoảng 200–500ms trên máy chủ production
    - Quá thấp  → dễ bị dò
    - Quá cao   → đăng nhập chậm, và kẻ tấn công có thể lợi dụng chính
                  điều đó để làm nghẽn server (mỗi request giả đều tốn CPU thật)
    - Khuyến nghị hiện nay: 12
`);

console.log('═══ 3. Cùng mật khẩu → hash KHÁC NHAU nhờ salt ngẫu nhiên ═══\n');

const h1 = await bcrypt.hash(MAT_KHAU, 10);
const h2 = await bcrypt.hash(MAT_KHAU, 10);

console.log('  hash 1:', h1);
console.log('  hash 2:', h2);
console.log('  giống nhau?', h1 === h2, '← KHÁC NHAU dù cùng mật khẩu\n');

console.log('  Cấu trúc chuỗi bcrypt:  $2b$10$<22 ký tự salt><31 ký tự hash>');
console.log('    $2b  = phiên bản thuật toán');
console.log('    $10  = cost');
console.log('    rồi salt và hash nằm chung một chuỗi\n');
console.log('  → Nhờ salt nhúng sẵn, bcrypt.compare() tự biết cách băm lại để so sánh.');
console.log('  → Nhờ salt NGẪU NHIÊN, kẻ tấn công không dùng được bảng tra sẵn (rainbow table).');
console.log('  → Và hai người cùng mật khẩu "123456" cũng không lộ ra là họ trùng nhau.\n');

console.log('═══ 4. compare() so sánh theo thời gian không đổi ═══\n');
console.log('  bcrypt.compare() KHÔNG dùng === để so hai chuỗi.');
console.log('  Vì === dừng ngay ở ký tự đầu tiên khác nhau → thời gian phản hồi');
console.log('  tiết lộ ta đoán đúng được bao nhiêu ký tự. Đó là tấn công đo thời gian.');
console.log('  → Tự viết `hash1 === hash2` là một lỗ hổng. Luôn dùng compare().\n');
