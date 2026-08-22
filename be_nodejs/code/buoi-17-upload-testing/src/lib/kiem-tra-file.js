/**
 * Buổi 17 — Kiểm tra file upload cho AN TOÀN.
 *
 * BA ĐIỀU KHÔNG BAO GIỜ ĐƯỢC TIN TỪ CLIENT:
 *   1. Tên file      (có thể chứa ../../ để thoát thư mục)
 *   2. Kiểu MIME     (client tự khai, muốn khai gì cũng được)
 *   3. Phần mở rộng  (đổi tên .exe thành .jpg là xong)
 */

import { extname, basename } from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * "Magic bytes" — vài byte đầu tiên của file, do ĐỊNH DẠNG quy định.
 * Đây là thứ DUY NHẤT đáng tin để biết file thật sự là gì.
 *
 * Kẻ tấn công đổi tên virus.exe thành anh.jpg và khai
 * Content-Type: image/jpeg — nhưng magic bytes thì không giả được
 * mà không phá hỏng chính file đó.
 */
const CHU_KY = [
  { loai: 'image/jpeg', duoi: '.jpg', bytes: [0xff, 0xd8, 0xff] },
  { loai: 'image/png', duoi: '.png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { loai: 'image/gif', duoi: '.gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { loai: 'application/pdf', duoi: '.pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  // WEBP: "RIFF" ở byte 0-3, "WEBP" ở byte 8-11 → cần kiểm tra ở hai vị trí
  { loai: 'image/webp', duoi: '.webp', bytes: [0x52, 0x49, 0x46, 0x46], boSung: { viTri: 8, bytes: [0x57, 0x45, 0x42, 0x50] } },
];

/**
 * Đọc magic bytes để xác định kiểu file THẬT.
 * @returns {{loai: string, duoi: string} | null}
 */
export function nhanDangKieuThat(buffer) {
  for (const ck of CHU_KY) {
    const khop = ck.bytes.every((b, i) => buffer[i] === b);
    if (!khop) continue;

    if (ck.boSung) {
      const khopBoSung = ck.boSung.bytes.every((b, i) => buffer[ck.boSung.viTri + i] === b);
      if (!khopBoSung) continue;
    }

    return { loai: ck.loai, duoi: ck.duoi };
  }
  return null;
}

/**
 * Sinh tên file AN TOÀN, không dùng lại tên do client gửi.
 *
 * Vì sao không giữ tên gốc? Ba lý do:
 *   1. Path traversal: tên "../../etc/passwd" ghi đè file hệ thống
 *   2. Trùng tên: hai người upload "anh.jpg" thì đè nhau
 *   3. Lộ thông tin: tên file có thể chứa dữ liệu riêng tư
 */
export function sinhTenAnToan(duoiThat) {
  return `${Date.now()}-${randomUUID()}${duoiThat}`;
}

/**
 * Làm sạch tên file gốc để LƯU LÀM METADATA (hiển thị cho người dùng),
 * KHÔNG dùng làm tên file thật trên đĩa.
 */
export function lamSachTenGoc(tenGoc) {
  // basename() cắt bỏ mọi thành phần đường dẫn → chống path traversal.
  // '../../etc/passwd'  →  'passwd'
  // 'C:\\Windows\\a.txt' →  tuỳ hệ điều hành, nên lọc thêm bên dưới
  let sach = basename(tenGoc ?? '');

  // Loại bỏ ký tự nguy hiểm còn sót và ký tự điều khiển
  sach = sach.replace(/[/\\:*?"<>|]/g, '_');
  // eslint-disable-next-line no-control-regex
  sach = sach.replace(/[\u0000-\u001f]/g, '');
  sach = sach.trim();

  if (!sach || sach === '.' || sach === '..') sach = 'khong-ten';
  return sach.slice(0, 120);
}

export const DUOI_NGUY_HIEM = [
  '.html', '.htm', '.svg', '.xml',   // chứa được script → XSS lưu trữ
  '.js', '.mjs', '.php', '.jsp',      // thực thi được trên máy chủ
  '.exe', '.sh', '.bat', '.cmd',
];

/**
 * Kiểm tra tổng thể một file upload.
 * @returns {{hopLe: true, loai, duoi, tenAnToan, tenGoc} | {hopLe: false, lyDo}}
 */
export function kiemTraFile(file, { kieuChoPhep, kichThuocToiDa }) {
  if (!file || !file.buffer || file.buffer.length === 0) {
    return { hopLe: false, lyDo: 'File rỗng' };
  }

  if (file.buffer.length > kichThuocToiDa) {
    return {
      hopLe: false,
      lyDo: `File vượt quá ${Math.round(kichThuocToiDa / 1024)} KB`,
    };
  }

  const that = nhanDangKieuThat(file.buffer);
  if (!that) {
    return { hopLe: false, lyDo: 'Không nhận dạng được định dạng file' };
  }

  if (!kieuChoPhep.includes(that.loai)) {
    return {
      hopLe: false,
      lyDo: `Chỉ chấp nhận: ${kieuChoPhep.join(', ')}. File này thực chất là ${that.loai}`,
    };
  }

  // Đối chiếu lời khai của client với sự thật — để GHI LOG,
  // không phải để quyết định. Quyết định luôn dựa trên magic bytes.
  const khaiBaoDung = file.mimetype === that.loai;

  return {
    hopLe: true,
    loai: that.loai,
    duoi: that.duoi,
    tenAnToan: sinhTenAnToan(that.duoi),
    tenGoc: lamSachTenGoc(file.originalname),
    clientKhaiDung: khaiBaoDung,
    clientKhai: file.mimetype,
  };
}
