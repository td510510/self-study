/**
 * Chạy nhà cung cấp và shop thật trên cổng ngẫu nhiên, rồi GIẢ LẬP TRÌNH DUYỆT
 * (giữ cookie, đi theo redirect bằng tay) để thấy từng bước của luồng.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { generateKeyPair, SignJWT } from 'jose';
import { taoNhaCungCap } from '../src/nha-cung-cap/app.js';
import { taoShop } from '../src/shop/app.js';
import { ngauNhien, sha256Base64Url } from '../src/lib/cookie.js';

let ncc, shop, issuer, shopUrl, redirectUri, mayChu = [];

async function moCong() {
  const s = http.createServer();
  await new Promise((r) => s.listen(0, '127.0.0.1', r));
  mayChu.push(s);
  return s;
}

before(async () => {
  const sNcc = await moCong();
  const sShop = await moCong();
  issuer = `http://127.0.0.1:${sNcc.address().port}`;
  shopUrl = `http://127.0.0.1:${sShop.address().port}`;
  redirectUri = `${shopUrl}/dang-nhap/oidc/callback`;

  ncc = await taoNhaCungCap({
    issuer,
    clients: {
      shop: { secret: 'bi-mat', redirectUris: [redirectUri] },
      'app-khac': { secret: 'khac', redirectUris: ['http://app-khac.vn/cb'] },
    },
  });
  sNcc.on('request', ncc);
  shop = await taoShop({ issuer, clientId: 'shop', clientSecret: 'bi-mat', redirectUri });
  sShop.on('request', shop);
});

after(() => mayChu.forEach((s) => s.close()));

/** Trình duyệt tối giản: nhớ cookie, không tự đi theo redirect. */
class TrinhDuyet {
  cookie = new Map();
  async goi(url, init = {}) {
    const res = await fetch(url, {
      ...init,
      redirect: 'manual',
      headers: { ...init.headers, cookie: [...this.cookie].map(([k, v]) => `${k}=${v}`).join('; ') },
    });
    for (const dong of res.headers.getSetCookie()) {
      const [cap] = dong.split(';');
      const [k, v] = cap.split('=');
      if (/Max-Age=0/i.test(dong)) this.cookie.delete(k);
      else this.cookie.set(k, v);
    }
    return res;
  }
}

/** Đi hết luồng tới khi nhà cung cấp redirect về callback. Trả về URL callback. */
async function denCallback(td, sub) {
  const r1 = await td.goi(`${shopUrl}/dang-nhap/oidc`);
  assert.equal(r1.status, 302);
  const authorize = new URL(r1.headers.get('location'));
  assert.equal(authorize.origin, issuer);

  // Người dùng bấm "Đồng ý" trên trang của nhà cung cấp
  const form = new URLSearchParams({ ...Object.fromEntries(authorize.searchParams), sub });
  const r2 = await td.goi(`${issuer}/authorize`, { method: 'POST', body: form });
  assert.equal(r2.status, 302);
  return r2.headers.get('location');
}

async function dangNhap(sub) {
  const td = new TrinhDuyet();
  const r = await td.goi(await denCallback(td, sub));
  if (r.status !== 302) return { status: r.status, body: await r.json() };
  const toi = await td.goi(new URL(r.headers.get('location'), shopUrl));
  return { status: toi.status, body: await toi.json() };
}

// ─────────────────────────── Luồng đúng ───────────────────────────

test('người dùng mới → tạo tài khoản', async () => {
  const { status, body } = await dangNhap('gg-1002');
  assert.equal(status, 200);
  assert.equal(body.cach, 'tao-moi');
  assert.equal(body.email, 'moi@vd.vn');
  assert.deepEqual(body.lienKet, [`${issuer}|gg-1002`]);
});

test('email ĐÃ xác minh trùng tài khoản cũ → liên kết; lần sau nhận ra bằng (iss, sub)', async () => {
  const lan1 = await dangNhap('gg-1001');
  assert.equal(lan1.body.id, 1);
  assert.equal(lan1.body.cach, 'lien-ket-moi');

  const lan2 = await dangNhap('gg-1001');
  assert.equal(lan2.body.id, 1);
  assert.equal(lan2.body.cach, 'da-lien-ket');
});

test('trình duyệt không bao giờ thấy access_token hay id_token', async () => {
  const td = new TrinhDuyet();
  const callback = await denCallback(td, 'gg-1002');
  assert.match(callback, /[?&]code=/);
  assert.doesNotMatch(callback, /token/);
  const r = await td.goi(callback);
  assert.doesNotMatch(r.headers.get('location'), /token/);
  assert.deepEqual([...td.cookie.keys()], ['phien']);
});

// ─────────────────────────── Tấn công ───────────────────────────

test('CHIẾM TÀI KHOẢN: email CHƯA xác minh trùng tài khoản cũ → 409', async () => {
  const { status, body } = await dangNhap('gg-6666');
  assert.equal(status, 409);
  assert.equal(body.ma, 'EMAIL_CHUA_XAC_MINH');
});

test('CSRF đăng nhập: nạn nhân mở link callback của kẻ tấn công → bị chặn', async () => {
  const keTanCong = new TrinhDuyet();
  const linkDoc = await denCallback(keTanCong, 'gg-1002'); // kẻ tấn công KHÔNG mở, mà gửi cho nạn nhân

  // Nạn nhân chưa từng bắt đầu đăng nhập
  const nanNhan = new TrinhDuyet();
  const r1 = await nanNhan.goi(linkDoc);
  assert.equal(r1.status, 400);
  assert.equal((await r1.json()).ma, 'LUONG_DANG_NHAP_KHONG_HOP_LE');

  // Nạn nhân đang giữa luồng đăng nhập của CHÍNH MÌNH → state không khớp
  const nanNhan2 = new TrinhDuyet();
  await nanNhan2.goi(`${shopUrl}/dang-nhap/oidc`);
  const r2 = await nanNhan2.goi(linkDoc);
  assert.equal(r2.status, 400);
  assert.equal((await r2.json()).ma, 'STATE_SAI');
});

test('người dùng bấm "Từ chối" ở nhà cung cấp', async () => {
  const td = new TrinhDuyet();
  const r1 = await td.goi(`${shopUrl}/dang-nhap/oidc`);
  const state = new URL(r1.headers.get('location')).searchParams.get('state');
  const r = await td.goi(`${redirectUri}?error=access_denied&state=${state}`);
  assert.equal(r.status, 400);
  assert.equal((await r.json()).ma, 'NHA_CUNG_CAP_TU_CHOI');
});

test('nhà cung cấp KHÔNG redirect tới redirect_uri chưa đăng ký', async () => {
  const u = new URL(`${issuer}/authorize`);
  u.search = new URLSearchParams({
    client_id: 'shop', redirect_uri: 'https://ke-tan-cong.vn/cb', response_type: 'code',
    code_challenge: 'x', code_challenge_method: 'S256',
  });
  const r = await fetch(u, { redirect: 'manual' });
  assert.equal(r.status, 400);
  assert.equal(r.headers.get('location'), null);
});

test('nhà cung cấp bắt buộc PKCE', async () => {
  const u = new URL(`${issuer}/authorize`);
  u.search = new URLSearchParams({ client_id: 'shop', redirect_uri: redirectUri, response_type: 'code', state: 's' });
  const r = await fetch(u, { redirect: 'manual' });
  assert.match(r.headers.get('location'), /error=invalid_request/);
});

// ─── Đổi code trực tiếp với nhà cung cấp (đóng vai server của shop) ───

async function layCode(verifier) {
  const form = new URLSearchParams({
    client_id: 'shop', redirect_uri: redirectUri, sub: 'gg-1002', nonce: 'n',
    code_challenge: sha256Base64Url(verifier), state: 's',
  });
  const r = await fetch(`${issuer}/authorize`, { method: 'POST', body: form, redirect: 'manual' });
  return new URL(r.headers.get('location')).searchParams.get('code');
}

const doiCode = (code, verifier, secret = 'bi-mat') =>
  fetch(`${issuer}/token`, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'authorization_code', code, redirect_uri: redirectUri,
      client_id: 'shop', client_secret: secret, code_verifier: verifier,
    }),
  });

test('code chỉ dùng được MỘT lần', async () => {
  const v = ngauNhien();
  const code = await layCode(v);
  assert.equal((await doiCode(code, v)).status, 200);
  const lan2 = await doiCode(code, v);
  assert.equal(lan2.status, 400);
  assert.match((await lan2.json()).error_description, /đã dùng/);
});

test('PKCE: code bị đánh cắp vô dụng nếu không có code_verifier', async () => {
  const code = await layCode(ngauNhien());
  const r = await doiCode(code, ngauNhien()); // kẻ trộm đoán verifier
  assert.equal(r.status, 400);
  assert.match((await r.json()).error_description, /PKCE/);
});

test('client_secret sai → 401', async () => {
  const v = ngauNhien();
  const r = await doiCode(await layCode(v), v, 'doan-bua');
  assert.equal(r.status, 401);
});

// ─────────────────── Kiểm id_token phía shop ───────────────────

test('id_token cấp cho APP KHÁC (aud sai) bị từ chối', async () => {
  const token = await ncc.locals.kyThu({ sub: 'gg-1001', nonce: 'n' }, { aud: 'app-khac' });
  const kq = await shop.locals.kiemIdToken(token, 'n');
  assert.equal(kq.ma, 'ID_TOKEN_KHONG_HOP_LE');
  assert.equal(kq.loi, 'ERR_JWT_CLAIM_VALIDATION_FAILED');
});

test('id_token ký bằng khoá KHÁC (giả mạo) bị từ chối', async () => {
  const { privateKey } = await generateKeyPair('RS256');
  const gia = await new SignJWT({ sub: 'gg-1001', nonce: 'n' })
    .setProtectedHeader({ alg: 'RS256', kid: 'gia' })
    .setIssuer(issuer).setAudience('shop').setExpirationTime('5m')
    .sign(privateKey);
  const kq = await shop.locals.kiemIdToken(gia, 'n');
  assert.equal(kq.ma, 'ID_TOKEN_KHONG_HOP_LE');
});

test('id_token alg "none" bị từ chối', async () => {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const none = `${b64({ alg: 'none' })}.${b64({ iss: issuer, aud: 'shop', sub: 'gg-1001', nonce: 'n', exp: 9e9 })}.`;
  const kq = await shop.locals.kiemIdToken(none, 'n');
  assert.equal(kq.ma, 'ID_TOKEN_KHONG_HOP_LE');
});

test('id_token đúng nhưng nonce khác (phát lại) bị từ chối', async () => {
  const token = await ncc.locals.kyThu({ sub: 'gg-1001', nonce: 'cua-luong-khac' }, { aud: 'shop' });
  const kq = await shop.locals.kiemIdToken(token, 'n');
  assert.equal(kq.ma, 'NONCE_SAI');
});
