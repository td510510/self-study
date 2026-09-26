/**
 * Chạy cổng thanh toán + shop thật trên cổng ngẫu nhiên.
 * Lịch thử lại rút ngắn còn vài chục ms để test nhanh.
 */

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { taoCongThanhToan } from '../src/cong-thanh-toan/app.js';
import { taoShop } from '../src/shop/app.js';
import { kyWebhook } from '../src/lib/chu-ky.js';

const SECRET = 'whsec_test';
const imLang = { warn() {}, error() {} };
let cong, shop, congUrl, shopUrl, mayChu = [];

async function chay(app) {
  const s = http.createServer(app);
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  mayChu.push(s);
  return `http://127.0.0.1:${s.address().port}`;
}

before(async () => {
  const cauHinh = { apiKey: 'sk_test', webhookSecret: SECRET, lichThuLai: [0, 20, 40, 80], timeoutMs: 1000 };
  cong = taoCongThanhToan(cauHinh);
  congUrl = await chay(cong);
  // shopUrl chưa biết trước khi listen → tạo server rỗng trước, gắn app sau
  const s = http.createServer();
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  mayChu.push(s);
  shopUrl = `http://127.0.0.1:${s.address().port}`;
  shop = taoShop({ congUrl, apiKey: 'sk_test', webhookSecret: SECRET, shopUrl, logger: imLang });
  s.on('request', shop);
  cauHinh.webhookUrl = `${shopUrl}/webhook/thanh-toan`;
  cong.locals.cauHinh = cauHinh;
});

after(() => mayChu.forEach((s) => s.close()));
beforeEach(() => {
  cong.locals.cauHinh.matWebhook = false;
});

const json = (r) => r.json();
const ngu = (ms) => new Promise((r) => setTimeout(r, ms));

async function choDen(dieuKien, ms = 2000) {
  const het = Date.now() + ms;
  while (Date.now() < het) {
    if (await dieuKien()) return;
    await ngu(10);
  }
  throw new Error('Hết thời gian chờ');
}

async function taoDon(soTien = 250_000) {
  return json(await fetch(`${shopUrl}/don-hang`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ soTien }),
  }));
}

/** Khách bấm nút trên trang cổng thanh toán; trả về URL cổng redirect về. */
async function khachBam(urlThanhToan, ketQua) {
  const r = await fetch(urlThanhToan, {
    method: 'POST', body: new URLSearchParams({ ketQua }), redirect: 'manual',
  });
  return r.headers.get('location');
}

const layDon = async (id) => json(await fetch(`${shopUrl}/don-hang/${id}`));

async function guiWebhookTay(suKien, { secret = SECRET, t } = {}) {
  const body = JSON.stringify(suKien);
  return fetch(`${shopUrl}/webhook/thanh-toan`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-chu-ky': kyWebhook(secret, body, t) },
    body,
  });
}

// ─────────────────────────── Luồng chuẩn ───────────────────────────

test('trả tiền → webhook → đơn DA_THANH_TOAN, gửi email một lần', async () => {
  const { donHangId, urlThanhToan } = await taoDon();
  assert.equal((await layDon(donHangId)).trangThai, 'CHO_THANH_TOAN');

  await khachBam(urlThanhToan, 'thanh-cong');
  await choDen(async () => (await layDon(donHangId)).trangThai === 'DA_THANH_TOAN');
  assert.deepEqual(shop.locals.emailDaGui.filter((id) => id === donHangId), [donHangId]);
});

test('thẻ bị từ chối → THAT_BAI', async () => {
  const { donHangId, urlThanhToan } = await taoDon();
  await khachBam(urlThanhToan, 'that-bai');
  await choDen(async () => (await layDon(donHangId)).trangThai === 'THAT_BAI');
});

// ─────────────────────────── Tấn công ───────────────────────────

test('TỰ GÕ URL "?trangThai=thanh-cong" không làm đơn thành đã trả', async () => {
  cong.locals.cauHinh.matWebhook = true; // để chắc chắn không có webhook nào chen vào
  const { donHangId } = await taoDon();
  const r = await json(await fetch(`${shopUrl}/thanh-toan/ket-qua?donHangId=${donHangId}&trangThai=thanh-cong`));
  assert.equal(r.trangThai, 'CHO_THANH_TOAN');
  assert.equal((await layDon(donHangId)).trangThai, 'CHO_THANH_TOAN');
});

test('webhook GIẢ (không chữ ký / ký sai secret) → 401, đơn không đổi', async () => {
  const { donHangId } = await taoDon();
  const don = await layDon(donHangId);
  const suKien = { id: 'evt_gia', loai: 'thanh-toan.thanh-cong', duLieu: { donHangId, phienId: don.phienId, soTien: don.soTien } };

  const khongKy = await fetch(`${shopUrl}/webhook/thanh-toan`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(suKien),
  });
  assert.equal(khongKy.status, 401);
  assert.equal((await guiWebhookTay(suKien, { secret: 'doan-bua' })).status, 401);
  assert.equal((await layDon(donHangId)).trangThai, 'CHO_THANH_TOAN');
});

test('PHÁT LẠI webhook hợp lệ nhưng cũ → 401', async () => {
  const { donHangId } = await taoDon();
  const don = await layDon(donHangId);
  const cu = Math.floor(Date.now() / 1000) - 3600;
  const r = await guiWebhookTay(
    { id: 'evt_cu', loai: 'thanh-toan.thanh-cong', duLieu: { donHangId, phienId: don.phienId, soTien: don.soTien } },
    { t: cu }
  );
  assert.equal(r.status, 401);
  assert.match((await r.json()).loi, /quá cũ/);
});

// ─────────────────── Mạng không hoàn hảo ───────────────────

test('GỬI TRÙNG: cùng sự kiện tới 3 lần → xử lý đúng một lần', async () => {
  const { donHangId, urlThanhToan } = await taoDon();
  await khachBam(urlThanhToan, 'thanh-cong');
  await choDen(async () => (await layDon(donHangId)).trangThai === 'DA_THANH_TOAN');

  // Cổng gửi lại chính sự kiện đó (vd: shop trả 200 nhưng gói tin bị mất trên đường về)
  const daGui = cong.locals.nhatKy.find((n) => n.loai === 'thanh-toan.thanh-cong');
  const don = await layDon(donHangId);
  const suKien = { id: daGui.suKienId, loai: daGui.loai, duLieu: { donHangId, phienId: don.phienId, soTien: don.soTien } };
  for (let i = 0; i < 2; i++) {
    const r = await json(await guiWebhookTay(suKien));
    assert.equal(r.trungLap, true);
  }
  assert.equal(shop.locals.emailDaGui.filter((id) => id === donHangId).length, 1);
});

test('SAI THỨ TỰ: "thất bại" tới SAU "thành công" không kéo lùi trạng thái', async () => {
  const { donHangId } = await taoDon();
  const don = await layDon(donHangId);
  const duLieu = { donHangId, phienId: don.phienId, soTien: don.soTien };

  await guiWebhookTay({ id: 'evt_a1', loai: 'thanh-toan.thanh-cong', duLieu });
  await guiWebhookTay({ id: 'evt_a0', loai: 'thanh-toan.that-bai', duLieu }); // lần thử thẻ trước đó, tới muộn

  const sau = await layDon(donHangId);
  assert.equal(sau.trangThai, 'DA_THANH_TOAN');
  assert.deepEqual(sau.lichSu.at(-1), { bo_qua: 'DA_THANH_TOAN → THAT_BAI', nguon: 'webhook:evt_a0' });
});

test('SỐ TIỀN LỆCH → CAN_KIEM_TRA, không giao hàng', async () => {
  const { donHangId } = await taoDon(1_000_000);
  const don = await layDon(donHangId);
  await guiWebhookTay({ id: 'evt_lech', loai: 'thanh-toan.thanh-cong', duLieu: { donHangId, phienId: don.phienId, soTien: 1_000 } });
  assert.equal((await layDon(donHangId)).trangThai, 'CAN_KIEM_TRA');
  assert.ok(!shop.locals.emailDaGui.includes(donHangId));
});

test('SHOP SẬP TẠM THỜI: cổng tự gửi lại tới khi nhận 2xx', async () => {
  shop.locals.giaLapHong(2); // hai lần đầu trả 503
  const { donHangId, urlThanhToan } = await taoDon();
  await khachBam(urlThanhToan, 'thanh-cong');
  await choDen(async () => (await layDon(donHangId)).trangThai === 'DA_THANH_TOAN');

  const lanGui = cong.locals.nhatKy.filter((n) => n.suKienId === cong.locals.nhatKy.at(-1).suKienId);
  assert.deepEqual(lanGui.map((n) => n.status), [503, 503, 200]);
});

test('WEBHOOK MẤT HẲN: đối soát phát hiện và sửa', async () => {
  cong.locals.cauHinh.matWebhook = true;
  const { donHangId, urlThanhToan } = await taoDon();
  await khachBam(urlThanhToan, 'thanh-cong');
  await ngu(100);
  assert.equal((await layDon(donHangId)).trangThai, 'CHO_THANH_TOAN', 'khách đã trả tiền mà đơn vẫn chờ!');

  assert.ok((await shop.locals.doiSoat()) >= 1);
  const sau = await layDon(donHangId);
  assert.equal(sau.trangThai, 'DA_THANH_TOAN');
  assert.equal(sau.lichSu.at(-1).nguon, 'doi-soat');
});
