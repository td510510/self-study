/**
 * ADAPTER — bọc API "lạ" thành API "của ta".
 *
 * Mọi cổng thanh toán, sau khi qua adapter, đều có CÙNG MỘT HÌNH DẠNG:
 *
 *   {
 *     ten: string,
 *     thanhToan({ donHangId, soTien }) → Promise<{ maGiaoDich }>   // soTien tính bằng ĐỒNG
 *   }
 *
 * JavaScript không có từ khoá `interface`. "Interface" ở đây là một
 * THOẢ THUẬN: object nào có đúng các hàm này thì dùng được. (Duck typing —
 * TypeScript sẽ biến thoả thuận này thành thứ trình biên dịch kiểm tra.)
 *
 * Mỗi adapter cũng là một STRATEGY: service chọn một cái, và không cần
 * biết bên trong nó làm gì.
 */

import { promisify } from 'node:util';

export class LoiThanhToan extends Error {
  constructor(message, { cause, tamThoi = false } = {}) {
    super(message, { cause });
    this.name = 'LoiThanhToan';
    // Lỗi TẠM THỜI (mạng chập chờn) → đáng thử lại.
    // Lỗi VĨNH VIỄN (thẻ bị từ chối) → thử lại chỉ làm phiền ngân hàng.
    this.tamThoi = tamThoi;
  }
}

export class ViDienTuAdapter {
  ten = 'vi-dien-tu';

  constructor(sdk) {
    // Bọc callback thành Promise một lần ở đây (buổi 07),
    // phần còn lại của hệ thống chỉ thấy async/await.
    this.goi = promisify(sdk.thanhToan.bind(sdk));
  }

  async thanhToan({ donHangId, soTien }) {
    try {
      const kq = await this.goi(soTien);
      return { maGiaoDich: kq.transId };
    } catch (err) {
      throw new LoiThanhToan(`Ví điện tử lỗi khi thanh toán đơn ${donHangId}`, {
        cause: err,
        tamThoi: /ETIMEDOUT|ECONNRESET/.test(err.message),
      });
    }
  }
}

export class TheQuocTeAdapter {
  ten = 'the-quoc-te';

  constructor(sdk, { tyGia = 25_000 } = {}) {
    this.sdk = sdk;
    this.tyGia = tyGia;
  }

  async thanhToan({ donHangId, soTien }) {
    // Quy đổi đơn vị Ở ĐÂY — service không bao giờ phải biết "cent" là gì.
    const cent = Math.round((soTien / this.tyGia) * 100);
    const kq = await this.sdk.charges.create({ amount_cents: cent, currency: 'usd' });

    // SDK này báo lỗi bằng giá trị trả về chứ không throw.
    // Adapter đổi nó về CÙNG MỘT CÁCH báo lỗi với cổng kia.
    if (kq.status !== 'succeeded') {
      throw new LoiThanhToan(`Thẻ bị từ chối (${kq.reason}) cho đơn ${donHangId}`);
    }
    return { maGiaoDich: kq.id };
  }
}
