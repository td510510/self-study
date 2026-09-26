/**
 * Hai SDK "của bên thứ ba" — giả lập.
 *
 * Điểm mấu chốt: ta KHÔNG SỬA ĐƯỢC hai file kiểu này (chúng nằm trong
 * node_modules). Và chúng KHÔNG GIỐNG NHAU:
 *
 *   | | Ví điện tử | Thẻ quốc tế |
 *   |---|---|---|
 *   | Kiểu API | callback | Promise |
 *   | Đơn vị tiền | đồng | cent USD |
 *   | Kết quả | { transId } | { id, status } |
 *   | Báo lỗi | err đầu callback | status: 'failed' (không throw!) |
 *
 * Adapter (file adapter.js) sẽ san phẳng những khác biệt này.
 */

export class ViDienTuSdk {
  /** @param {{ loiLanDau?: number }} opts - số lần đầu tiên bị lỗi mạng (để demo retry) */
  constructor({ loiLanDau = 0 } = {}) {
    this.conLoi = loiLanDau;
    this.soLanGoi = 0;
  }

  thanhToan(soDong, callback) {
    this.soLanGoi++;
    setTimeout(() => {
      if (this.conLoi > 0) {
        this.conLoi--;
        return callback(new Error('ETIMEDOUT: ví điện tử không phản hồi'));
      }
      callback(null, { transId: `VI-${this.soLanGoi}-${soDong}` });
    }, 5);
  }
}

export class TheQuocTeSdk {
  constructor() {
    this.charges = {
      create: async ({ amount_cents, currency }) => {
        if (amount_cents <= 0) return { id: null, status: 'failed', reason: 'invalid_amount' };
        return { id: `ch_${amount_cents}_${currency}`, status: 'succeeded' };
      },
    };
  }
}
