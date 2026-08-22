/**
 * Buổi 19 — Index: đo bằng số liệu, không nói suông.
 *
 * Chạy:  node --env-file=.env src/demo-index.js
 *
 * Cảnh báo: script này tạo 200.000 dòng, mất khoảng 30–60 giây.
 */

import { prisma } from './lib/prisma.js';

const SO_DON = 200_000;

// ── Dựng dữ liệu lớn ────────────────────────────────────────────
async function chuanBi() {
  const daCo = await prisma.donHang.count();
  if (daCo >= SO_DON) {
    console.log(`Đã có sẵn ${daCo.toLocaleString('vi-VN')} đơn hàng, bỏ qua bước tạo.\n`);
    return;
  }

  console.log(`Đang tạo ${SO_DON.toLocaleString('vi-VN')} đơn hàng...`);
  console.time('  thời gian tạo');

  await prisma.donHangItem.deleteMany();
  await prisma.donHang.deleteMany();
  await prisma.gioHangItem.deleteMany();
  await prisma.gioHang.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // 500 người dùng
  await prisma.user.createMany({
    data: Array.from({ length: 500 }, (_, i) => ({
      email: `khach${i}@test.com`,
      ten: `Khách ${i}`,
      matKhauHash: '$2b$04$khonglaimatkhauthatchidedemo000000000000000000000000',
    })),
  });
  const users = await prisma.user.findMany({ select: { id: true } });

  const TRANG_THAI = ['choXacNhan', 'daXacNhan', 'dangGiao', 'daGiao', 'daHuy'];
  const LO = 10_000;

  for (let batDau = 0; batDau < SO_DON; batDau += LO) {
    await prisma.donHang.createMany({
      data: Array.from({ length: Math.min(LO, SO_DON - batDau) }, (_, k) => {
        const i = batDau + k;
        return {
          maDon: `DH-DEMO-${String(i).padStart(7, '0')}`,
          userId: users[i % users.length].id,
          trangThai: TRANG_THAI[i % TRANG_THAI.length],
          tongTienVND: ((i * 7919) % 50) * 100_000 + 50_000,
          diaChiGiao: `Số ${i} Đường Test`,
          soDienThoai: '0901234567',
        };
      }),
    });
    process.stdout.write(`\r  đã tạo ${Math.min(batDau + LO, SO_DON).toLocaleString('vi-VN')}...`);
  }

  console.log();
  console.timeEnd('  thời gian tạo');
  console.log();
}

/** Đọc kế hoạch thực thi từ Postgres — đây là sự thật, không phải phỏng đoán. */
async function giaiThich(sql) {
  const rows = await prisma.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS) ${sql}`);
  const text = rows.map((r) => r['QUERY PLAN']).join('\n');

  const thoiGian = text.match(/Execution Time: ([\d.]+) ms/)?.[1];
  const dungIndex = /Index Scan|Index Only Scan|Bitmap Index Scan/.test(text);
  const quetBang = /Seq Scan/.test(text);

  return { text, thoiGian: Number(thoiGian), dungIndex, quetBang };
}

async function do_(nhan, sql) {
  // Chạy một lần cho "nóng" cache, rồi mới đo — để so sánh công bằng
  await prisma.$queryRawUnsafe(sql);
  const kq = await giaiThich(sql);

  const cach = kq.dungIndex ? 'Index Scan  ✅' : kq.quetBang ? 'Seq Scan  🐌' : '?';
  console.log(`  ${nhan.padEnd(46)} ${String(kq.thoiGian).padStart(8)} ms   ${cach}`);
  return kq;
}

// ═══════════════════════════════════════════════════════════════

await chuanBi();

const tong = await prisma.donHang.count();
console.log(`Bảng don_hangs có ${tong.toLocaleString('vi-VN')} dòng.\n`);

console.log('═══ 1. Cột CÓ index sẵn (khai @@index trong schema) ═══\n');

await do_('WHERE "trangThai" = \'daGiao\'', `SELECT * FROM don_hangs WHERE "trangThai" = 'daGiao' LIMIT 100`);
await do_('WHERE "userId" = 1', `SELECT * FROM don_hangs WHERE "userId" = 1`);
await do_('WHERE "maDon" = ... (cột @unique)', `SELECT * FROM don_hangs WHERE "maDon" = 'DH-DEMO-0100000'`);

console.log('\n═══ 2. Cột KHÔNG có index ═══\n');

// Truy vấn CHỌN LỌC CAO: chỉ khớp 1 dòng trong 200.000
const truoc = await do_(
  'WHERE "diaChiGiao" = ... (khớp 1 dòng)',
  `SELECT * FROM don_hangs WHERE "diaChiGiao" = 'Số 199999 Đường Test'`
);
const truocSap = await do_(
  'ORDER BY "tongTienVND" DESC LIMIT 20',
  `SELECT * FROM don_hangs ORDER BY "tongTienVND" DESC LIMIT 20`
);

console.log('\n═══ 3. Thêm index rồi đo lại ═══\n');

await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS demo_dia_chi_idx ON don_hangs ("diaChiGiao")`);
await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS demo_tong_tien_idx ON don_hangs ("tongTienVND")`);
await prisma.$executeRawUnsafe(`ANALYZE don_hangs`);
console.log('  đã tạo index trên "diaChiGiao" và "tongTienVND"');
console.log();

const sau = await do_(
  'WHERE "diaChiGiao" = ... (khớp 1 dòng)',
  `SELECT * FROM don_hangs WHERE "diaChiGiao" = 'Số 199999 Đường Test'`
);
const sauSap = await do_(
  'ORDER BY "tongTienVND" DESC LIMIT 20',
  `SELECT * FROM don_hangs ORDER BY "tongTienVND" DESC LIMIT 20`
);

console.log();
console.log('═══ 3b. Khi Postgres CỐ TÌNH KHÔNG dùng index ═══');
console.log();

// Truy vấn khớp NHIỀU dòng + có LIMIT.
// Postgres tính ra: quét tuần tự tìm đủ 100 dòng còn nhanh hơn
// đi qua index rồi nhảy ngược lại bảng để lấy dữ liệu.
// → Nó TỪ CHỐI dùng index. Đây là bộ tối ưu hoá làm ĐÚNG việc của nó.
await do_(
  'WHERE "tongTienVND" > 4000000 LIMIT 100',
  `SELECT * FROM don_hangs WHERE "tongTienVND" > 4000000 LIMIT 100`
);
console.log('  → Có index nhưng Postgres chọn Seq Scan. KHÔNG phải lỗi:');
console.log('     truy vấn này khớp ~20% số dòng, lại có LIMIT 100 —');
console.log('     quét tuần tự tìm đủ 100 dòng còn nhanh hơn dùng index.');
console.log('     Index chỉ có lợi khi truy vấn CHỌN LỌC CAO (khớp ít dòng).');

console.log('\n═══ 4. Cái giá của index ═══\n');

const idUser = (await prisma.user.findFirst({ select: { id: true } })).id;

async function doGhi5000(nhan) {
  const batDau = Date.now();
  await prisma.donHang.createMany({
    data: Array.from({ length: 5000 }, (_, i) => ({
      maDon: `DH-${nhan}-${Date.now()}-${i}`,
      userId: idUser,
      tongTienVND: 100_000,
      diaChiGiao: 'x',
      soDienThoai: '0901234567',
    })),
  });
  return Date.now() - batDau;
}

const ghiCoIndex = await doGhi5000('A');
await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS demo_tong_tien_idx`);
await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS demo_dia_chi_idx`);
const ghiKhongIndex = await doGhi5000('B');

console.log(`  Ghi 5.000 dòng KHI CÓ index thêm  : ${ghiCoIndex} ms`);
console.log(`  Ghi 5.000 dòng KHI KHÔNG có       : ${ghiKhongIndex} ms`);

// ═══════════════════════════════════════════════════════════════
const nhanh = (a, b) => (a / b).toFixed(1);

console.log(`

═══════════════════════════════════════════════════════════════
  TỔNG KẾT
═══════════════════════════════════════════════════════════════

  Tìm chính xác 1 dòng trong 200.000  (chọn lọc cao)
    trước khi có index : ${truoc.thoiGian} ms  (${truoc.quetBang ? 'Seq Scan' : '?'})
    sau khi có index   : ${sau.thoiGian} ms  (${sau.dungIndex ? 'Index Scan' : 'Seq Scan'})
    → nhanh gấp ${nhanh(truoc.thoiGian, sau.thoiGian)} lần

  Sắp xếp "ORDER BY tongTienVND DESC LIMIT 20"
    trước : ${truocSap.thoiGian} ms
    sau   : ${sauSap.thoiGian} ms
    → nhanh gấp ${nhanh(truocSap.thoiGian, sauSap.thoiGian)} lần

  CÁI GIÁ: index làm chậm GHI (${ghiCoIndex}ms so với ${ghiKhongIndex}ms cho 5.000 dòng)
           và chiếm thêm dung lượng đĩa.

  QUY TẮC
    · Index cột hay dùng trong WHERE, ORDER BY, JOIN
    · KHÔNG index bừa — mỗi index là một cái giá phải trả ở mọi lần ghi
    · Luôn đo bằng EXPLAIN ANALYZE, đừng đoán
    · "Seq Scan" trên bảng lớn THƯỜNG là dấu hiệu thiếu index —
      nhưng không phải luôn luôn: với truy vấn khớp nhiều dòng,
      Postgres cố tình chọn Seq Scan vì nó nhanh hơn thật
`);

await prisma.$disconnect();
