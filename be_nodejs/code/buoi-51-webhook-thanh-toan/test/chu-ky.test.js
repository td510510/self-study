import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kyWebhook, xacMinhChuKy } from '../src/lib/chu-ky.js';

const secret = 'whsec_test';
const body = '{"id":"evt_1","loai":"thanh-toan.thanh-cong","duLieu":{"soTien":250000}}';

test('chữ ký đúng → hợp lệ', () => {
  assert.deepEqual(xacMinhChuKy({ secret, header: kyWebhook(secret, body), rawBody: body }), { hopLe: true });
});

test('sửa MỘT ký tự trong body → chữ ký không khớp', () => {
  const header = kyWebhook(secret, body);
  const sua = body.replace('250000', '250001');
  assert.equal(xacMinhChuKy({ secret, header, rawBody: sua }).lyDo, 'chữ ký không khớp');
});

test('ký bằng secret khác → không khớp', () => {
  assert.equal(xacMinhChuKy({ secret, header: kyWebhook('doan-bua', body), rawBody: body }).hopLe, false);
});

test('sửa timestamp để "làm mới" chữ ký cũ → không khớp (timestamp nằm trong phần được ký)', () => {
  const cu = Math.floor(Date.now() / 1000) - 3600;
  const header = kyWebhook(secret, body, cu).replace(`t=${cu}`, `t=${Math.floor(Date.now() / 1000)}`);
  assert.equal(xacMinhChuKy({ secret, header, rawBody: body }).lyDo, 'chữ ký không khớp');
});

test('chữ ký cũ hơn 5 phút → từ chối (chống phát lại)', () => {
  const t = Math.floor(Date.now() / 1000) - 301;
  assert.match(xacMinhChuKy({ secret, header: kyWebhook(secret, body, t), rawBody: body }).lyDo, /quá cũ/);
});

test('thiếu header / sai định dạng / v1 khác độ dài không làm crash', () => {
  assert.equal(xacMinhChuKy({ secret, header: undefined, rawBody: body }).hopLe, false);
  assert.equal(xacMinhChuKy({ secret, header: 'rac', rawBody: body }).hopLe, false);
  const t = Math.floor(Date.now() / 1000);
  assert.equal(xacMinhChuKy({ secret, header: `t=${t},v1=abcd`, rawBody: body }).hopLe, false);
});

test('BẪY: parse rồi stringify lại KHÔNG cho ra body gốc → chữ ký sai', () => {
  // Cổng thanh toán gửi JSON có khoảng trắng và ký tự \u escape — hoàn toàn hợp lệ
  const goc = '{"id": "evt_2", "ten": "\\u00c1o thun"}';
  const header = kyWebhook(secret, goc);
  const taoLai = JSON.stringify(JSON.parse(goc)); // việc express.json() + code "tiện tay" làm

  assert.notEqual(taoLai, goc);
  assert.equal(xacMinhChuKy({ secret, header, rawBody: taoLai }).hopLe, false);
  assert.equal(xacMinhChuKy({ secret, header, rawBody: goc }).hopLe, true);
});

test('body đã bị parse thành object → báo lỗi rõ ràng thay vì so sai', () => {
  const kq = xacMinhChuKy({ secret, header: kyWebhook(secret, body), rawBody: JSON.parse(body) });
  assert.match(kq.lyDo, /express\.json/);
});
