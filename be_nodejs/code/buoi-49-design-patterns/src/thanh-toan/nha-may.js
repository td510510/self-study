/**
 * FACTORY + REGISTRY — tạo đúng cổng thanh toán theo tên.
 *
 * So với chuỗi if/else trong truoc-refactor.js:
 *   · Thêm cổng mới = GỌI dangKyCong(), không SỬA hàm có sẵn.
 *     Đó chính là chữ O trong SOLID: mở để mở rộng, đóng để sửa đổi.
 *   · Tên không hợp lệ bị bắt ở MỘT chỗ duy nhất.
 *
 * ⚠️ LỖI GẶP THẬT KHI SOẠN BÀI: bản đầu đăng ký kiểu
 *     dangKyCong('vi-dien-tu', () => new ViDienTuAdapter(new ViDienTuSdk({ loiLanDau })))
 * `bang` sống suốt tiến trình (module chỉ chạy MỘT lần — buổi 03), nên closure
 * giữ mãi `loiLanDau` của LẦN GỌI ĐẦU TIÊN. Mọi cấu hình sau bị lờ đi im lặng.
 * → Registry chỉ nên giữ CÁCH TẠO; cấu hình truyền vào lúc TẠO.
 */

const bang = new Map();

/**
 * @param {string} ten
 * @param {(cauHinh: object) => object} taoCong - nhận cấu hình LÚC TẠO, không phải lúc đăng ký
 */
export function dangKyCong(ten, taoCong) {
  if (bang.has(ten)) throw new Error(`Cổng "${ten}" đã được đăng ký`);
  bang.set(ten, taoCong);
}

export function taoCong(ten, cauHinh = {}) {
  const tao = bang.get(ten);
  if (!tao) {
    throw new Error(`Không hỗ trợ cổng "${ten}". Có: ${[...bang.keys()].join(', ')}`);
  }
  return tao(cauHinh);
}

export function danhSachCong() {
  return [...bang.keys()];
}
