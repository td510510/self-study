/**
 * Buổi 14 — Ba cái bẫy khi dùng MongoDB sai chỗ.
 *
 * Chạy:  node --env-file=.env src/02-cai-bay-nosql.js
 */

import mongoose from 'mongoose';
import { ketNoi, dongKetNoi } from './ket-noi.js';

await ketNoi();
await mongoose.connection.dropDatabase();

// ═══════════════════════════════════════════════════════════════
// BẪY 1: NHÂN BẢN DỮ LIỆU → BẤT THƯỜNG KHI CẬP NHẬT
// ═══════════════════════════════════════════════════════════════
console.log('═══ BẪY 1: dữ liệu nhân bản, sửa một chỗ sót chỗ khác ═══\n');

// Thiết kế "tiện": nhúng thông tin tác giả vào từng bài viết
const baiVietSchema = new mongoose.Schema({
  tieuDe: String,
  tacGia: {
    // ⚠️ Cùng một người, thông tin bị CHÉP LẠI ở MỌI bài viết
    ten: String,
    email: String,
  },
});
const BaiViet = mongoose.model('BaiViet', baiVietSchema);

await BaiViet.insertMany([
  { tieuDe: 'Bài 1', tacGia: { ten: 'Mai Anh', email: 'mai@cu.com' } },
  { tieuDe: 'Bài 2', tacGia: { ten: 'Mai Anh', email: 'mai@cu.com' } },
  { tieuDe: 'Bài 3', tacGia: { ten: 'Mai Anh', email: 'mai@cu.com' } },
]);

console.log('Mai Anh có 3 bài viết, email được chép lại 3 lần.');
console.log('Giờ cô ấy đổi email...\n');

// Lập trình viên chỉ nhớ sửa một bài
await BaiViet.updateOne({ tieuDe: 'Bài 1' }, { 'tacGia.email': 'mai@moi.com' });

const cacBai = await BaiViet.find({}, 'tieuDe tacGia.email');
console.table(cacBai.map((b) => ({ bai: b.tieuDe, email: b.tacGia.email })));
console.log('→ DỮ LIỆU KHÔNG NHẤT QUÁN. Cùng một người, hai email khác nhau.');
console.log('   Ở Postgres điều này KHÔNG THỂ xảy ra — email chỉ nằm ở MỘT chỗ.\n');

// Cách sửa đúng: phải nhớ cập nhật TẤT CẢ
const kq = await BaiViet.updateMany({ 'tacGia.ten': 'Mai Anh' }, { 'tacGia.email': 'mai@moi.com' });
console.log(`Sửa lại toàn bộ: đã cập nhật ${kq.modifiedCount} bài.`);
console.log('→ Nhưng bạn phải NHỚ làm điều đó. Database không nhắc bạn.\n');

// ═══════════════════════════════════════════════════════════════
// BẪY 2: MẢNG NHÚNG PHÌNH TO KHÔNG GIỚI HẠN
// ═══════════════════════════════════════════════════════════════
console.log('═══ BẪY 2: mảng nhúng phình to ═══\n');

const baiCoBinhLuanSchema = new mongoose.Schema({
  tieuDe: String,
  binhLuan: [{ noiDung: String, nguoiViet: String }], // ⚠️ không có giới hạn
});
const BaiCoBinhLuan = mongoose.model('BaiCoBinhLuan', baiCoBinhLuanSchema);

const bai = await BaiCoBinhLuan.create({ tieuDe: 'Bài viral', binhLuan: [] });

// Mô phỏng bài viết được nhiều bình luận
for (let i = 0; i < 5000; i++) {
  await BaiCoBinhLuan.updateOne(
    { _id: bai._id },
    { $push: { binhLuan: { noiDung: `Bình luận số ${i}`, nguoiViet: `user${i}` } } }
  );
  if (i % 2500 === 0 && i > 0) {
    const stats = await mongoose.connection.db
      .collection('baicobinhluans')
      .findOne({ _id: bai._id });
    const kb = (JSON.stringify(stats).length / 1024).toFixed(0);
    console.log(`  sau ${i} bình luận → document nặng ~${kb} KB`);
  }
}

const cuoi = await mongoose.connection.db.collection('baicobinhluans').findOne({ _id: bai._id });
const kbCuoi = (JSON.stringify(cuoi).length / 1024).toFixed(0);
console.log(`  sau 5000 bình luận → ~${kbCuoi} KB`);
console.log(`
→ MongoDB giới hạn MỘT document tối đa 16 MB.
  Mỗi lần đọc bài viết là kéo về TOÀN BỘ mảng bình luận,
  kể cả khi chỉ cần hiển thị tiêu đề.
  → Dữ liệu tăng KHÔNG GIỚI HẠN thì phải TÁCH RA collection riêng.
`);

// ═══════════════════════════════════════════════════════════════
// BẪY 3: SCHEMA CHỈ TỒN TẠI Ở TẦNG ỨNG DỤNG
// ═══════════════════════════════════════════════════════════════
console.log('═══ BẪY 3: schema của Mongoose KHÔNG nằm trong database ═══\n');

const sanPhamSchema = new mongoose.Schema({
  ten: { type: String, required: true },
  gia: { type: Number, required: true, min: 0 },
});
const SanPham = mongoose.model('SanPham', sanPhamSchema);

// Qua Mongoose: bị chặn đúng như mong đợi
try {
  await SanPham.create({ ten: 'Áo', gia: -100 });
} catch (err) {
  console.log('Qua Mongoose, giá âm → bị chặn:', err.errors.gia.message);
}

// Nhưng ghi THẲNG bằng driver — bỏ qua Mongoose hoàn toàn
await mongoose.connection.db.collection('sanphams').insertOne({
  ten: 'Quần',
  gia: -999,           // giá âm
  mauSac: 'xanh',      // trường không có trong schema
  // thiếu luôn cũng được
});

const rac = await SanPham.findOne({ ten: 'Quần' });
console.log('Ghi thẳng bằng driver → dữ liệu bẩn ĐÃ VÀO DATABASE:');
console.log('  ', JSON.stringify(rac.toObject()));
console.log(`
→ Mongoose validate ở TẦNG ỨNG DỤNG. Bất kỳ ai (script, đồng đội, tool khác)
  ghi thẳng vào database đều bỏ qua được.
  Postgres thì NOT NULL / CHECK / FOREIGN KEY nằm TRONG database —
  không ai lách được, kể cả DBA gõ SQL tay.

  MongoDB 5+ có JSON Schema validation ở tầng database, nhưng phải
  CHỦ ĐỘNG bật; mặc định là không có.
`);

await dongKetNoi();
console.log('✅ Xong');
