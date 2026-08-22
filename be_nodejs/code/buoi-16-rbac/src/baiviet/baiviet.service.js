/**
 * Buổi 16 — Nghiệp vụ bài viết, có phân quyền.
 *
 * ĐIỂM DẠY QUAN TRỌNG NHẤT:
 *   Thứ tự kiểm tra luôn là  TÌM  →  KIỂM QUYỀN  →  HÀNH ĐỘNG.
 *   Không bao giờ tin tưởng id do client gửi lên.
 */

import { prisma } from '../lib/prisma.js';
import { loi } from '../lib/errors.js';
import { batBuocQuyen, duocPhep } from '../lib/quyen.js';

/**
 * ⚠️ Hàm này là TRÁI TIM của phân quyền theo chủ sở hữu.
 *
 * Nó luôn NẠP bản ghi từ database trước, rồi mới so chủ sở hữu.
 * Không bao giờ tin `tacGiaId` do client gửi lên trong body.
 */
async function timVaKiemQuyen(id, nguoiDung, hanhDong) {
  const bai = await prisma.baiViet.findUnique({ where: { id } });

  // Không tồn tại → 404 trước, chưa cần bàn tới quyền
  if (!bai) throw loi.khongTimThay(`Không có bài viết id = ${id}`);

  batBuocQuyen(nguoiDung, hanhDong, bai);
  return bai;
}

export async function danhSach(nguoiDung, { chiCuaToi } = {}) {
  // Người thường chỉ thấy bài ĐÃ ĐĂNG của người khác, cộng toàn bộ bài của mình.
  // Admin và biên tập thấy tất cả.
  const thayTatCa = duocPhep(nguoiDung, 'baiviet:sua', null) === true;

  const where = chiCuaToi
    ? { tacGiaId: nguoiDung.id }
    : thayTatCa
      ? {}
      : { OR: [{ daDang: true }, { tacGiaId: nguoiDung.id }] };

  return prisma.baiViet.findMany({
    where,
    orderBy: { taoLuc: 'desc' },
    select: {
      id: true,
      tieuDe: true,
      daDang: true,
      tacGiaId: true,
      tacGia: { select: { ten: true } },
    },
  });
}

export async function layMot(id, nguoiDung) {
  const bai = await prisma.baiViet.findUnique({
    where: { id },
    include: { tacGia: { select: { id: true, ten: true } } },
  });

  if (!bai) throw loi.khongTimThay(`Không có bài viết id = ${id}`);

  // Bài chưa đăng: chỉ tác giả hoặc người có quyền 'any' mới xem được.
  //
  // ⚠️ Trả 404 chứ KHÔNG trả 403 — nếu trả 403, kẻ tấn công biết được
  // bài đó TỒN TẠI. Với nội dung riêng tư, chính sự tồn tại đã là thông tin.
  if (!bai.daDang && !duocPhep(nguoiDung, 'baiviet:sua', bai)) {
    throw loi.khongTimThay(`Không có bài viết id = ${id}`);
  }

  return bai;
}

export async function tao(nguoiDung, duLieu) {
  batBuocQuyen(nguoiDung, 'baiviet:tao');

  return prisma.baiViet.create({
    data: {
      tieuDe: duLieu.tieuDe,
      noiDung: duLieu.noiDung,
      // ⚠️ tacGiaId LẤY TỪ TOKEN, tuyệt đối không lấy từ body.
      // Nếu lấy từ body, kẻ tấn công gửi { tacGiaId: 1 } là tạo bài
      // đứng tên người khác. Đây là lỗ hổng mass assignment (buổi 09).
      tacGiaId: nguoiDung.id,
    },
  });
}

export async function sua(id, nguoiDung, duLieu) {
  await timVaKiemQuyen(id, nguoiDung, 'baiviet:sua');

  return prisma.baiViet.update({
    where: { id },
    // Chỉ nhận các trường được phép — schema zod đã lọc, đây là lớp thứ hai
    data: { tieuDe: duLieu.tieuDe, noiDung: duLieu.noiDung },
  });
}

export async function dang(id, nguoiDung) {
  await timVaKiemQuyen(id, nguoiDung, 'baiviet:dang');
  return prisma.baiViet.update({ where: { id }, data: { daDang: true } });
}

export async function xoa(id, nguoiDung) {
  await timVaKiemQuyen(id, nguoiDung, 'baiviet:xoa');
  await prisma.baiViet.delete({ where: { id } });
}
