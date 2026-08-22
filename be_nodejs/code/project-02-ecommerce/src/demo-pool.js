/**
 * Buổi 20 — Connection pool: vì sao cần, và cái giá khi cấu hình sai.
 *
 * Chạy:  node --env-file=.env src/demo-pool.js
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const URL = process.env.DATABASE_URL;
const SO_TRUY_VAN = 60;

/** Tạo client với kích thước pool tuỳ chọn. */
function taoClient(max) {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: URL, max }),
  });
}

/** Truy vấn giả lập việc nặng: pg_sleep giữ kết nối 100ms. */
async function truyVanCham(client) {
  await client.$queryRaw`SELECT pg_sleep(0.1)::text AS x`;
}

async function doSongSong(nhan, client, soTruyVan = SO_TRUY_VAN) {
  // Chạy một lần cho pool khởi động xong, rồi mới đo
  await client.$queryRaw`SELECT 1`;

  const batDau = Date.now();
  await Promise.all(Array.from({ length: soTruyVan }, () => truyVanCham(client)));
  const msec = Date.now() - batDau;

  console.log(`  ${nhan.padEnd(34)} ${String(msec).padStart(6)} ms`);
  return msec;
}

// ═══════════════════════════════════════════════════════════════
console.log('═══ 1. Kích thước pool ảnh hưởng thế nào ═══\n');
console.log(`  ${SO_TRUY_VAN} truy vấn song song, mỗi truy vấn giữ kết nối 100ms\n`);

const ketQua = [];
for (const max of [1, 5, 10, 20]) {
  const c = taoClient(max);
  const msec = await doSongSong(`pool = ${String(max).padStart(2)} kết nối`, c);
  ketQua.push({ max, msec });
  await c.$disconnect();
}

console.log(`
  Với pool = 1 : mọi truy vấn XẾP HÀNG → ${SO_TRUY_VAN} × 100ms
  Với pool = N : chạy được N cái cùng lúc → thời gian giảm ~N lần
  → Nhưng KHÔNG giảm mãi. Xem phần 3.
`);

// ═══════════════════════════════════════════════════════════════
console.log('═══ 2. Cái giá của việc MỞ KẾT NỐI MỚI mỗi lần ═══\n');

const SO_LAN = 20;

// ❌ Cách sai: tạo client mới cho mỗi thao tác
const batDauSai = Date.now();
for (let i = 0; i < SO_LAN; i++) {
  const c = taoClient(1);
  await c.$queryRaw`SELECT 1`;
  await c.$disconnect();
}
const msecSai = Date.now() - batDauSai;

// ✅ Cách đúng: một client dùng chung
const dungChung = taoClient(10);
await dungChung.$queryRaw`SELECT 1`;
const batDauDung = Date.now();
for (let i = 0; i < SO_LAN; i++) {
  await dungChung.$queryRaw`SELECT 1`;
}
const msecDung = Date.now() - batDauDung;

console.log(`  ❌ Tạo client MỚI mỗi lần (${SO_LAN} lần) : ${String(msecSai).padStart(6)} ms`);
console.log(`  ✅ Dùng chung MỘT client (${SO_LAN} lần)  : ${String(msecDung).padStart(6)} ms`);
console.log(`  → chậm gấp ${(msecSai / Math.max(msecDung, 1)).toFixed(0)} lần\n`);
console.log(`  Mỗi kết nối mới phải: bắt tay TCP → xác thực → cấp phát bộ nhớ ở Postgres.`);
console.log(`  Pool giữ sẵn kết nối để tái sử dụng — đó là toàn bộ lý do nó tồn tại.\n`);

// ═══════════════════════════════════════════════════════════════
console.log('═══ 3. Pool LỚN HƠN không phải lúc nào cũng NHANH HƠN ═══\n');

for (const max of [20, 50, 120]) {
  const c = taoClient(max);
  try {
    await doSongSong(`pool = ${String(max).padStart(3)} kết nối`, c, 100);
  } catch (err) {
    // Vượt max_connections của Postgres → CHÍNH LÀ bài học của phần này
    const thongDiep = /too many clients/.test(err.message)
      ? 'too many clients already  ← chạm trần max_connections'
      : (err.meta?.driverAdapterError?.cause?.kind ?? err.code ?? 'lỗi');
    console.log(`  pool = ${String(max).padStart(3)} kết nối                   🚨 ${thongDiep}`);
  }
  await c.$disconnect().catch(() => {});
}

console.log(`
  Postgres mặc định chỉ cho tối đa 100 kết nối (tham số max_connections).
  Mỗi kết nối tốn RAM ở phía Postgres và một tiến trình hệ điều hành.

  Pool quá lớn thì:
    · vượt max_connections → lỗi "too many clients already"
    · Postgres bận chuyển đổi ngữ cảnh nhiều hơn là làm việc thật

  CÔNG THỨC THAM KHẢO:  pool_size = (số nhân CPU × 2) + số đĩa
  Với hầu hết API: 10–20 là hợp lý. ĐO rồi mới chỉnh.
`);

// ═══════════════════════════════════════════════════════════════
console.log('═══ 4. Khi pool CẠN — điều gì xảy ra ═══\n');

const nho = taoClient(2);
await nho.$queryRaw`SELECT 1`;

// Giữ chặt cả 2 kết nối bằng transaction dài
const giuKetNoi = [
  nho.$transaction(async (tx) => { await tx.$queryRaw`SELECT pg_sleep(2)::text AS x`; }, { timeout: 15000 }),
  nho.$transaction(async (tx) => { await tx.$queryRaw`SELECT pg_sleep(2)::text AS x`; }, { timeout: 15000 }),
];

await new Promise((r) => setTimeout(r, 200));

const batDauCho = Date.now();
await nho.$queryRaw`SELECT 1`;   // ← phải CHỜ tới khi có kết nối rảnh
const msecCho = Date.now() - batDauCho;

await Promise.all(giuKetNoi);
await nho.$disconnect();

console.log(`  Pool có 2 kết nối, cả 2 đang bị transaction giữ 2 giây.`);
console.log(`  Một truy vấn ĐƠN GIẢN (SELECT 1) phải chờ: ${msecCho} ms\n`);
console.log(`  → Đây là lý do transaction dài NGUY HIỂM: nó không chỉ chậm cho`);
console.log(`     người gọi nó, mà làm TẮC NGHẼN mọi request khác.`);
console.log(`  → Nối lại buổi 19: luôn đặt timeout cho transaction.\n`);

console.log(`TỔNG KẾT

  1. LUÔN dùng MỘT PrismaClient cho cả ứng dụng.
     new PrismaClient() trong file route = mỗi lần import là một pool mới.

  2. Pool quá NHỎ  → request xếp hàng, API chậm dù database rảnh.
     Pool quá LỚN  → vượt max_connections, Postgres nghẽn.

  3. Transaction dài giữ kết nối → làm cạn pool → tắc nghẽn toàn hệ thống.

  4. Khi chạy NHIỀU BẢN SAO server (buổi 44):
     tổng kết nối = số bản sao × pool_size.
     4 bản sao × pool 20 = 80 kết nối. Gần chạm trần 100 rồi.
     → Đó là lúc cần PgBouncer (connection pooler bên ngoài).
`);
