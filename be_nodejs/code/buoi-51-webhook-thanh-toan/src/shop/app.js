/**
 * SHOP — tạo đơn, chuyển khách sang cổng thanh toán, nhận WEBHOOK.
 *
 * NGUYÊN TẮC SỐ 1 CỦA TÍCH HỢP THANH TOÁN:
 *   Nguồn sự thật về "đã trả tiền chưa" là CỔNG THANH TOÁN, không phải trình duyệt.
 *   Chỉ hai kênh được phép chuyển đơn sang DA_THANH_TOAN:
 *     1. Webhook CÓ CHỮ KÝ HỢP LỆ
 *     2. Đối soát: server ta tự hỏi API cổng thanh toán
 *   Trang "cảm ơn" sau redirect chỉ HIỂN THỊ, không bao giờ GHI.
 */

import express from 'express';
import { randomUUID } from 'node:crypto';
import { xacMinhChuKy } from '../lib/chu-ky.js';

/**
 * Máy trạng thái: chỉ những bước chuyển này là hợp lệ.
 *
 * ⚠️ Lỗi gặp thật khi soạn bài: bản đầu quên CAN_KIEM_TRA ở hai dòng dưới →
 * đơn lệch tiền bị "bỏ qua" im lặng và nằm mãi ở CHO_THANH_TOAN. Test bắt được.
 */
const CHUYEN_HOP_LE = {
  CHO_THANH_TOAN: ['DA_THANH_TOAN', 'THAT_BAI', 'CAN_KIEM_TRA'],
  // Khách thử thẻ khác sau khi thất bại → vẫn có thể thành công
  THAT_BAI: ['DA_THANH_TOAN', 'CAN_KIEM_TRA'],
  // Đã trả tiền thì webhook "thất bại" đến MUỘN không được kéo lùi.
  // Hoàn tiền là một luồng RIÊNG, có sự kiện riêng.
  DA_THANH_TOAN: [],
  CAN_KIEM_TRA: [],
};

/**
 * @param {object} cfg
 * @param {string} cfg.congUrl - URL cổng thanh toán
 * @param {string} cfg.apiKey
 * @param {string} cfg.webhookSecret
 * @param {string} cfg.shopUrl - URL công khai của shop (để cổng redirect về)
 */
export function taoShop({ congUrl, apiKey, webhookSecret, shopUrl, logger = console }) {
  const donHang = new Map();
  // Production: bảng có UNIQUE(suKienId), INSERT cùng TRANSACTION với cập nhật đơn.
  // Nếu tách rời: ghi đơn xong, chết trước khi ghi id sự kiện → lần gửi lại xử lý LẦN HAI.
  const suKienDaXuLy = new Set();
  const emailDaGui = [];
  let soLanGiaLapHong = 0;

  const goiCong = async (duongDan, init = {}) => {
    const r = await fetch(`${congUrl}${duongDan}`, {
      ...init,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}`, ...init.headers },
    });
    if (!r.ok) throw new Error(`Cổng thanh toán trả ${r.status}`);
    return r.json();
  };

  function chuyenTrangThai(don, moi, nguon) {
    if (don.trangThai === moi) return false;
    if (!CHUYEN_HOP_LE[don.trangThai].includes(moi)) {
      don.lichSu.push({ bo_qua: `${don.trangThai} → ${moi}`, nguon });
      return false;
    }
    don.lichSu.push({ tu: don.trangThai, sang: moi, nguon });
    don.trangThai = moi;
    return true;
  }

  /** Áp một sự kiện thanh toán vào đơn — dùng chung cho webhook VÀ đối soát. */
  function apDung({ loai, duLieu }, nguon) {
    const don = donHang.get(duLieu.donHangId);
    if (!don) {
      logger.warn?.(`Sự kiện cho đơn không tồn tại: ${duLieu.donHangId}`);
      return;
    }
    if (duLieu.phienId !== don.phienId) {
      logger.warn?.(`Sự kiện của phiên lạ ${duLieu.phienId} cho đơn ${don.id}`);
      return;
    }

    if (loai === 'thanh-toan.thanh-cong') {
      // Số tiền PHẢI khớp. Lỗi tích hợp (hoặc kẻ gian sửa giá ở bước tạo phiên)
      // có thể làm khách trả 1.000đ cho đơn 1.000.000đ.
      if (duLieu.soTien !== don.soTien) {
        chuyenTrangThai(don, 'CAN_KIEM_TRA', nguon);
        logger.error?.(`🚨 Đơn ${don.id}: trả ${duLieu.soTien}đ, cần ${don.soTien}đ`);
        return;
      }
      if (chuyenTrangThai(don, 'DA_THANH_TOAN', nguon)) {
        // Việc phụ: đẩy ra hàng đợi (buổi 26). Ở đây ghi lại để test đếm được.
        emailDaGui.push(don.id);
      }
    } else if (loai === 'thanh-toan.that-bai') {
      chuyenTrangThai(don, 'THAT_BAI', nguon);
    }
  }

  const app = express();

  // ⚠️ THỨ TỰ QUAN TRỌNG: route webhook đăng ký TRƯỚC express.json()
  // và dùng express.raw() → req.body là Buffer GỐC.
  // Nếu express.json() chạy trước, body đã bị parse; JSON.stringify lại
  // KHÔNG cho ra đúng chuỗi byte cũ (khoảng trắng, thứ tự key, \u escape)
  // → chữ ký không bao giờ khớp. Lỗi số 1 khi tích hợp webhook.
  app.post('/webhook/thanh-toan', express.raw({ type: 'application/json', limit: '64kb' }), (req, res) => {
    if (soLanGiaLapHong > 0) {
      soLanGiaLapHong--;
      return res.status(503).json({ loi: 'Đang bảo trì (giả lập)' });
    }

    const kq = xacMinhChuKy({ secret: webhookSecret, header: req.get('x-chu-ky'), rawBody: req.body });
    if (!kq.hopLe) return res.status(401).json({ ma: 'CHU_KY_SAI', loi: kq.lyDo });

    const suKien = JSON.parse(req.body);

    // IDEMPOTENCY: cổng gửi "ít nhất một lần" → CHẮC CHẮN có lúc gửi trùng.
    // Trùng thì vẫn trả 200 — trả lỗi thì cổng lại tưởng chưa tới và gửi tiếp.
    if (suKienDaXuLy.has(suKien.id)) return res.json({ nhan: true, trungLap: true });
    suKienDaXuLy.add(suKien.id);

    apDung(suKien, `webhook:${suKien.id}`);

    // Trả 2xx NHANH. Cổng thật chỉ chờ vài giây; quá hạn là tính thất bại và
    // gửi lại. Việc nặng (email, xuất hoá đơn) phải đẩy ra hàng đợi.
    res.json({ nhan: true });
  });

  app.use(express.json());

  app.post('/don-hang', async (req, res, next) => {
    try {
      const soTien = Number(req.body.soTien);
      if (!Number.isInteger(soTien) || soTien <= 0) return res.status(400).json({ loi: 'soTien không hợp lệ' });

      const don = { id: `dh_${randomUUID().slice(0, 8)}`, soTien, trangThai: 'CHO_THANH_TOAN', lichSu: [] };
      donHang.set(don.id, don);

      // Giá lấy từ SERVER (ở đây là body cho gọn; thật thì tính từ giỏ hàng trong DB).
      // Không bao giờ để trình duyệt nói với cổng thanh toán số tiền.
      const p = await goiCong('/v1/phien-thanh-toan', {
        method: 'POST',
        body: JSON.stringify({ donHangId: don.id, soTien, urlQuayVe: `${shopUrl}/thanh-toan/ket-qua?donHangId=${don.id}` }),
      });
      don.phienId = p.id;
      res.status(201).json({ donHangId: don.id, urlThanhToan: p.url });
    } catch (err) {
      next(err);
    }
  });

  app.get('/don-hang/:id', (req, res) => {
    const don = donHang.get(req.params.id);
    don ? res.json(don) : res.status(404).json({ loi: 'Không có đơn' });
  });

  // Trang khách được redirect về. CHỈ ĐỌC trạng thái thật, BỎ QUA ?trangThai=.
  app.get('/thanh-toan/ket-qua', (req, res) => {
    const don = donHang.get(req.query.donHangId);
    if (!don) return res.status(404).json({ loi: 'Không có đơn' });
    res.json({
      donHangId: don.id,
      trangThai: don.trangThai,
      // Webhook có thể tới SAU khách → frontend nên poll lại vài giây
      thongDiep: don.trangThai === 'CHO_THANH_TOAN' ? 'Đang xác nhận thanh toán…' : undefined,
    });
  });

  /**
   * ĐỐI SOÁT — lưới an toàn cho webhook bị mất.
   * Chạy định kỳ (job lặp của BullMQ — buổi 26): đơn nào chờ quá lâu thì
   * tự hỏi cổng thanh toán. Không có bước này, một webhook mất = một khách
   * đã trả tiền nhưng không bao giờ nhận hàng.
   */
  async function doiSoat() {
    let daSua = 0;
    for (const don of donHang.values()) {
      if (don.trangThai !== 'CHO_THANH_TOAN' || !don.phienId) continue;
      const p = await goiCong(`/v1/phien-thanh-toan/${don.phienId}`);
      if (p.trangThai === 'cho') continue;
      const truoc = don.trangThai;
      apDung({ loai: `thanh-toan.${p.trangThai}`, duLieu: { ...p, phienId: p.id } }, 'doi-soat');
      if (don.trangThai !== truoc) daSua++;
    }
    return daSua;
  }

  app.use((err, req, res, _next) => {
    logger.error?.(err);
    res.status(502).json({ loi: 'Không liên lạc được cổng thanh toán' });
  });

  Object.assign(app.locals, {
    donHang,
    emailDaGui,
    doiSoat,
    giaLapHong: (n) => { soLanGiaLapHong = n; },
  });
  return app;
}
