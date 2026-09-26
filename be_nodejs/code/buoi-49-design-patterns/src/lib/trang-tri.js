/**
 * DECORATOR — thêm hành vi mà KHÔNG sửa object gốc.
 *
 * Mỗi hàm dưới đây nhận một cổng thanh toán và trả về một cổng thanh toán
 * KHÁC có CÙNG HÌNH DẠNG. Vì hình dạng giống nhau, ta xếp chồng được:
 *
 *   voiDoThoiGian(voiThuLai(new ViDienTuAdapter(sdk)))
 *
 * Adapter không biết gì về retry. Retry không biết gì về ví điện tử.
 * Mỗi mảnh làm đúng MỘT việc (chữ S trong SOLID).
 *
 * ⚠️ Đừng nhầm với cú pháp `@Decorator` của TypeScript/NestJS (buổi 33).
 * Tên giống nhau nhưng đây là design pattern — một cách ghép object.
 */

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

export function voiThuLai(cong, { soLan = 3, choMs = 20, logger = console } = {}) {
  return {
    ten: cong.ten,
    async thanhToan(yeuCau) {
      for (let lan = 1; ; lan++) {
        try {
          return await cong.thanhToan(yeuCau);
        } catch (err) {
          // Chỉ thử lại lỗi TẠM THỜI. Thẻ bị từ chối mà thử lại 3 lần
          // thì ngân hàng có thể khoá thẻ của khách.
          if (!err.tamThoi || lan >= soLan) throw err;
          logger.warn?.(`  ↻ ${cong.ten} lỗi tạm thời, thử lại lần ${lan + 1}`);
          // Backoff tăng dần — nối lại buổi 26
          await ngu(choMs * 2 ** (lan - 1));
        }
      }
    },
  };
}

export function voiDoThoiGian(cong, { ghiNhan }) {
  return {
    ten: cong.ten,
    async thanhToan(yeuCau) {
      const batDau = performance.now();
      let ketQua = 'thanh-cong';
      try {
        return await cong.thanhToan(yeuCau);
      } catch (err) {
        ketQua = 'loi';
        throw err;
      } finally {
        ghiNhan({ cong: cong.ten, ketQua, ms: performance.now() - batDau });
      }
    },
  };
}
