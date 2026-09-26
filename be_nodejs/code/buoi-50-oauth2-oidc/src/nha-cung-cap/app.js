/**
 * NHÀ CUNG CẤP OIDC MINI — đóng vai "Google" để học mà không cần Internet.
 *
 * ⚠️ ĐÂY LÀ CODE HỌC TẬP. Đừng bao giờ tự viết authorization server cho
 * production — dùng Keycloak, Auth0, Cognito, hoặc Google/GitHub thật.
 * Ta viết nó để NHÌN THẤY từng bước mà nhà cung cấp thật che đi.
 *
 * Các endpoint (đúng tên chuẩn, để shop dùng discovery như với Google):
 *
 *   GET  /.well-known/openid-configuration   → "danh bạ" các endpoint
 *   GET  /authorize                          → trang đăng nhập + đồng ý
 *   POST /authorize                          → người dùng bấm "Đồng ý" → redirect kèm code
 *   POST /token                              → đổi code lấy token (server ↔ server)
 *   GET  /jwks                               → khoá CÔNG KHAI để kiểm chữ ký id_token
 *   GET  /userinfo                           → thông tin người dùng theo access_token
 */

import express from 'express';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { ngauNhien, sha256Base64Url } from '../lib/cookie.js';

const NGUOI_DUNG = [
  { sub: 'gg-1001', email: 'an@vd.vn', email_verified: true, name: 'Nguyễn An' },
  { sub: 'gg-1002', email: 'moi@vd.vn', email_verified: true, name: 'Người Mới' },
  // Kẻ tấn công tạo tài khoản ở nhà cung cấp với email CỦA NẠN NHÂN nhưng chưa xác minh
  { sub: 'gg-6666', email: 'binh@vd.vn', email_verified: false, name: 'Kẻ mạo danh Bình' },
];

const HAN_CODE_MS = 60_000;

/**
 * @param {object} opts
 * @param {string} opts.issuer
 * @param {Record<string, { secret: string, redirectUris: string[] }>} opts.clients
 */
export async function taoNhaCungCap({ issuer, clients }) {
  // Cặp khoá RSA: khoá RIÊNG ký id_token, khoá CÔNG KHAI công bố ở /jwks.
  // Shop chỉ cần khoá công khai → không thể giả mạo token, chỉ kiểm được.
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const kid = ngauNhien(8);
  const jwk = { ...(await exportJWK(publicKey)), kid, alg: 'RS256', use: 'sig' };

  const maCho = new Map();       // code → thông tin cấp phép (dùng MỘT lần)
  const accessTokens = new Map(); // access_token → sub

  const app = express();
  app.use(express.urlencoded({ extended: false }));

  app.get('/.well-known/openid-configuration', (req, res) => {
    res.json({
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      jwks_uri: `${issuer}/jwks`,
      userinfo_endpoint: `${issuer}/userinfo`,
      response_types_supported: ['code'],
      code_challenge_methods_supported: ['S256'],
      id_token_signing_alg_values_supported: ['RS256'],
    });
  });

  app.get('/jwks', (req, res) => res.json({ keys: [jwk] }));

  app.get('/authorize', (req, res) => {
    const q = req.query;
    const client = clients[q.client_id];

    // ⚠️ redirect_uri SAI thì hiện lỗi, TUYỆT ĐỐI KHÔNG redirect.
    // Redirect tới một URI lạ = gửi code thẳng cho kẻ tấn công.
    // So khớp CHÍNH XÁC từng ký tự — không so tiền tố, không cho wildcard.
    if (!client) return res.status(400).send('client_id không tồn tại');
    if (!client.redirectUris.includes(q.redirect_uri)) {
      return res.status(400).send('redirect_uri không nằm trong danh sách đã đăng ký');
    }

    // Từ đây trở đi redirect_uri đã tin được → lỗi thì trả về qua redirect
    const loi = (ma) => {
      const u = new URL(q.redirect_uri);
      u.searchParams.set('error', ma);
      if (q.state) u.searchParams.set('state', q.state);
      return res.redirect(u.href);
    };
    if (q.response_type !== 'code') return loi('unsupported_response_type');
    if (!q.code_challenge || q.code_challenge_method !== 'S256') return loi('invalid_request');

    const an = (s = '') => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    const truongAn = ['client_id', 'redirect_uri', 'state', 'nonce', 'code_challenge', 'scope']
      .map((k) => `<input type="hidden" name="${k}" value="${an(q[k])}">`)
      .join('');

    // Trang đăng nhập giả lập: chọn tài khoản thay vì gõ mật khẩu.
    res.type('html').send(`<!doctype html><meta charset="utf-8">
      <title>Đăng nhập — Nhà cung cấp mini</title>
      <h2>Nhà cung cấp mini</h2>
      <p>Ứng dụng <b>${an(q.client_id)}</b> muốn biết: <code>${an(q.scope)}</code></p>
      ${NGUOI_DUNG.map((u) => `<form method="post" action="/authorize">${truongAn}
        <button name="sub" value="${u.sub}">Đồng ý với tư cách ${an(u.name)} (${u.email}${u.email_verified ? '' : ', CHƯA xác minh'})</button>
      </form>`).join('')}`);
  });

  app.post('/authorize', (req, res) => {
    const b = req.body;
    const client = clients[b.client_id];
    if (!client || !client.redirectUris.includes(b.redirect_uri)) return res.status(400).send('Yêu cầu sai');
    if (!NGUOI_DUNG.some((u) => u.sub === b.sub)) return res.status(400).send('Không có người dùng');

    const code = ngauNhien();
    maCho.set(code, {
      clientId: b.client_id,
      redirectUri: b.redirect_uri,
      sub: b.sub,
      nonce: b.nonce,
      codeChallenge: b.code_challenge,
      het: Date.now() + HAN_CODE_MS,
    });

    const u = new URL(b.redirect_uri);
    u.searchParams.set('code', code);
    if (b.state) u.searchParams.set('state', b.state);
    res.redirect(u.href);
  });

  app.post('/token', async (req, res) => {
    const b = req.body;
    const tuChoi = (mo_ta) => res.status(400).json({ error: 'invalid_grant', error_description: mo_ta });

    if (b.grant_type !== 'authorization_code') return res.status(400).json({ error: 'unsupported_grant_type' });

    // Xác thực CLIENT: chỉ server của shop biết client_secret
    const client = clients[b.client_id];
    if (!client || client.secret !== b.client_secret) {
      return res.status(401).json({ error: 'invalid_client' });
    }

    const cho = maCho.get(b.code);
    // Xoá NGAY, trước mọi kiểm tra khác → code chỉ dùng được MỘT lần,
    // kể cả khi lần dùng đầu thất bại.
    maCho.delete(b.code);

    if (!cho) return tuChoi('code không tồn tại hoặc đã dùng');
    if (cho.het < Date.now()) return tuChoi('code đã hết hạn');
    if (cho.clientId !== b.client_id) return tuChoi('code cấp cho client khác');
    if (cho.redirectUri !== b.redirect_uri) return tuChoi('redirect_uri không khớp');

    // PKCE: chứng minh người đổi code CHÍNH LÀ người đã bắt đầu luồng
    if (!b.code_verifier || sha256Base64Url(b.code_verifier) !== cho.codeChallenge) {
      return tuChoi('code_verifier sai (PKCE)');
    }

    const nd = NGUOI_DUNG.find((u) => u.sub === cho.sub);
    const idToken = await new SignJWT({
      email: nd.email,
      email_verified: nd.email_verified,
      name: nd.name,
      nonce: cho.nonce,
    })
      .setProtectedHeader({ alg: 'RS256', kid })
      .setIssuer(issuer)
      .setSubject(nd.sub)
      .setAudience(b.client_id)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    const accessToken = ngauNhien();
    accessTokens.set(accessToken, nd.sub);

    res.json({ access_token: accessToken, token_type: 'Bearer', expires_in: 300, id_token: idToken });
  });

  app.get('/userinfo', (req, res) => {
    const token = req.headers.authorization?.replace(/^Bearer /, '');
    const sub = accessTokens.get(token);
    if (!sub) return res.status(401).json({ error: 'invalid_token' });
    res.json(NGUOI_DUNG.find((u) => u.sub === sub));
  });

  /** Chỉ dành cho test: ký một id_token tuỳ ý bằng khoá THẬT của nhà cung cấp. */
  app.locals.kyThu = (payload, { aud, iss = issuer } = {}) =>
    new SignJWT(payload)
      .setProtectedHeader({ alg: 'RS256', kid })
      .setIssuer(iss)
      .setAudience(aud)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

  return app;
}
