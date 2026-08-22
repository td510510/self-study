/**
 * Buổi 20 — Phân trang: offset vs cursor.
 *
 * Chạy:  node --env-file=.env src/demo-index.js      (tạo 200.000 dòng trước)
 *        node --env-file=.env src/demo-phan-trang.js
 */

import { prisma } from './lib/prisma.js';

const tong = await prisma.donHang.count();
if (tong < 100_000) {
  console.log(`Chỉ có ${tong} đơn hàng. Chạy src/demo-index.js trước để tạo dữ liệu.`);
  process.exit(1);
}

console.log(`Bảng don_hangs có ${tong.toLocaleString('vi-VN')} dòng.\n`);

const MOI_TRANG = 20;

async function do_(fn) {
  await fn(); // làm nóng cache
  const batDau = process.hrtime.bigint();
  const kq = await fn();
  return { msec: Number(process.hrtime.bigint() - batDau) / 1e6, soDong: kq.length };
}

// ═══════════════════════════════════════════════════════════════
// OFFSET — skip/take
// ═══════════════════════════════════════════════════════════════
console.log('═══ 1. OFFSET (skip/take) — càng về sau càng chậm ═══\n');
console.log('  trang        offset  |  thời gian');
console.log('  -------------------- | ----------');

const ketQuaOffset = [];
for (const trang of [1, 100, 1000, 5000, 10000]) {
  const skip = (trang - 1) * MOI_TRANG;
  const r = await do_(() =>
    prisma.donHang.findMany({ orderBy: { id: 'asc' }, skip, take: MOI_TRANG, select: { id: true } })
  );
  ketQuaOffset.push({ trang, skip, ...r });
  console.log(`  ${String(trang).padStart(6)} ${String(skip).padStart(11)}  | ${r.msec.toFixed(2).padStart(8)} ms`);
}

console.log(`
  → Trang 1 nhanh, trang 10.000 chậm hơn nhiều.

  VÌ SAO? Database KHÔNG "nhảy thẳng" tới dòng thứ 200.000.
  Nó phải ĐỌC VÀ BỎ QUA lần lượt 199.980 dòng đầu tiên,
  chỉ để trả về 20 dòng cuối. Công sức tăng TUYẾN TÍNH theo số trang.
`);

// ═══════════════════════════════════════════════════════════════
// CURSOR — dùng id của bản ghi cuối trang trước
// ═══════════════════════════════════════════════════════════════
console.log('═══ 2. CURSOR — thời gian KHÔNG ĐỔI dù ở trang nào ═══\n');

/** Lấy id ở vị trí thứ n để làm cursor cho phép so sánh công bằng. */
async function layIdTaiViTri(viTri) {
  const [r] = await prisma.donHang.findMany({
    orderBy: { id: 'asc' },
    skip: viTri,
    take: 1,
    select: { id: true },
  });
  return r.id;
}

console.log('  trang        offset  |  thời gian');
console.log('  -------------------- | ----------');

const ketQuaCursor = [];
for (const trang of [1, 100, 1000, 5000, 10000]) {
  const viTri = (trang - 1) * MOI_TRANG;
  const cursorId = await layIdTaiViTri(viTri);

  const r = await do_(() =>
    prisma.donHang.findMany({
      orderBy: { id: 'asc' },
      // cursor + skip:1 = "bắt đầu SAU bản ghi này"
      cursor: { id: cursorId },
      skip: 1,
      take: MOI_TRANG,
      select: { id: true },
    })
  );
  ketQuaCursor.push({ trang, ...r });
  console.log(`  ${String(trang).padStart(6)} ${String(viTri).padStart(11)}  | ${r.msec.toFixed(2).padStart(8)} ms`);
}

console.log(`
  → Thời gian gần như KHÔNG ĐỔI, dù ở trang 1 hay trang 10.000.

  VÌ SAO? Cursor dịch thành:  WHERE id > <cursor> ORDER BY id LIMIT 20
  Database dùng INDEX để nhảy THẲNG tới đúng vị trí. Không đọc thừa dòng nào.
`);

// ═══════════════════════════════════════════════════════════════
console.log('═══ 3. Bẫy của OFFSET mà ít người biết ═══\n');
console.log(`  Ngoài chuyện chậm, offset còn SAI khi dữ liệu thay đổi giữa các trang:

    1. Người dùng xem trang 1 (bản ghi 1–20)
    2. Có người XOÁ bản ghi số 5
    3. Người dùng bấm "trang 2" → skip 20
    4. Bản ghi thứ 21 (cũ) giờ đã dịch lên vị trí 20
       → NGƯỜI DÙNG KHÔNG BAO GIỜ THẤY NÓ

  Ngược lại, nếu có bản ghi được THÊM vào đầu danh sách,
  người dùng sẽ thấy LẶP LẠI một bản ghi ở trang sau.

  Cursor không bị vấn đề này, vì nó neo vào một BẢN GHI CỤ THỂ,
  không neo vào một VỊ TRÍ.
`);

// ═══════════════════════════════════════════════════════════════
const dauOffset = ketQuaOffset[0].msec;
const cuoiOffset = ketQuaOffset.at(-1).msec;
const dauCursor = ketQuaCursor[0].msec;
const cuoiCursor = ketQuaCursor.at(-1).msec;

console.log(`═══════════════════════════════════════════════════════════════
  TỔNG KẾT
═══════════════════════════════════════════════════════════════

                  |  trang 1  | trang 10.000 |  chậm đi
  ----------------|-----------|--------------|----------
  OFFSET          | ${dauOffset.toFixed(2).padStart(6)} ms | ${cuoiOffset.toFixed(2).padStart(9)} ms | ${(cuoiOffset / dauOffset).toFixed(1)}×
  CURSOR          | ${dauCursor.toFixed(2).padStart(6)} ms | ${cuoiCursor.toFixed(2).padStart(9)} ms | ${(cuoiCursor / dauCursor).toFixed(1)}×

  DÙNG CÁI NÀO?

    OFFSET  ✅ khi cần nhảy tới trang bất kỳ ("trang 47")
            ✅ khi cần hiển thị TỔNG SỐ TRANG
            ✅ khi dữ liệu ít (dưới ~10.000 dòng)
            ❌ dữ liệu lớn, hoặc cuộn vô hạn

    CURSOR  ✅ cuộn vô hạn, "tải thêm", feed
            ✅ dữ liệu lớn hoặc thay đổi liên tục
            ✅ API công khai (chống người dùng quét toàn bộ dữ liệu)
            ❌ không nhảy được tới trang bất kỳ
            ❌ khó đếm tổng số trang

  Facebook, Twitter, GitHub API đều dùng cursor cho feed.
  Trang quản trị nội bộ thì offset vẫn ổn.
`);

await prisma.$disconnect();
