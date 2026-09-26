/**
 * Test tích hợp: ba dịch vụ THẬT + Postgres THẬT + RabbitMQ THẬT.
 * Cần `docker compose up -d` trước. Các dịch vụ chạy trong cùng tiến trình test
 * (cổng ngẫu nhiên) để test bật/tắt từng cái như một sự cố thật.
 *
 * ⚠️ Tắt `npm run tat-ca` trước khi chạy test — nếu không, dịch vụ đang chạy
 * cũng tiêu thụ cùng hàng đợi và "cướp" message của test.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import amqp from 'amqplib';
import { taoDonHang } from '../services/don-hang/app.js';
import { taoKho } from '../services/kho/app.js';
import { taoThongBao } from '../services/thong-bao/app.js';
import { EXCHANGE } from '../shared/mq.js';

const env = process.env;
const imLang = { info() {}, warn() {}, error() {}, fatal() {}, debug() {} };
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

const HANG_DOI = ['kho.don-hang-da-tao', 'don-hang.ket-qua-kho', 'thong-bao.don-hang-da-xac-nhan'];

let donHang, kho, thongBao, mq, mqCh;
let dbDonHang, dbKho, dbThongBao;

/** Hộp thư có thể "hỏng" N lần tiếp theo — để test retry. */
const hopThu = {
  soLanHong: 0,
  daGui: [],
  async gui(email, noiDung) {
    if (this.soLanHong > 0) {
      this.soLanHong--;
      throw new Error('SMTP timeout (test)');
    }
    this.daGui.push({ email, noiDung });
  },
};

const batKho = () => taoKho({ dbUrl: env.DB_KHO, mqUrl: env.RABBITMQ_URL, logger: imLang });
const batDonHang = () => taoDonHang({ dbUrl: env.DB_DON_HANG, mqUrl: env.RABBITMQ_URL, logger: imLang });

before(async () => {
  // Làm sạch: xoá bảng + hàng đợi của lần chạy trước
  for (const [url, bang] of [
    [env.DB_DON_HANG, 'don_hang, outbox, su_kien_da_xu_ly'],
    [env.DB_KHO, 'giu_hang, san_pham, outbox, su_kien_da_xu_ly'],
    [env.DB_THONG_BAO, 'email_da_gui, su_kien_da_xu_ly'],
  ]) {
    const c = new pg.Client(url);
    await c.connect();
    await c.query(`DROP TABLE IF EXISTS ${bang} CASCADE`);
    await c.end();
  }
  mq = await amqp.connect(env.RABBITMQ_URL);
  mqCh = await mq.createChannel();
  for (const q of HANG_DOI) for (const hauTo of ['', '.thu-lai', '.dlq']) await mqCh.deleteQueue(q + hauTo);

  kho = await batKho();
  donHang = await batDonHang();
  thongBao = await taoThongBao({ dbUrl: env.DB_THONG_BAO, mqUrl: env.RABBITMQ_URL, logger: imLang, hopThu, choCoSoMs: 50 });

  dbDonHang = new pg.Pool({ connectionString: env.DB_DON_HANG });
  dbKho = new pg.Pool({ connectionString: env.DB_KHO });
  dbThongBao = new pg.Pool({ connectionString: env.DB_THONG_BAO });
});

after(async () => {
  await Promise.all([donHang?.dung(), kho?.dung(), thongBao?.dung()]);
  await Promise.all([dbDonHang?.end(), dbKho?.end(), dbThongBao?.end()]);
  await mq?.close();
});

// ───────────────────────────── tiện ích ─────────────────────────────

async function datHang(sanPhamId, soLuong = 1, email = 'khach@vd.vn') {
  const r = await fetch(`${donHang.url}/don-hang`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sanPhamId, soLuong, email }),
  });
  assert.equal(r.status, 202);
  return (await r.json()).donHangId;
}

const layDon = async (id) => (await fetch(`${donHang.url}/don-hang/${id}`)).json();
const tonKho = async (id) => (await dbKho.query('SELECT ton FROM san_pham WHERE id = $1', [id])).rows[0]?.ton;
const datTon = (id, ton) =>
  dbKho.query('INSERT INTO san_pham (id, ten, ton) VALUES ($1, $1, $2) ON CONFLICT (id) DO UPDATE SET ton = $2', [id, ton]);
const soMessage = async (q) => (await mqCh.checkQueue(q)).messageCount;

async function choDen(dieuKien, { ms = 5000, moTa = 'điều kiện' } = {}) {
  const het = Date.now() + ms;
  while (Date.now() < het) {
    if (await dieuKien()) return;
    await ngu(50);
  }
  throw new Error(`Hết ${ms}ms chờ ${moTa}`);
}

const choTrangThai = (id, trangThai) =>
  choDen(async () => (await layDon(id)).trangThai === trangThai, { moTa: `đơn ${id} → ${trangThai}` });

// ───────────────────────────── luồng chuẩn ─────────────────────────────

test('còn hàng → XAC_NHAN, kho trừ tồn, email gửi đúng một lần', async () => {
  await datTon('sp-a', 10);
  const id = await datHang('sp-a', 3, 'an@vd.vn');
  assert.equal((await layDon(id)).trangThai, 'CHO_XAC_NHAN', '202 trả về TRƯỚC khi kho kịp xử lý');

  await choTrangThai(id, 'XAC_NHAN');
  assert.equal(await tonKho('sp-a'), 7);
  await choDen(async () => hopThu.daGui.some((e) => e.noiDung.includes(id.slice(0, 8))), { moTa: 'email' });
  assert.equal(hopThu.daGui.filter((e) => e.noiDung.includes(id.slice(0, 8))).length, 1);
});

test('hết hàng → HUY kèm lý do (bù trừ của saga)', async () => {
  await datTon('sp-het', 0);
  const id = await datHang('sp-het');
  await choTrangThai(id, 'HUY');
  assert.equal((await layDon(id)).lyDo, 'Không đủ hàng');
});

test('sản phẩm không tồn tại → HUY', async () => {
  const id = await datHang('khong-co-that');
  await choTrangThai(id, 'HUY');
  assert.equal((await layDon(id)).lyDo, 'Sản phẩm không tồn tại');
});

test('dữ liệu sai → 400 ngay, không sinh sự kiện', async () => {
  const r = await fetch(`${donHang.url}/don-hang`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sanPhamId: 'x', soLuong: 0 }),
  });
  assert.equal(r.status, 400);
});

// ───────────────────────────── tranh chấp ─────────────────────────────

test('30 đơn tranh 5 món → đúng 5 XAC_NHAN, không bán âm', async () => {
  await datTon('sp-hiem', 5);
  const ids = await Promise.all(Array.from({ length: 30 }, () => datHang('sp-hiem')));
  await choDen(async () => {
    const tt = await Promise.all(ids.map(async (id) => (await layDon(id)).trangThai));
    return !tt.includes('CHO_XAC_NHAN');
  }, { ms: 10_000, moTa: '30 đơn ngã ngũ' });

  const tt = await Promise.all(ids.map(async (id) => (await layDon(id)).trangThai));
  assert.equal(tt.filter((t) => t === 'XAC_NHAN').length, 5);
  assert.equal(tt.filter((t) => t === 'HUY').length, 25);
  assert.equal(await tonKho('sp-hiem'), 0);
});

// ───────────────────────────── giao trùng ─────────────────────────────

test('GIAO TRÙNG: cùng message tới kho 2 lần → chỉ trừ tồn một lần', async () => {
  await datTon('sp-trung', 10);
  const id = await datHang('sp-trung', 2);
  await choTrangThai(id, 'XAC_NHAN');
  assert.equal(await tonKho('sp-trung'), 8);

  // Lấy đúng message outbox đã gửi và phát lại y nguyên (cùng messageId)
  const { rows } = await dbDonHang.query(
    "SELECT id, loai, du_lieu FROM outbox WHERE loai = 'don-hang.da-tao' AND du_lieu->>'donHangId' = $1", [id]
  );
  const phongBi = { id: rows[0].id, loai: rows[0].loai, duLieu: rows[0].du_lieu };
  for (let i = 0; i < 2; i++) {
    mqCh.publish(EXCHANGE, 'don-hang.da-tao', Buffer.from(JSON.stringify(phongBi)), { messageId: rows[0].id, persistent: true });
  }
  await ngu(500);
  assert.equal(await tonKho('sp-trung'), 8, 'tồn kho KHÔNG được trừ thêm');
  const { rows: giu } = await dbKho.query('SELECT count(*)::int AS n FROM giu_hang WHERE don_hang_id = $1', [id]);
  assert.equal(giu[0].n, 1);
});

// ───────────────────────────── sự cố ─────────────────────────────

test('KHO CHẾT: đơn nằm chờ trong hàng đợi; kho sống lại thì xử lý bù', async () => {
  await datTon('sp-cho', 5);
  await kho.dung();

  const id = await datHang('sp-cho');
  await choDen(async () => (await soMessage('kho.don-hang-da-tao')) === 1, { moTa: 'message nằm trong hàng đợi' });
  assert.equal((await layDon(id)).trangThai, 'CHO_XAC_NHAN', 'đặt hàng VẪN thành công dù kho đang chết');

  kho = await batKho();
  await choTrangThai(id, 'XAC_NHAN');
  assert.equal(await soMessage('kho.don-hang-da-tao'), 0);
});

test('OUTBOX: dịch vụ chết ngay sau COMMIT, trước khi publish → sống lại vẫn gửi', async () => {
  await datTon('sp-outbox', 5);
  await donHang.dung();

  // Giả lập đúng khoảnh khắc nguy hiểm: đơn + outbox ĐÃ commit, relay chưa kịp chạy
  const { rows } = await dbDonHang.query(
    "INSERT INTO don_hang (san_pham_id, so_luong, email) VALUES ('sp-outbox', 1, 'x@vd.vn') RETURNING id"
  );
  const id = rows[0].id;
  await dbDonHang.query(
    "INSERT INTO outbox (loai, du_lieu) VALUES ('don-hang.da-tao', $1)",
    [{ donHangId: id, sanPhamId: 'sp-outbox', soLuong: 1 }]
  );

  donHang = await batDonHang();
  await choTrangThai(id, 'XAC_NHAN');
  // Không kiểm "outbox rỗng" NGAY: lúc đơn vừa XAC_NHAN, sự kiện don-hang.da-xac-nhan
  // cũng vừa được ghi vào outbox và relay chưa kịp gửi. Hệ thống bất đồng bộ → phải CHỜ.
  await choDen(async () => {
    const { rows: con } = await dbDonHang.query('SELECT count(*)::int AS n FROM outbox WHERE da_gui_luc IS NULL');
    return con[0].n === 0;
  }, { moTa: 'outbox gửi hết' });
});

test('SMTP LỖI TẠM THỜI 2 lần → thử lại qua hàng đợi .thu-lai, lần 3 thành công', async () => {
  await datTon('sp-smtp', 5);
  hopThu.soLanHong = 2;
  const id = await datHang('sp-smtp', 1, 'smtp@vd.vn');
  await choDen(async () => hopThu.daGui.some((e) => e.email === 'smtp@vd.vn'), { moTa: 'email sau khi thử lại' });

  assert.equal(hopThu.soLanHong, 0);
  const { rows } = await dbThongBao.query('SELECT count(*)::int AS n FROM email_da_gui WHERE don_hang_id = $1', [id]);
  assert.equal(rows[0].n, 1, 'ROLLBACK ở hai lần lỗi → chỉ còn một bản ghi');
});

test('EMAIL SAI → vào DLQ ngay (không thử lại), đơn vẫn XAC_NHAN', async () => {
  await datTon('sp-dlq', 5);
  const truoc = await soMessage('thong-bao.don-hang-da-xac-nhan.dlq');
  const id = await datHang('sp-dlq', 1, 'khong-phai-email');
  await choTrangThai(id, 'XAC_NHAN');
  await choDen(async () => (await soMessage('thong-bao.don-hang-da-xac-nhan.dlq')) === truoc + 1, { moTa: 'message vào DLQ' });

  const msg = await mqCh.get('thong-bao.don-hang-da-xac-nhan.dlq', { noAck: true });
  assert.match(msg.properties.headers['x-loi-cuoi'], /Email không hợp lệ/);
  assert.equal(msg.properties.headers['x-so-lan-thu'], 1, 'lỗi vĩnh viễn không được thử lại');
});

test('MESSAGE RÁC (không phải JSON) → DLQ, consumer không chết', async () => {
  mqCh.publish(EXCHANGE, 'don-hang.da-tao', Buffer.from('{hỏng'), { messageId: crypto.randomUUID() });
  await choDen(async () => (await soMessage('kho.don-hang-da-tao.dlq')) >= 1, { moTa: 'message rác vào DLQ' });

  // Kho vẫn sống và xử lý tiếp bình thường
  await datTon('sp-sau-rac', 1);
  const id = await datHang('sp-sau-rac');
  await choTrangThai(id, 'XAC_NHAN');
});

test('metrics phản ánh message đã xử lý', async () => {
  const text = await (await fetch(`${kho.url}/metrics`)).text();
  assert.match(text, /messages_processed_total\{hang_doi="kho.don-hang-da-tao",ket_qua="thanh_cong",service="kho"\} \d+/);
  assert.match(text, /messages_processed_total\{hang_doi="kho.don-hang-da-tao",ket_qua="dlq",service="kho"\} 1/);
});
