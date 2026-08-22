/**
 * Buổi 19 — TỰ TẠO RA TỒN KHO ÂM.
 *
 * Kịch bản: 10 người cùng lúc mua sản phẩm cuối cùng trong kho (tồn kho = 5).
 * Đáng lẽ chỉ 5 người mua được. Xem thực tế ra sao.
 *
 * Chạy:  node --env-file=.env src/demo-tranh-chap.js
 */

import { prisma } from './lib/prisma.js';
import { bamMatKhau } from './modules/auth/mat-khau.js';
import {
  datHangNgayTho,
  datHangCoTransaction,
  datHangAnToan,
} from './modules/donhang/donhang.service.js';

const SO_NGUOI_MUA = 10;
const TON_KHO_BAN_DAU = 5;

// ── Dựng dữ liệu sạch cho mỗi lượt thử ──────────────────────────
async function chuanBi() {
  await prisma.donHangItem.deleteMany();
  await prisma.donHang.deleteMany();
  await prisma.gioHangItem.deleteMany();
  await prisma.gioHang.deleteMany();
  await prisma.sanPham.deleteMany();
  await prisma.danhMuc.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const dm = await prisma.danhMuc.create({ data: { ten: 'Test', slug: 'test' } });
  const sp = await prisma.sanPham.create({
    data: {
      ten: 'Món hàng cuối cùng',
      slug: 'mon-hang-cuoi-cung',
      giaVND: 1_000_000,
      tonKho: TON_KHO_BAN_DAU,
      danhMucId: dm.id,
    },
  });

  // Mỗi người một giỏ, mỗi giỏ có 1 món hàng đó.
  // Băm mật khẩu MỘT LẦN rồi dùng chung — bcrypt chậm (buổi 15).
  const hash = await bamMatKhau('matkhau-du-dai');
  const users = [];

  for (let i = 0; i < SO_NGUOI_MUA; i++) {
    const u = await prisma.user.create({
      data: {
        email: `nguoi${i}@test.com`,
        ten: `Người ${i}`,
        matKhauHash: hash,
        gioHang: { create: { items: { create: { sanPhamId: sp.id, soLuong: 1 } } } },
      },
    });
    users.push(u);
  }

  return { sanPhamId: sp.id, users };
}

// ── Chạy một lượt thử ───────────────────────────────────────────
async function thu(nhan, datHang) {
  const { sanPhamId, users } = await chuanBi();

  const batDau = Date.now();

  // ⚠️ CHÌA KHOÁ CỦA DEMO: Promise.all bắn TẤT CẢ cùng lúc,
  // không phải tuần tự. Đây là mô phỏng đúng những gì xảy ra
  // khi 10 người thật bấm "Đặt hàng" trong cùng một giây.
  const ketQua = await Promise.allSettled(
    users.map((u) =>
      datHang(u.id, { diaChiGiao: '123 Đường Test, Quận 1', soDienThoai: '0901234567' })
    )
  );

  const msec = Date.now() - batDau;
  const thanhCong = ketQua.filter((r) => r.status === 'fulfilled').length;
  const thatBai = ketQua.length - thanhCong;

  const sp = await prisma.sanPham.findUnique({ where: { id: sanPhamId } });
  const soDon = await prisma.donHang.count();

  const dung = sp.tonKho >= 0 && thanhCong === TON_KHO_BAN_DAU;

  console.log(`\n${nhan}`);
  console.log(`  Đặt thành công : ${thanhCong}  (đáng lẽ phải là ${TON_KHO_BAN_DAU})`);
  console.log(`  Bị từ chối     : ${thatBai}`);
  console.log(`  Số đơn tạo ra  : ${soDon}`);
  console.log(`  Tồn kho còn lại: ${sp.tonKho}  ${sp.tonKho < 0 ? '🚨 ÂM!' : ''}`);
  console.log(`  Thời gian      : ${msec}ms`);
  console.log(`  → ${dung ? '✅ ĐÚNG' : '🚨 SAI — đã bán nhiều hơn số hàng có'}`);

  return { thanhCong, tonKho: sp.tonKho, dung, msec };
}

// ═══════════════════════════════════════════════════════════════

console.log('═'.repeat(66));
console.log(`  ${SO_NGUOI_MUA} người CÙNG LÚC mua sản phẩm còn ${TON_KHO_BAN_DAU} cái trong kho`);
console.log('═'.repeat(66));

const r1 = await thu('❌ PHIÊN BẢN 1 — không transaction', datHangNgayTho);
const r2 = await thu('⚠️  PHIÊN BẢN 2 — có transaction, KHÔNG khoá', datHangCoTransaction);
const r3 = await thu('✅ PHIÊN BẢN 3 — transaction + khoá dòng', datHangAnToan);

console.log('\n' + '═'.repeat(66));
console.log('  TỔNG KẾT');
console.log('═'.repeat(66));
console.log('  phiên bản                        | bán được | tồn kho | kết quả');
console.log('  ---------------------------------|----------|---------|--------');
const dong = (ten, r) =>
  `  ${ten.padEnd(32)} | ${String(r.thanhCong).padStart(8)} | ${String(r.tonKho).padStart(7)} | ${r.dung ? '✅' : '🚨 SAI'}`;
console.log(dong('1. không transaction', r1));
console.log(dong('2. transaction, không khoá', r2));
console.log(dong('3. transaction + FOR UPDATE', r3));

console.log(`

BÀI HỌC

  1. Bug này KHÔNG XUẤT HIỆN khi test một mình.
     Bấm "Đặt hàng" một lần → luôn đúng. Chỉ sai khi có NHIỀU NGƯỜI CÙNG LÚC.
     Đó là lý do nó lọt qua mọi vòng test thủ công và chỉ nổ vào ngày sale.

  2. Bọc transaction KHÔNG đủ.
     Transaction đảm bảo "hoặc làm hết, hoặc không làm gì" (nguyên tử),
     nhưng KHÔNG ngăn hai transaction cùng đọc một giá trị cũ.

  3. Phải KHOÁ DÒNG (SELECT ... FOR UPDATE) hoặc đưa điều kiện
     vào chính câu UPDATE — để database làm trọng tài.

  4. Hậu quả thật: bán 10 cái khi chỉ có 5. Phải xin lỗi 5 khách hàng,
     hoàn tiền, và mất uy tín. Tồn kho âm còn làm hỏng mọi báo cáo.
`);

await prisma.$disconnect();
