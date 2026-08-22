/**
 * Buổi 16 — Tự khai thác lỗ hổng IDOR, rồi xem bản đã vá.
 *
 * IDOR = Insecure Direct Object Reference.
 * Nằm trong nhóm "Broken Access Control" — hạng MỘT của OWASP Top 10.
 *
 * Chạy:  node --env-file=.env src/demo-idor.js
 */

import express from 'express';
import request from 'supertest';
import { prisma } from './lib/prisma.js';
import { bamMatKhau } from './auth/mat-khau.js';
import { taoAccessToken } from './auth/token.js';
import { yeuCauDangNhap } from './auth/auth.middleware.js';
import { batBuocQuyen } from './lib/quyen.js';
import { HttpError } from './lib/errors.js';

// ── Dựng dữ liệu ────────────────────────────────────────────────
await prisma.user.deleteMany();

const hash = await bamMatKhau('matkhau-du-dai');
const an = await prisma.user.create({
  data: { email: 'an@demo.com', ten: 'An', matKhauHash: hash },
});
const kẻTấnCông = await prisma.user.create({
  data: { email: 'hacker@demo.com', ten: 'Kẻ tấn công', matKhauHash: hash },
});

const baiCuaAn = await prisma.baiViet.create({
  data: { tieuDe: 'Nhật ký riêng của An', noiDung: 'Nội dung riêng tư', tacGiaId: an.id },
});

const tokenTanCong = taoAccessToken(kẻTấnCông);

// ── Bộ xử lý lỗi dùng chung ─────────────────────────────────────
function themXuLyLoi(app) {
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.statusCode).json({ loi: err.message });
    res.status(500).json({ loi: 'Lỗi máy chủ' });
  });
  return app;
}

// ═══════════════════════════════════════════════════════════════
// ❌ PHIÊN BẢN CÓ LỖ HỔNG
// ═══════════════════════════════════════════════════════════════
const appHong = express();
appHong.use(express.json());
appHong.use(yeuCauDangNhap());

appHong.patch('/bai-viet/:id', async (req, res) => {
  // ⚠️ LỖ HỔNG: đã kiểm tra ĐĂNG NHẬP nhưng KHÔNG kiểm tra CHỦ SỞ HỮU.
  // Bất kỳ ai đăng nhập đều sửa được bài của bất kỳ ai — chỉ cần biết id.
  //
  // Đây là lỗi cực kỳ phổ biến. Lập trình viên nghĩ:
  // "đã có yeuCauDangNhap() rồi, an toàn rồi."
  // → Nhầm giữa AUTHENTICATION (bạn là ai) và AUTHORIZATION (bạn được làm gì).
  const bai = await prisma.baiViet.update({
    where: { id: Number(req.params.id) },
    data: { tieuDe: req.body.tieuDe },
  });
  res.json(bai);
});
themXuLyLoi(appHong);

// ═══════════════════════════════════════════════════════════════
// ✅ PHIÊN BẢN ĐÃ VÁ
// ═══════════════════════════════════════════════════════════════
const appVa = express();
appVa.use(express.json());
appVa.use(yeuCauDangNhap());

appVa.patch('/bai-viet/:id', async (req, res, next) => {
  try {
    // BƯỚC 1: NẠP bản ghi từ database
    const bai = await prisma.baiViet.findUnique({ where: { id: Number(req.params.id) } });
    if (!bai) throw new HttpError(404, 'Không tìm thấy');

    // BƯỚC 2: KIỂM TRA QUYỀN dựa trên chủ sở hữu THẬT trong database
    batBuocQuyen(req.nguoiDung, 'baiviet:sua', bai);

    // BƯỚC 3: mới được hành động
    const daSua = await prisma.baiViet.update({
      where: { id: bai.id },
      data: { tieuDe: req.body.tieuDe },
    });
    res.json(daSua);
  } catch (err) {
    next(err);
  }
});
themXuLyLoi(appVa);

// ═══════════════════════════════════════════════════════════════
// TẤN CÔNG
// ═══════════════════════════════════════════════════════════════
console.log('Bối cảnh:');
console.log(`  An (id=${an.id}) có bài viết id=${baiCuaAn.id}: "${baiCuaAn.tieuDe}"`);
console.log(`  Kẻ tấn công (id=${kẻTấnCông.id}) có tài khoản HỢP LỆ, đã đăng nhập.`);
console.log(`  Hắn chỉ cần ĐOÁN id bài viết — thường là số tăng dần: 1, 2, 3...\n`);

const doiThanh = 'ĐÃ BỊ CHIẾM QUYỀN';

console.log('═══ ❌ Tấn công phiên bản CÓ LỖ HỔNG ═══\n');
const r1 = await request(appHong)
  .patch(`/bai-viet/${baiCuaAn.id}`)
  .set('Authorization', `Bearer ${tokenTanCong}`)
  .send({ tieuDe: doiThanh });

console.log(`  HTTP ${r1.status}`);
const sauTanCong = await prisma.baiViet.findUnique({ where: { id: baiCuaAn.id } });
console.log(`  Tiêu đề bài của An giờ là: "${sauTanCong.tieuDe}"`);
console.log(`  → ${sauTanCong.tieuDe === doiThanh ? '🚨 BỊ CHIẾM QUYỀN THÀNH CÔNG' : 'an toàn'}\n`);

// Khôi phục để thử tiếp
await prisma.baiViet.update({
  where: { id: baiCuaAn.id },
  data: { tieuDe: 'Nhật ký riêng của An' },
});

console.log('═══ ✅ Tấn công phiên bản ĐÃ VÁ ═══\n');
const r2 = await request(appVa)
  .patch(`/bai-viet/${baiCuaAn.id}`)
  .set('Authorization', `Bearer ${tokenTanCong}`)
  .send({ tieuDe: doiThanh });

console.log(`  HTTP ${r2.status} — ${JSON.stringify(r2.body)}`);
const sauVa = await prisma.baiViet.findUnique({ where: { id: baiCuaAn.id } });
console.log(`  Tiêu đề bài của An: "${sauVa.tieuDe}"`);
console.log(`  → ${sauVa.tieuDe === doiThanh ? '🚨 vẫn bị chiếm' : '✅ ĐÃ CHẶN'}\n`);

console.log(`BÀI HỌC

  Khác biệt giữa hai phiên bản chỉ là BA DÒNG:

      const bai = await prisma.baiViet.findUnique(...);   // NẠP
      if (!bai) throw new HttpError(404, ...);            // TỒN TẠI?
      batBuocQuyen(req.nguoiDung, 'baiviet:sua', bai);    // ĐƯỢC PHÉP?

  Cả hai phiên bản đều CÓ kiểm tra đăng nhập. Nhưng:

      Authentication (xác thực)  = "Bạn là ai?"
      Authorization  (phân quyền) = "Bạn được làm gì với TÀI NGUYÊN NÀY?"

  Có cái thứ nhất KHÔNG có nghĩa là có cái thứ hai.

  Vì sao lỗi này phổ biến đến vậy?
    - Nó KHÔNG gây lỗi khi test bằng tài khoản của chính mình
    - Không có cảnh báo, không có log lỗi
    - Chỉ lộ ra khi ai đó CỐ TÌNH đổi id trên URL

  Quy tắc bất di bất dịch:
    Mỗi khi handler nhận id từ client → phải hỏi
    "người này có quyền trên bản ghi ĐÓ không?"
`);

await prisma.user.deleteMany();
await prisma.$disconnect();
