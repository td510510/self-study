/**
 * COMPOSITION ROOT — nơi DUY NHẤT biết mọi mảnh ghép với nhau thế nào.
 *
 * Mọi `new` của lớp cụ thể dồn về đây. Phần còn lại của hệ thống chỉ nhận
 * đồ đã lắp sẵn. Đây chính là việc NestJS làm tự động (buổi 28–29):
 * `@Module({ providers: [...] })` là một composition root viết bằng khai báo.
 *
 * Tự viết một lần bằng tay để thấy framework KHÔNG có phép màu.
 */

import { ViDienTuSdk, TheQuocTeSdk } from './thanh-toan/sdk-gia-lap.js';
import { ViDienTuAdapter, TheQuocTeAdapter } from './thanh-toan/adapter.js';
import { dangKyCong, taoCong } from './thanh-toan/nha-may.js';
import { voiThuLai, voiDoThoiGian } from './lib/trang-tri.js';
import { BusSuKien } from './lib/su-kien.js';
import { KhoTrongBoNho } from './kho.repository.js';
import { DonHangService } from './don-hang.service.js';

export function taoUngDung({ cachThanhToan, viLoiLanDau = 0, logger = console }) {
  const soDo = [];

  // Đăng ký cổng MỘT lần. Cổng thứ ba = thêm đúng một dòng ở đây.
  dangKyCongNeuChua('vi-dien-tu', ({ loiLanDau }) => new ViDienTuAdapter(new ViDienTuSdk({ loiLanDau })));
  dangKyCongNeuChua('the-quoc-te', () => new TheQuocTeAdapter(new TheQuocTeSdk()));

  // Xếp chồng decorator: đo thời gian bọc NGOÀI retry → đo cả thời gian thử lại
  const goc = taoCong(cachThanhToan, { loiLanDau: viLoiLanDau });
  const cong = voiDoThoiGian(voiThuLai(goc, { logger }), {
    ghiNhan: (s) => soDo.push(s),
  });

  const bus = new BusSuKien({ logger });
  bus.dangKy('don-hang.da-dat', async (d) => logger.log(`  [email] gửi tới ${d.email}: đơn ${d.maGiaoDich}`));
  bus.dangKy('don-hang.da-dat', async (d) => logger.log(`  [thống kê] +${d.soTien}đ doanh thu`));

  const kho = new KhoTrongBoNho([
    { id: 'ao-thun', ten: 'Áo thun', gia: 150_000, ton: 5 },
    { id: 'mu', ten: 'Mũ', gia: 90_000, ton: 0 },
  ]);

  return { service: new DonHangService({ kho, cong, bus }), bus, kho, soDo };
}

// Registry là module-level (dùng chung cả tiến trình) nên chỉ đăng ký lần đầu.
const daDangKy = new Set();
function dangKyCongNeuChua(ten, tao) {
  if (daDangKy.has(ten)) return;
  dangKyCong(ten, tao);
  daDangKy.add(ten);
}
