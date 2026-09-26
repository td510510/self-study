/**
 * SAU khi refactor: service chỉ còn MỘT trách nhiệm — điều phối việc đặt hàng.
 *
 * Mọi thứ nó cần đều được TIÊM VÀO qua constructor (Dependency Injection
 * thủ công — không cần framework). Service không `import` cổng thanh toán,
 * không `import` email, không `new` bất cứ thứ gì.
 *
 * So sánh với truoc-refactor.js:
 *
 *   | Thay đổi | Trước | Sau |
 *   |---|---|---|
 *   | Thêm cổng thanh toán | sửa hàm datHang | thêm adapter + dangKyCong |
 *   | Thêm việc phụ (điểm thưởng) | sửa hàm datHang | bus.dangKy(...) |
 *   | Test logic đặt hàng | gọi cổng thật | tiêm cổng giả |
 *   | Thêm retry | sửa từng nhánh if | bọc voiThuLai() |
 */

export class LoiDatHang extends Error {
  constructor(message, ma) {
    super(message);
    this.name = 'LoiDatHang';
    this.ma = ma;
  }
}

export class DonHangService {
  /**
   * @param {object} deps
   * @param {{ tim: Function, truTon: Function, hoanTon: Function }} deps.kho
   * @param {{ ten: string, thanhToan: Function }} deps.cong
   * @param {{ phat: Function }} deps.bus
   * @param {() => string} [deps.taoId] - tiêm được để test cho ra id cố định
   */
  constructor({ kho, cong, bus, taoId = () => crypto.randomUUID() }) {
    this.kho = kho;
    this.cong = cong;
    this.bus = bus;
    this.taoId = taoId;
  }

  async datHang({ sanPhamId, soLuong, email }) {
    const sp = await this.kho.tim(sanPhamId);
    if (!sp) throw new LoiDatHang('Không có sản phẩm', 'KHONG_TIM_THAY');

    // Giữ hàng TRƯỚC khi lấy tiền. Ngược lại thì có thể lấy tiền
    // của khách cho món đã hết (và phải hoàn tiền — tốn phí, mất uy tín).
    const giuDuoc = await this.kho.truTon(sanPhamId, soLuong);
    if (!giuDuoc) throw new LoiDatHang(`"${sp.ten}" không đủ hàng`, 'HET_HANG');

    const donHangId = this.taoId();
    const soTien = sp.gia * soLuong;

    try {
      const { maGiaoDich } = await this.cong.thanhToan({ donHangId, soTien });
      const donHang = { donHangId, sanPhamId, soLuong, soTien, maGiaoDich, cong: this.cong.ten };

      // Việc phụ: phát sự kiện rồi thôi. Việc phụ lỗi KHÔNG làm hỏng đơn hàng.
      await this.bus.phat('don-hang.da-dat', { ...donHang, email });
      return donHang;
    } catch (err) {
      // Thanh toán thất bại → trả hàng lại kho. Đây là một "bù trừ"
      // (compensation) — buổi 53 sẽ gặp lại nó dưới tên SAGA.
      await this.kho.hoanTon(sanPhamId, soLuong);
      throw err;
    }
  }
}
