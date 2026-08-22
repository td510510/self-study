/**
 * Buổi 12 — CRUD đầu tiên với Prisma.
 *
 * Chạy:  node src/01-crud-co-ban.js
 * Xem SQL sinh ra:  PRISMA_LOG=query node src/01-crud-co-ban.js
 */

import { prisma, dongKetNoi } from './prisma.js';

// Dọn sạch để chạy lại được nhiều lần.
// Xoá user là todo bị xoá theo, nhờ onDelete: Cascade trong schema.
await prisma.user.deleteMany();
console.log('— đã dọn dữ liệu cũ —\n');

// ═══════════════════════════════════════════════════════════════
// CREATE
// ═══════════════════════════════════════════════════════════════
const mai = await prisma.user.create({
  data: { email: 'mai@example.com', ten: 'Mai Anh' },
});
console.log('CREATE user:', mai);

// Tạo kèm bản ghi con trong MỘT lời gọi — Prisma tự lo thứ tự insert
const huy = await prisma.user.create({
  data: {
    email: 'huy@example.com',
    ten: 'Quốc Huy',
    todos: {
      create: [
        { tieuDe: 'Học Prisma', uuTien: 'cao' },
        { tieuDe: 'Viết migration', uuTien: 'trung' },
      ],
    },
  },
  include: { todos: true }, // ← yêu cầu trả về cả todo vừa tạo
});
console.log('\nCREATE user kèm todo:', JSON.stringify(huy, null, 2));

// createMany — nhanh hơn nhiều so với gọi create() trong vòng lặp,
// vì nó gộp thành MỘT câu INSERT nhiều dòng.
const ketQua = await prisma.todo.createMany({
  data: [
    { tieuDe: 'Đọc tài liệu index', uuTien: 'thap', userId: mai.id },
    { tieuDe: 'Ôn lại SQL', uuTien: 'cao', userId: mai.id },
    { tieuDe: 'Tập viết test', uuTien: 'trung', userId: mai.id, xong: true },
  ],
});
console.log('\ncreateMany:', ketQua);

// ═══════════════════════════════════════════════════════════════
// READ
// ═══════════════════════════════════════════════════════════════
console.log('\n--- findMany có lọc, sắp xếp, phân trang ---');
const dsTodo = await prisma.todo.findMany({
  where: { xong: false, uuTien: { in: ['cao', 'trung'] } },
  orderBy: [{ uuTien: 'asc' }, { taoLuc: 'desc' }],
  take: 10,
  skip: 0,
  select: { id: true, tieuDe: true, uuTien: true }, // chỉ lấy cột cần
});
console.table(dsTodo);

console.log('--- findUnique (dùng khoá chính hoặc cột @unique) ---');
console.log(await prisma.user.findUnique({ where: { email: 'mai@example.com' } }));

console.log('\n--- đếm & gộp nhóm ---');
console.log('tổng todo:', await prisma.todo.count());
console.log(
  'theo ưu tiên:',
  await prisma.todo.groupBy({ by: ['uuTien'], _count: { _all: true } })
);

// ═══════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════
console.log('\n--- update ---');
const daSua = await prisma.todo.update({
  where: { id: huy.todos[0].id },
  data: { xong: true },
});
console.log('suaLuc tự cập nhật nhờ @updatedAt:', daSua.suaLuc);

// updateMany trả về SỐ LƯỢNG bản ghi bị ảnh hưởng, không trả bản ghi
console.log('updateMany:', await prisma.todo.updateMany({
  where: { userId: mai.id, uuTien: 'thap' },
  data: { uuTien: 'trung' },
}));

// upsert: có thì sửa, không có thì tạo — chỉ MỘT lần đi database
const upserted = await prisma.user.upsert({
  where: { email: 'moi@example.com' },
  update: { ten: 'Tên đã đổi' },
  create: { email: 'moi@example.com', ten: 'Người Mới' },
});
console.log('upsert:', upserted.ten);

// ═══════════════════════════════════════════════════════════════
// DELETE
// ═══════════════════════════════════════════════════════════════
console.log('\n--- delete ---');
console.log('xoá 1 todo:', (await prisma.todo.delete({ where: { id: daSua.id } })).tieuDe);

// Xoá user → todo của họ bị xoá theo nhờ onDelete: Cascade
const truoc = await prisma.todo.count();
await prisma.user.delete({ where: { id: huy.id } });
const sau = await prisma.todo.count();
console.log(`Xoá user Quốc Huy → số todo: ${truoc} → ${sau} (Cascade tự xoá theo)`);

// ═══════════════════════════════════════════════════════════════
// LỖI HAY GẶP
// ═══════════════════════════════════════════════════════════════
console.log('\n--- mã lỗi Prisma ---');
try {
  await prisma.user.create({ data: { email: 'mai@example.com', ten: 'Trùng email' } });
} catch (err) {
  // P2002 = vi phạm ràng buộc unique → API nên trả 409 Conflict
  console.log('mã lỗi:', err.code);

  // ⚠️ BẪY PHIÊN BẢN: hầu hết tài liệu trên mạng bảo đọc err.meta.target.
  // Với Prisma 7 + driver adapter, chỗ đó là undefined —
  // tên cột nằm sâu hơn hẳn. Luôn tự in ra meta để kiểm chứng.
  console.log('err.meta.target       =', err.meta?.target, '← tài liệu cũ nói ở đây');
  console.log(
    'chỗ THẬT (Prisma 7)   =',
    err.meta?.driverAdapterError?.cause?.constraint?.fields
  );
}

try {
  await prisma.todo.update({ where: { id: 999999 }, data: { xong: true } });
} catch (err) {
  // P2025 = không tìm thấy bản ghi → API nên trả 404
  console.log(`P2025 (không tìm thấy): ${err.code}`);
}

await dongKetNoi();
console.log('\n✅ Xong');
