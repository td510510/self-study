/**
 * CỔNG THANH TOÁN GIẢ LẬP — đóng vai Stripe / VNPay / MoMo.
 *
 * Hành xử giống cổng thật ở những điểm QUAN TRỌNG cho bài học:
 *   · Webhook được KÝ bằng HMAC
 *   · Shop không trả 2xx → GỬI LẠI với khoảng chờ tăng dần
 *   · Có thể gửi TRÙNG (at-least-once) và KHÔNG ĐÚNG THỨ TỰ
 *   · Có API tra cứu trạng thái để ĐỐI SOÁT
 *
 *   POST /v1/phien-thanh-toan         (API key) tạo phiên, trả URL cho khách
 *   GET  /v1/phien-thanh-toan/:id     (API key) tra cứu — dùng để đối soát
 *   GET  /thanh-toan/:id              trang thanh toán cho khách
 *   POST /thanh-toan/:id              khách bấm "Trả tiền" / "Huỷ"
 */

import express from 'express';
import { randomUUID } from 'node:crypto';
import { kyWebhook } from '../lib/chu-ky.js';

const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {object} cauHinh - object CÓ THỂ SỬA sau khi tạo (test cần gán webhookUrl sau khi biết cổng)
 * @param {string} cauHinh.apiKey
 * @param {string} cauHinh.webhookSecret
 * @param {string} [cauHinh.webhookUrl]
 * @param {number[]} [cauHinh.lichThuLai] - ms chờ trước mỗi lần gửi (cổng thật: phút → giờ → ngày)
 */
export function taoCongThanhToan(cauHinh) {
  cauHinh.lichThuLai ??= [0, 1000, 5000, 30_000];

  const phien = new Map();
  const nhatKy = []; // mọi lần gửi webhook — để test và để dạy
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  const canApiKey = (req, res, next) =>
    req.get('authorization') === `Bearer ${cauHinh.apiKey}` ? next() : res.status(401).json({ loi: 'API key sai' });

  app.post('/v1/phien-thanh-toan', canApiKey, (req, res) => {
    const { donHangId, soTien, urlQuayVe } = req.body;
    if (!Number.isInteger(soTien) || soTien <= 0) return res.status(400).json({ loi: 'soTien phải là số nguyên dương (đồng)' });
    const p = { id: `ps_${randomUUID().slice(0, 8)}`, donHangId, soTien, urlQuayVe, trangThai: 'cho' };
    phien.set(p.id, p);
    res.status(201).json({ ...p, url: `${req.protocol}://${req.get('host')}/thanh-toan/${p.id}` });
  });

  app.get('/v1/phien-thanh-toan/:id', canApiKey, (req, res) => {
    const p = phien.get(req.params.id);
    p ? res.json(p) : res.status(404).json({ loi: 'Không có phiên' });
  });

  app.get('/thanh-toan/:id', (req, res) => {
    const p = phien.get(req.params.id);
    if (!p) return res.status(404).send('Không có phiên');
    res.type('html').send(`<!doctype html><meta charset="utf-8"><h2>Cổng thanh toán giả lập</h2>
      <p>Đơn <b>${p.donHangId}</b> — ${p.soTien.toLocaleString('vi-VN')}đ</p>
      <form method="post"><button name="ketQua" value="thanh-cong">Trả tiền</button>
      <button name="ketQua" value="that-bai">Thẻ bị từ chối</button></form>`);
  });

  app.post('/thanh-toan/:id', (req, res) => {
    const p = phien.get(req.params.id);
    if (!p || p.trangThai !== 'cho') return res.status(409).send('Phiên không còn chờ thanh toán');
    p.trangThai = req.body.ketQua === 'thanh-cong' ? 'thanh-cong' : 'that-bai';

    const suKien = {
      id: `evt_${randomUUID().replaceAll("-", "").slice(0, 16)}`,
      loai: `thanh-toan.${p.trangThai}`,
      taoLuc: new Date().toISOString(),
      duLieu: { phienId: p.id, donHangId: p.donHangId, soTien: p.soTien },
    };
    // KHÔNG await: khách được chuyển về shop NGAY, webhook đi đường riêng.
    // Hai việc này ĐUA nhau — khách có thể về tới trang cảm ơn TRƯỚC khi webhook tới.
    if (!cauHinh.matWebhook) void guiWebhook(suKien);

    const quayVe = new URL(p.urlQuayVe);
    // Cổng thật cũng gắn trạng thái lên URL quay về. Shop KHÔNG ĐƯỢC TIN nó —
    // khách tự gõ lại URL với ?trangThai=thanh-cong là xong.
    quayVe.searchParams.set('trangThai', p.trangThai);
    res.redirect(quayVe.href);
  });

  /** Gửi một sự kiện, thử lại theo lịch tới khi shop trả 2xx. */
  async function guiWebhook(suKien) {
    const body = JSON.stringify(suKien);
    for (let lan = 0; lan < cauHinh.lichThuLai.length; lan++) {
      await ngu(cauHinh.lichThuLai[lan]);
      let status = 0;
      try {
        const r = await fetch(cauHinh.webhookUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            // Ký LẠI mỗi lần gửi → timestamp mới, không bị shop coi là phát lại
            'x-chu-ky': kyWebhook(cauHinh.webhookSecret, body),
          },
          body,
          signal: AbortSignal.timeout(cauHinh.timeoutMs ?? 10_000),
        });
        status = r.status;
      } catch {
        status = 0; // shop sập / timeout
      }
      nhatKy.push({ suKienId: suKien.id, loai: suKien.loai, lan: lan + 1, status });
      if (status >= 200 && status < 300) return true;
    }
    return false; // cổng thật: gửi email cho merchant "webhook của bạn đang hỏng"
  }

  app.locals = Object.assign(app.locals, {
    phien,
    nhatKy,
    guiWebhook,
    /** Đổi trạng thái phiên mà KHÔNG gửi webhook — giả lập webhook bị mất. */
    datTrangThai(id, trangThai) { phien.get(id).trangThai = trangThai; },
  });

  return app;
}
