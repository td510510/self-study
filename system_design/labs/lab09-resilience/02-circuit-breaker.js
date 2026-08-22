/**
 * LAB 09.2 — Circuit Breaker
 *
 * CLOSED   : cho qua, đếm tỉ lệ lỗi
 * OPEN     : từ chối NGAY, không gọi downstream (fail fast)
 * HALF_OPEN: cho vài request thử để dò xem downstream sống lại chưa
 */

export class CircuitBreaker {
  constructor({
    nguongLoi = 0.5,      // tỉ lệ lỗi để mở mạch
    soMauToiThieu = 10,   // chưa đủ mẫu thì không kết luận (tránh mở nhầm)
    thoiGianNghiMs = 1000,// nằm OPEN bao lâu trước khi thử lại
    soThuHalfOpen = 3,    // cần bao nhiêu lần thử thành công để đóng lại
    cuaSoMs = 2000,       // chỉ tính lỗi trong cửa sổ trượt này
  } = {}) {
    Object.assign(this, { nguongLoi, soMauToiThieu, thoiGianNghiMs, soThuHalfOpen, cuaSoMs });
    this.trangThai = 'CLOSED';
    this.suKien = [];       // [{ t, ok }]
    this.moLuc = 0;
    this.thuThanhCong = 0;
    this.thongKe = { choQua: 0, tuChoiNgay: 0, chuyenTrangThai: [] };
  }

  #don() {
    const cat = Date.now() - this.cuaSoMs;
    while (this.suKien.length && this.suKien[0].t < cat) this.suKien.shift();
  }

  #tyLeLoi() {
    this.#don();
    if (this.suKien.length < this.soMauToiThieu) return 0;
    return this.suKien.filter((e) => !e.ok).length / this.suKien.length;
  }

  #chuyen(moi) {
    if (this.trangThai === moi) return;
    this.thongKe.chuyenTrangThai.push({ tu: this.trangThai, den: moi, t: Date.now() });
    this.trangThai = moi;
    if (moi === 'OPEN') this.moLuc = Date.now();
    if (moi === 'HALF_OPEN') this.thuThanhCong = 0;
  }

  /**
   * @param fn       việc cần gọi
   * @param fallback giá trị trả về khi mạch đang OPEN (graceful degradation)
   */
  async goi(fn, fallback) {
    if (this.trangThai === 'OPEN') {
      if (Date.now() - this.moLuc >= this.thoiGianNghiMs) {
        this.#chuyen('HALF_OPEN');
      } else {
        // Điểm mấu chốt: TỪ CHỐI NGAY, không tốn 1 giây chờ timeout.
        // Vừa bảo vệ mình (không cạn thread) vừa bảo vệ downstream (cho nó thở).
        this.thongKe.tuChoiNgay++;
        if (fallback !== undefined) return fallback;
        throw Object.assign(new Error('Circuit OPEN'), { circuitOpen: true });
      }
    }

    this.thongKe.choQua++;
    try {
      const kq = await fn();
      this.suKien.push({ t: Date.now(), ok: true });
      if (this.trangThai === 'HALF_OPEN' && ++this.thuThanhCong >= this.soThuHalfOpen) {
        this.suKien = [];
        this.#chuyen('CLOSED');
      }
      return kq;
    } catch (e) {
      this.suKien.push({ t: Date.now(), ok: false });
      if (this.trangThai === 'HALF_OPEN') {
        this.#chuyen('OPEN'); // thử mà vẫn lỗi → quay lại OPEN ngay
      } else if (this.#tyLeLoi() >= this.nguongLoi) {
        this.#chuyen('OPEN');
      }
      if (fallback !== undefined) return fallback;
      throw e;
    }
  }
}
