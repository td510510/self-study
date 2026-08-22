/**
 * Buổi 14 — QUYẾT ĐỊNH THIẾT KẾ QUAN TRỌNG NHẤT CỦA MONGODB:
 *           nhúng (embed) hay tham chiếu (reference)?
 *
 * Chạy:  node --env-file=.env src/01-nhung-vs-tham-chieu.js
 */

import mongoose from 'mongoose';
import { ketNoi, dongKetNoi } from './ket-noi.js';

await ketNoi();
await mongoose.connection.dropDatabase();

// ═══════════════════════════════════════════════════════════════
// CÁCH 1: NHÚNG — todo nằm BÊN TRONG document user
// ═══════════════════════════════════════════════════════════════
const userNhungSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  ten: { type: String, required: true },

  // Mảng con nằm NGAY TRONG document user.
  // Ở Postgres điều này BẤT KHẢ THI — phải tách bảng.
  todos: [
    {
      tieuDe: { type: String, required: true },
      xong: { type: Boolean, default: false },
      uuTien: { type: String, enum: ['thap', 'trung', 'cao'], default: 'trung' },
    },
  ],
});

const UserNhung = mongoose.model('UserNhung', userNhungSchema);

const mai = await UserNhung.create({
  email: 'mai@example.com',
  ten: 'Mai Anh',
  todos: [
    { tieuDe: 'Học MongoDB', uuTien: 'cao' },
    { tieuDe: 'So sánh với Postgres', uuTien: 'trung' },
  ],
});

console.log('=== NHÚNG: một document chứa tất cả ===');
console.log(JSON.stringify(mai.toObject(), null, 2));

console.log('\n→ Lấy user KÈM todo chỉ tốn 1 lần đọc, KHÔNG cần join:');
const doc = await UserNhung.findOne({ email: 'mai@example.com' });
console.log(`   ${doc.ten} có ${doc.todos.length} việc\n`);

// ═══════════════════════════════════════════════════════════════
// CÁCH 2: THAM CHIẾU — giống hệt tư duy quan hệ ở buổi 12
// ═══════════════════════════════════════════════════════════════
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  ten: { type: String, required: true },
});

const todoSchema = new mongoose.Schema(
  {
    tieuDe: { type: String, required: true, trim: true, maxlength: 200 },
    xong: { type: Boolean, default: false },
    uuTien: { type: String, enum: ['thap', 'trung', 'cao'], default: 'trung' },

    // Tương đương khoá ngoại userId của Postgres
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true } // tự thêm createdAt / updatedAt — như @default(now()) và @updatedAt
);

const User = mongoose.model('User', userSchema);
const Todo = mongoose.model('Todo', todoSchema);

const huy = await User.create({ email: 'huy@example.com', ten: 'Quốc Huy' });
await Todo.insertMany([
  { tieuDe: 'Thiết kế schema', uuTien: 'cao', user: huy._id },
  { tieuDe: 'Viết index', uuTien: 'trung', user: huy._id },
]);

console.log('=== THAM CHIẾU: hai collection riêng ===');

// populate() ≈ include của Prisma — và cũng tốn 2 lần đọc y hệt
const dsTodo = await Todo.find({ user: huy._id }).populate('user', 'ten email');
console.log(JSON.stringify(dsTodo.map((t) => t.toObject()), null, 2));

// ═══════════════════════════════════════════════════════════════
// KIỂM CHỨNG: MongoDB KHÔNG có khoá ngoại thật
// ═══════════════════════════════════════════════════════════════
console.log('\n=== ⚠️ KHÔNG CÓ RÀNG BUỘC KHOÁ NGOẠI ===');

const idMa = new mongoose.Types.ObjectId(); // id của một user KHÔNG TỒN TẠI
const todoMoCoi = await Todo.create({ tieuDe: 'Todo mồ côi', user: idMa });
console.log('Tạo todo trỏ tới user không tồn tại →', todoMoCoi._id, '✅ THÀNH CÔNG');
console.log('   Postgres sẽ TỪ CHỐI việc này (lỗi P2003 khoá ngoại).');

const moCoi = await Todo.findById(todoMoCoi._id).populate('user');
console.log('   populate user không tồn tại →', moCoi.user, '← null, không báo lỗi');

// Xoá user cũng KHÔNG tự xoá todo (không có Cascade)
await User.deleteOne({ _id: huy._id });
const conLai = await Todo.countDocuments({ user: huy._id });
console.log(`\nXoá user Quốc Huy → todo còn lại: ${conLai} (KHÔNG tự xoá theo)`);
console.log('   Postgres với onDelete: Cascade sẽ xoá sạch. MongoDB thì KHÔNG.');
console.log('   → Toàn vẹn dữ liệu là TRÁCH NHIỆM CỦA CODE, không phải database.');

await dongKetNoi();
console.log('\n✅ Xong');
