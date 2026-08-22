/**
 * Project 2 — Dữ liệu mẫu.
 *
 * Chạy:  npm run seed
 *
 * Seed phải TẤT ĐỊNH và CHẠY LẠI ĐƯỢC (idempotent) —
 * gọi hai lần không được nhân đôi dữ liệu. Dùng upsert.
 */

import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { bamMatKhau } from '../src/modules/auth/mat-khau.js';

const DANH_MUC = [
  { ten: 'Điện thoại', slug: 'dien-thoai' },
  { ten: 'Laptop', slug: 'laptop' },
  { ten: 'Phụ kiện', slug: 'phu-kien' },
];

const SAN_PHAM = [
  { ten: 'Điện thoại Alpha 5G', slug: 'dien-thoai-alpha-5g', giaVND: 7_990_000, tonKho: 25, danhMuc: 'dien-thoai' },
  { ten: 'Điện thoại Beta Lite', slug: 'dien-thoai-beta-lite', giaVND: 3_490_000, tonKho: 40, danhMuc: 'dien-thoai' },
  { ten: 'Điện thoại Gamma Pro', slug: 'dien-thoai-gamma-pro', giaVND: 21_900_000, tonKho: 0, danhMuc: 'dien-thoai' },
  { ten: 'Laptop Delta 14"', slug: 'laptop-delta-14', giaVND: 18_500_000, tonKho: 12, danhMuc: 'laptop' },
  { ten: 'Laptop Epsilon Gaming', slug: 'laptop-epsilon-gaming', giaVND: 34_900_000, tonKho: 5, danhMuc: 'laptop' },
  { ten: 'Tai nghe Zeta ANC', slug: 'tai-nghe-zeta-anc', giaVND: 1_290_000, tonKho: 100, danhMuc: 'phu-kien' },
  { ten: 'Sạc nhanh Eta 65W', slug: 'sac-nhanh-eta-65w', giaVND: 450_000, tonKho: 200, danhMuc: 'phu-kien' },
  { ten: 'Ốp lưng Theta', slug: 'op-lung-theta', giaVND: 120_000, tonKho: 500, danhMuc: 'phu-kien' },
];

const NGUOI_DUNG = [
  { email: 'admin@shop.com', ten: 'Quản trị viên', vaiTro: 'admin' },
  { email: 'nhanvien@shop.com', ten: 'Nhân viên kho', vaiTro: 'nhanVien' },
  { email: 'khach@shop.com', ten: 'Khách hàng', vaiTro: 'khach' },
];

const MAT_KHAU_MAU = 'matkhau-du-dai';

console.log('Đang tạo dữ liệu mẫu...\n');

// ── Danh mục ────────────────────────────────────────────────────
const banDoDanhMuc = new Map();
for (const dm of DANH_MUC) {
  const ban = await prisma.danhMuc.upsert({
    where: { slug: dm.slug },
    update: { ten: dm.ten },
    create: dm,
  });
  banDoDanhMuc.set(dm.slug, ban.id);
}
console.log(`  ✓ ${DANH_MUC.length} danh mục`);

// ── Sản phẩm ────────────────────────────────────────────────────
for (const sp of SAN_PHAM) {
  const { danhMuc, ...duLieu } = sp;
  await prisma.sanPham.upsert({
    where: { slug: sp.slug },
    update: { ...duLieu, danhMucId: banDoDanhMuc.get(danhMuc) },
    create: { ...duLieu, danhMucId: banDoDanhMuc.get(danhMuc) },
  });
}
console.log(`  ✓ ${SAN_PHAM.length} sản phẩm`);

// ── Người dùng ──────────────────────────────────────────────────
const hash = await bamMatKhau(MAT_KHAU_MAU);
for (const nd of NGUOI_DUNG) {
  await prisma.user.upsert({
    where: { email: nd.email },
    update: { ten: nd.ten, vaiTro: nd.vaiTro },
    create: { ...nd, matKhauHash: hash, gioHang: { create: {} } },
  });
}
console.log(`  ✓ ${NGUOI_DUNG.length} người dùng\n`);

console.log('Tài khoản mẫu (mật khẩu đều là "' + MAT_KHAU_MAU + '"):');
for (const nd of NGUOI_DUNG) {
  console.log(`  ${nd.vaiTro.padEnd(9)} ${nd.email}`);
}

console.log('\nThử ngay:');
console.log('  curl "http://localhost:3000/san-pham?danhMuc=phu-kien&sapXep=gia-tang"');

await prisma.$disconnect();
