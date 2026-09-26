/**
 * DỊCH VỤ ĐƠN HÀNG — điểm vào của SAGA đặt hàng.
 *
 *   POST /don-hang ──▶ ghi đơn CHO_XAC_NHAN + outbox "don-hang.da-tao" (MỘT transaction)
 *                      trả 202 NGAY — chưa biết còn hàng hay không
 *
 *   nghe "kho.da-giu"   ──▶ XAC_NHAN + outbox "don-hang.da-xac-nhan"
 *   nghe "kho.het-hang" ──▶ HUY (hành động bù trừ của saga: đơn không thể hoàn tất)
 *
 * Dịch vụ này KHÔNG gọi HTTP sang kho, KHÔNG đọc bảng của kho.
 * Nó chỉ phát sự kiện và phản ứng với sự kiện.
 */

import { khoiDongDichVu } from '../../shared/dich-vu.js';
import { trongTransaction, xuLyMotLan, SQL_INBOX } from '../../shared/db.js';
import { ghiOutbox, SQL_OUTBOX } from '../../shared/outbox.js';

const SQL = `
  CREATE TABLE IF NOT EXISTS don_hang (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    san_pham_id  text        NOT NULL,
    so_luong     int         NOT NULL CHECK (so_luong > 0),
    email        text        NOT NULL,
    trang_thai   text        NOT NULL DEFAULT 'CHO_XAC_NHAN',
    ly_do        text,
    tao_luc      timestamptz NOT NULL DEFAULT now(),
    cap_nhat_luc timestamptz NOT NULL DEFAULT now()
  );
  ${SQL_OUTBOX}
  ${SQL_INBOX}
`;

const LA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dinhTuyen(app, { pool }) {
  app.post('/don-hang', async (req, res, next) => {
    try {
      const { sanPhamId, soLuong, email } = req.body ?? {};
      if (typeof sanPhamId !== 'string' || !Number.isInteger(soLuong) || soLuong < 1 || soLuong > 100 || typeof email !== 'string') {
        return res.status(400).json({ ma: 'DU_LIEU_SAI', loi: 'Cần sanPhamId (chuỗi), soLuong (1–100), email' });
      }

      const don = await trongTransaction(pool, async (c) => {
        const { rows } = await c.query(
          'INSERT INTO don_hang (san_pham_id, so_luong, email) VALUES ($1, $2, $3) RETURNING id, trang_thai',
          [sanPhamId, soLuong, email]
        );
        // Sự kiện CHỈ mang thứ kho cần. Email không có ở đây — kho không cần biết.
        await ghiOutbox(c, 'don-hang.da-tao', { donHangId: rows[0].id, sanPhamId, soLuong });
        return rows[0];
      });

      // 202 Accepted, không phải 201: "đã NHẬN yêu cầu", kết quả cuối cùng chưa có.
      // Client hỏi lại GET /don-hang/:id (hoặc nhận qua WebSocket — buổi 25).
      res.status(202).json({ donHangId: don.id, trangThai: don.trang_thai, xem: `/don-hang/${don.id}` });
    } catch (err) {
      next(err);
    }
  });

  app.get('/don-hang/:id', async (req, res, next) => {
    try {
      if (!LA_UUID.test(req.params.id)) return res.status(404).json({ ma: 'KHONG_TIM_THAY' });
      const { rows } = await pool.query(
        'SELECT id, san_pham_id AS "sanPhamId", so_luong AS "soLuong", trang_thai AS "trangThai", ly_do AS "lyDo" FROM don_hang WHERE id = $1',
        [req.params.id]
      );
      rows[0] ? res.json(rows[0]) : res.status(404).json({ ma: 'KHONG_TIM_THAY' });
    } catch (err) {
      next(err);
    }
  });
}

async function xuLyKetQuaKho(suKien, { messageId }, { pool, logger }) {
  const { donHangId } = suKien.duLieu;

  const daLam = await xuLyMotLan(pool, messageId, async (c) => {
    if (suKien.loai === 'kho.da-giu') {
      // WHERE trang_thai = 'CHO_XAC_NHAN': chỉ chuyển từ đúng trạng thái trước đó.
      // Sự kiện tới muộn/sai thứ tự không kéo được đơn đã HUY sống lại (buổi 51).
      const { rows } = await c.query(
        `UPDATE don_hang SET trang_thai = 'XAC_NHAN', cap_nhat_luc = now()
         WHERE id = $1 AND trang_thai = 'CHO_XAC_NHAN'
         RETURNING id, email, san_pham_id, so_luong`,
        [donHangId]
      );
      if (rows[0]) {
        // "Event-carried state transfer": gửi kèm email để dịch vụ thông báo KHÔNG phải
        // gọi ngược lại hỏi. Đổi lại: dữ liệu cá nhân nằm trong broker → cân nhắc (buổi 18).
        await ghiOutbox(c, 'don-hang.da-xac-nhan', {
          donHangId, email: rows[0].email, sanPhamId: rows[0].san_pham_id, soLuong: rows[0].so_luong,
        });
      }
    } else if (suKien.loai === 'kho.het-hang') {
      await c.query(
        `UPDATE don_hang SET trang_thai = 'HUY', ly_do = $2, cap_nhat_luc = now()
         WHERE id = $1 AND trang_thai = 'CHO_XAC_NHAN'`,
        [donHangId, suKien.duLieu.lyDo]
      );
    }
  });

  logger.info({ donHangId, loai: suKien.loai, trungLap: !daLam }, 'đã nhận kết quả từ kho');
}

export function taoDonHang({ dbUrl, mqUrl, logger, cong, khiMatKetNoi }) {
  return khoiDongDichVu({
    ten: 'don-hang',
    dbUrl, mqUrl, sql: SQL, logger, cong, khiMatKetNoi,
    dinhTuyen,
    hangDoi: [{ ten: 'don-hang.ket-qua-kho', khoa: ['kho.da-giu', 'kho.het-hang'], xuLy: xuLyKetQuaKho }],
  });
}
