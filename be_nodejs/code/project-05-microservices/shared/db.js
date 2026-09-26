import pg from 'pg';

export function taoPool(connectionString) {
  return new pg.Pool({ connectionString, max: 10 });
}

export async function trongTransaction(pool, fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const kq = await fn(client);
    await client.query('COMMIT');
    return kq;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export const SQL_INBOX = `
  CREATE TABLE IF NOT EXISTS su_kien_da_xu_ly (
    id        uuid PRIMARY KEY,
    xu_ly_luc timestamptz NOT NULL DEFAULT now()
  );
`;

/**
 * INBOX / IDEMPOTENT CONSUMER — xử lý một message ĐÚNG MỘT LẦN dù nhận nhiều lần.
 *
 * Ghi id message vào bảng có PRIMARY KEY, TRONG CÙNG transaction với việc xử lý:
 *   · lần đầu: INSERT được → làm việc → COMMIT cả hai
 *   · lần sau: INSERT đụng khoá chính → bỏ qua
 *   · xử lý lỗi giữa chừng → ROLLBACK cả hai → lần giao lại làm từ đầu, sạch sẽ
 *
 * ⚠️ Nếu tách "ghi id" và "xử lý" ra hai transaction, luôn có một khe hở
 * để chết ở giữa → hoặc xử lý hai lần, hoặc không bao giờ xử lý.
 *
 * @returns {Promise<boolean>} false nếu message đã được xử lý trước đó
 */
export async function xuLyMotLan(pool, messageId, fn) {
  return trongTransaction(pool, async (client) => {
    const r = await client.query('INSERT INTO su_kien_da_xu_ly (id) VALUES ($1) ON CONFLICT DO NOTHING', [messageId]);
    if (r.rowCount === 0) return false;
    await fn(client);
    return true;
  });
}
