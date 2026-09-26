/**
 * REPOSITORY — service hỏi "còn hàng không?", không hỏi "SELECT ... FROM".
 *
 * Bản này lưu trong bộ nhớ. Bản thật dùng Prisma (buổi 13, 32).
 * Service KHÔNG ĐỔI MỘT DÒNG khi ta thay bản này bằng bản Prisma —
 * đó là chữ D trong SOLID: service phụ thuộc vào HÌNH DẠNG, không phụ thuộc
 * vào lớp cụ thể.
 */

export class KhoTrongBoNho {
  #sp;

  constructor(danhSach = []) {
    this.#sp = new Map(danhSach.map((sp) => [sp.id, { ...sp }]));
  }

  async tim(id) {
    const sp = this.#sp.get(id);
    return sp ? { ...sp } : null;
  }

  /** Trừ tồn kho có điều kiện — trả false nếu không đủ (tương tự UPDATE ... WHERE ton >= ?). */
  async truTon(id, soLuong) {
    const sp = this.#sp.get(id);
    if (!sp || sp.ton < soLuong) return false;
    sp.ton -= soLuong;
    return true;
  }

  async hoanTon(id, soLuong) {
    const sp = this.#sp.get(id);
    if (sp) sp.ton += soLuong;
  }
}
