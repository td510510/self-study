/**
 * DỊCH VỤ KHO — sở hữu tồn kho. Không ai khác được sửa bảng san_pham.
 *
 *   nghe "don-hang.da-tao" ──▶ còn hàng: trừ tồn + outbox "kho.da-giu"
 *                              hết hàng: outbox "kho.het-hang"
 */

import { khoiDongDichVu } from '../../shared/dich-vu.js';
import { xuLyMotLan, SQL_INBOX } from '../../shared/db.js';
import { ghiOutbox, SQL_OUTBOX } from '../../shared/outbox.js';

const SQL = `
  CREATE TABLE IF NOT EXISTS san_pham (
    id   text PRIMARY KEY,
    ten  text NOT NULL,
    ton  int  NOT NULL CHECK (ton >= 0)   -- lưới an toàn cuối cùng: DB từ chối tồn âm
  );
  CREATE TABLE IF NOT EXISTS giu_hang (
    don_hang_id uuid PRIMARY KEY,         -- một đơn chỉ giữ hàng MỘT lần
    san_pham_id text NOT NULL REFERENCES san_pham(id),
    so_luong    int  NOT NULL,
    tao_luc     timestamptz NOT NULL DEFAULT now()
  );
  ${SQL_OUTBOX}
  ${SQL_INBOX}
  INSERT INTO san_pham (id, ten, ton) VALUES
    ('ao-thun', 'Áo thun', 1000),
    ('mu',      'Mũ',        5),
    ('tui',     'Túi vải',   0)
  ON CONFLICT (id) DO NOTHING;
`;

function dinhTuyen(app, { pool }) {
  app.get('/san-pham', async (req, res, next) => {
    try {
      const { rows } = await pool.query('SELECT id, ten, ton FROM san_pham ORDER BY id');
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });
}

function taoXuLy({ doTreMs }) {
  return async function xuLyDonMoi(suKien, { messageId }, { pool, logger }) {
    const { donHangId, sanPhamId, soLuong } = suKien.duLieu;
    let ketQua = 'trung-lap';

    await xuLyMotLan(pool, messageId, async (c) => {
      // Diễn tập sự cố: giả lập kho chậm — trong Jaeger thấy ngay span nào dài
      if (doTreMs > 0) await c.query('SELECT pg_sleep($1)', [doTreMs / 1000]);

      // Trừ tồn NGUYÊN TỬ bằng một câu UPDATE có điều kiện (buổi 19).
      // Không SELECT rồi mới UPDATE — hai message song song sẽ cùng thấy "còn 1".
      const { rowCount } = await c.query(
        'UPDATE san_pham SET ton = ton - $2 WHERE id = $1 AND ton >= $2',
        [sanPhamId, soLuong]
      );

      if (rowCount === 1) {
        await c.query('INSERT INTO giu_hang (don_hang_id, san_pham_id, so_luong) VALUES ($1, $2, $3)', [donHangId, sanPhamId, soLuong]);
        await ghiOutbox(c, 'kho.da-giu', { donHangId, sanPhamId, soLuong });
        ketQua = 'da-giu';
      } else {
        const { rowCount: coSanPham } = await c.query('SELECT 1 FROM san_pham WHERE id = $1', [sanPhamId]);
        await ghiOutbox(c, 'kho.het-hang', {
          donHangId, sanPhamId, soLuong,
          lyDo: coSanPham ? 'Không đủ hàng' : 'Sản phẩm không tồn tại',
        });
        ketQua = 'het-hang';
      }
    });

    logger.info({ donHangId, sanPhamId, soLuong, ketQua }, 'xử lý đơn mới');
  };
}

export function taoKho({ dbUrl, mqUrl, logger, cong, khiMatKetNoi, doTreMs = 0 }) {
  return khoiDongDichVu({
    ten: 'kho',
    dbUrl, mqUrl, sql: SQL, logger, cong, khiMatKetNoi,
    dinhTuyen,
    hangDoi: [{ ten: 'kho.don-hang-da-tao', khoa: ['don-hang.da-tao'], xuLy: taoXuLy({ doTreMs }) }],
  });
}
