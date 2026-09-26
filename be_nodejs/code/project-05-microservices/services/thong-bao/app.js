/**
 * DỊCH VỤ THÔNG BÁO — gửi email khi đơn được xác nhận.
 *
 * Nơi minh hoạ hai loại lỗi của consumer:
 *   · LỖI TẠM THỜI (SMTP chập chờn)   → thử lại có backoff qua hàng đợi .thu-lai
 *   · LỖI VĨNH VIỄN (email sai định dạng) → vào thẳng .dlq, không thử lại vô ích
 *
 * Dịch vụ này chết cả ngày thì sao? Đơn hàng VẪN đặt được, VẪN xác nhận được.
 * Message nằm chờ trong hàng đợi; khi nó sống lại, email được gửi bù.
 * Đó là "cô lập lỗi" — lý do chính để tách dịch vụ.
 */

import { khoiDongDichVu } from '../../shared/dich-vu.js';
import { xuLyMotLan, SQL_INBOX } from '../../shared/db.js';
import { LoiVinhVien } from '../../shared/mq.js';

const SQL = `
  CREATE TABLE IF NOT EXISTS email_da_gui (
    id          bigserial PRIMARY KEY,
    don_hang_id uuid NOT NULL UNIQUE,
    email       text NOT NULL,
    noi_dung    text NOT NULL,
    gui_luc     timestamptz NOT NULL DEFAULT now()
  );
  ${SQL_INBOX}
`;

/** Hộp thư giả lập. Thật thì là SMTP / SES / SendGrid. */
export function hopThuGiaLap({ tiLeLoi = 0, logger } = {}) {
  return {
    async gui(email, noiDung) {
      if (Math.random() < tiLeLoi) throw new Error('SMTP timeout (giả lập)');
      logger?.info({ email }, `📧 ${noiDung}`);
    },
  };
}

function dinhTuyen(app, { pool }) {
  app.get('/email', async (req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT don_hang_id AS "donHangId", email, noi_dung AS "noiDung", gui_luc AS "guiLuc" FROM email_da_gui ORDER BY id DESC LIMIT 20');
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
}

function taoXuLy(hopThu) {
  return async function xuLyDonXacNhan(suKien, { messageId }, { pool }) {
    const { donHangId, email, sanPhamId, soLuong } = suKien.duLieu;

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? '')) {
      throw new LoiVinhVien(`Email không hợp lệ: "${email}"`);
    }

    await xuLyMotLan(pool, messageId, async (c) => {
      const noiDung = `Đơn ${donHangId.slice(0, 8)} đã xác nhận: ${soLuong} × ${sanPhamId}`;
      await c.query('INSERT INTO email_da_gui (don_hang_id, email, noi_dung) VALUES ($1, $2, $3)', [donHangId, email, noiDung]);
      // Gửi SAU khi INSERT, TRƯỚC khi COMMIT: gửi lỗi → ROLLBACK → lần thử lại làm từ đầu.
      // ⚠️ Vẫn còn một khe: gửi xong rồi COMMIT lỗi → lần sau gửi lần hai.
      // Email là hệ thống ngoài, không nằm trong transaction được. Chấp nhận "hiếm khi trùng"
      // với email; với TIỀN thì phải truyền idempotency key sang bên kia (buổi 24, 51).
      await hopThu.gui(email, noiDung);
    });
  };
}

export function taoThongBao({ dbUrl, mqUrl, logger, cong, khiMatKetNoi, hopThu, choCoSoMs }) {
  return khoiDongDichVu({
    ten: 'thong-bao',
    dbUrl, mqUrl, sql: SQL, logger, cong, khiMatKetNoi,
    coRelay: false, // dịch vụ này không phát sự kiện nào
    dinhTuyen,
    hangDoi: [{
      ten: 'thong-bao.don-hang-da-xac-nhan',
      khoa: ['don-hang.da-xac-nhan'],
      xuLy: taoXuLy(hopThu ?? hopThuGiaLap({ logger })),
      tuyChon: { soLanToiDa: 5, ...(choCoSoMs && { choCoSoMs }) },
    }],
  });
}
