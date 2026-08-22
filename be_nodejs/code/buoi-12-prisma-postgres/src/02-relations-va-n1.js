/**
 * Buổi 12 — Quan hệ, và vấn đề N+1.
 *
 * Điểm đặc biệt: file này ĐẾM SỐ CÂU TRUY VẤN THẬT SỰ gửi xuống database,
 * nên vấn đề N+1 không còn là lý thuyết mà là một con số.
 *
 * Chạy:  node src/02-relations-va-n1.js
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Client riêng cho bài này: phát sự kiện 'query' để ta đếm được.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  log: [{ emit: 'event', level: 'query' }],
});

let demQuery = 0;
prisma.$on('query', () => demQuery++);

/** Đo một đoạn code: bao nhiêu câu truy vấn, mất bao lâu. */
async function do_(nhan, viec) {
  demQuery = 0;
  const batDau = Date.now();
  await viec();
  const msec = Date.now() - batDau;
  console.log(`  ${nhan.padEnd(40)} ${String(demQuery).padStart(3)} query  ${String(msec).padStart(5)}ms`);
  return demQuery;
}

// ── Chuẩn bị dữ liệu ────────────────────────────────────────────
const SO_USER = 30;
const TODO_MOI_USER = 5;

await prisma.user.deleteMany();
await prisma.user.createMany({
  data: Array.from({ length: SO_USER }, (_, i) => ({
    email: `user${i}@example.com`,
    ten: `Người dùng ${i}`,
  })),
});

const users = await prisma.user.findMany();
await prisma.todo.createMany({
  data: users.flatMap((u, i) =>
    Array.from({ length: TODO_MOI_USER }, (_, j) => ({
      tieuDe: `Việc ${j} của ${u.ten}`,
      // Trộn có chủ đích để các phép lọc bên dưới cho ra số liệu có ý nghĩa
      uuTien: ['thap', 'trung', 'cao'][(i + j) % 3],
      xong: (i + j) % 4 !== 0,
      userId: u.id,
    }))
  ),
});

console.log(`Dữ liệu: ${SO_USER} user × ${TODO_MOI_USER} todo = ${SO_USER * TODO_MOI_USER} todo\n`);

// ═══════════════════════════════════════════════════════════════
console.log('❌ CÁCH SAI — N+1 query');
const n1 = await do_('vòng lặp gọi findMany cho từng user', async () => {
  const ds = await prisma.user.findMany(); //          ← 1 query
  for (const u of ds) {
    await prisma.todo.findMany({ where: { userId: u.id } }); // ← 1 query MỖI user
  }
});

console.log('\n✅ CÁCH ĐÚNG — include');
const inc = await do_('Prisma tự gộp', async () =>
  prisma.user.findMany({ include: { todos: true } })
);

console.log('\n✅ TỐI ƯU HƠN — select chỉ cột cần');
await do_('ít dữ liệu qua mạng hơn', async () =>
  prisma.user.findMany({
    select: { ten: true, todos: { select: { tieuDe: true }, where: { xong: false } } },
  })
);

console.log(`\n  → N+1 tốn ${n1} query, include chỉ tốn ${inc} query.`);
console.log(`     Gấp ${(n1 / inc).toFixed(0)} lần. Với 1000 user thì là 1001 so với 2.\n`);

// ═══════════════════════════════════════════════════════════════
console.log('--- _count: đếm todo của mỗi user mà KHÔNG tải todo về ---');
const vaiUser = await prisma.user.findMany({
  take: 3,
  select: { ten: true, _count: { select: { todos: true } } },
});
console.table(vaiUser.map((u) => ({ ten: u.ten, soTodo: u._count.todos })));

console.log('--- lọc theo điều kiện của bản ghi CON ---');
console.log(
  'user còn việc ưu tiên CAO chưa xong :',
  await prisma.user.count({ where: { todos: { some: { uuTien: 'cao', xong: false } } } })
);
console.log(
  'user đã xong HẾT mọi việc          :',
  await prisma.user.count({ where: { todos: { every: { xong: true } } } })
);
console.log(
  'user KHÔNG có việc ưu tiên cao nào :',
  await prisma.user.count({ where: { todos: { none: { uuTien: 'cao' } } } })
);

await prisma.$disconnect();
console.log('\n✅ Xong');
