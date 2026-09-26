/**
 * SHOP — ứng dụng muốn cho khách "Đăng nhập bằng Google".
 *
 * Luồng Authorization Code + PKCE (luồng DUY NHẤT nên dùng cho web app ngày nay):
 *
 *   Trình duyệt          Shop (server này)              Nhà cung cấp
 *       │  GET /dang-nhap/oidc   │                             │
 *       │───────────────────────▶│ sinh state, nonce, verifier │
 *       │◀── 302 tới /authorize ─│ (lưu phía server)           │
 *       │─────────────────────────────────────────────────────▶│ đăng nhập + đồng ý
 *       │◀──────────── 302 về /callback?code=…&state=… ────────│
 *       │  GET /callback         │                             │
 *       │───────────────────────▶│ kiểm state                  │
 *       │                        │── POST /token (code+verifier+secret) ─▶│
 *       │                        │◀──────── id_token, access_token ───────│
 *       │                        │ kiểm chữ ký, iss, aud, exp, nonce      │
 *       │◀── 302 /toi + cookie ──│ tìm/tạo tài khoản, tạo phiên           │
 *
 * Để ý: TOKEN KHÔNG BAO GIỜ đi qua trình duyệt. Trình duyệt chỉ cầm `code`
 * — thứ vô dụng nếu không có client_secret VÀ code_verifier.
 */

import express from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { docCookie, ngauNhien, sha256Base64Url } from '../lib/cookie.js';

const HAN_DANG_NHAP_MS = 10 * 60_000;

export async function taoShop({ issuer, clientId, clientSecret, redirectUri }) {
  // DISCOVERY: hỏi nhà cung cấp "endpoint của anh ở đâu?" thay vì hard-code.
  // Nhờ vậy đổi sang Google/Keycloak chỉ cần đổi OIDC_ISSUER.
  const res = await fetch(`${issuer}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`Không đọc được discovery của ${issuer}: HTTP ${res.status}`);
  const cauHinh = await res.json();

  // Tải khoá công khai từ jwks_uri, cache lại, tự tải lại khi gặp `kid` lạ
  // (nhà cung cấp xoay khoá định kỳ — Google làm việc này vài tuần một lần).
  const JWKS = createRemoteJWKSet(new URL(cauHinh.jwks_uri));

  // ── "Database" trong bộ nhớ ──
  const taiKhoan = new Map([
    [1, { id: 1, email: 'an@vd.vn', ten: 'An (đăng ký bằng mật khẩu từ trước)', lienKet: [] }],
    [2, { id: 2, email: 'binh@vd.vn', ten: 'Bình (nạn nhân tiềm năng)', lienKet: [] }],
  ]);
  let idTiepTheo = 3;
  const choDangNhap = new Map(); // id tạm → { state, nonce, verifier, het }
  const phien = new Map();        // id phiên → id tài khoản

  const app = express();

  const loi = (res, status, ma, chiTiet) => res.status(status).json({ ma, loi: chiTiet });

  app.get('/', (req, res) => {
    res.type('html').send('<!doctype html><meta charset="utf-8"><h1>Shop</h1><a href="/dang-nhap/oidc">Đăng nhập bằng nhà cung cấp</a>');
  });

  // ── Bước 1: bắt đầu luồng ──
  app.get('/dang-nhap/oidc', (req, res) => {
    const state = ngauNhien();     // chống CSRF đăng nhập
    const nonce = ngauNhien();     // chống phát lại id_token
    const verifier = ngauNhien();  // PKCE: bí mật chỉ server này biết

    const idTam = ngauNhien();
    choDangNhap.set(idTam, { state, nonce, verifier, het: Date.now() + HAN_DANG_NHAP_MS });

    // SameSite=Lax (không phải Strict!): lúc nhà cung cấp redirect VỀ, đó là
    // điều hướng từ MIỀN KHÁC. Strict sẽ không gửi cookie → callback không tìm
    // thấy luồng đăng nhập. Lax vẫn gửi cho điều hướng GET cấp cao nhất.
    res.setHeader('Set-Cookie', `oidc_tam=${idTam}; HttpOnly; SameSite=Lax; Path=/dang-nhap; Max-Age=600`);

    const u = new URL(cauHinh.authorization_endpoint);
    u.search = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid email profile',
      state,
      nonce,
      code_challenge: sha256Base64Url(verifier),
      code_challenge_method: 'S256',
    }).toString();
    res.redirect(u.href);
  });

  // ── Bước 2: nhà cung cấp gọi về ──
  app.get('/dang-nhap/oidc/callback', async (req, res, next) => {
    try {
      const idTam = docCookie(req).oidc_tam;
      const cho = choDangNhap.get(idTam);
      choDangNhap.delete(idTam); // dùng MỘT lần, dù thành công hay thất bại
      res.setHeader('Set-Cookie', 'oidc_tam=; HttpOnly; SameSite=Lax; Path=/dang-nhap; Max-Age=0');

      if (!cho || cho.het < Date.now()) {
        return loi(res, 400, 'LUONG_DANG_NHAP_KHONG_HOP_LE', 'Không tìm thấy luồng đăng nhập (hết hạn hoặc không do trình duyệt này bắt đầu)');
      }
      if (req.query.error) return loi(res, 400, 'NHA_CUNG_CAP_TU_CHOI', String(req.query.error));

      // CSRF đăng nhập: kẻ tấn công gửi cho nạn nhân link callback chứa code
      // CỦA KẺ TẤN CÔNG → nạn nhân bị đăng nhập vào tài khoản kẻ tấn công,
      // rồi nhập số thẻ vào đó. state ràng buộc callback với ĐÚNG trình duyệt đã bắt đầu.
      if (req.query.state !== cho.state) return loi(res, 400, 'STATE_SAI', 'state không khớp');

      // Đổi code lấy token — SERVER gọi SERVER, trình duyệt không thấy gì
      const tokenRes = await fetch(cauHinh.token_endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: String(req.query.code ?? ''),
          redirect_uri: redirectUri,
          client_id: clientId,
          client_secret: clientSecret,
          code_verifier: cho.verifier,
        }),
      });
      const token = await tokenRes.json();
      if (!tokenRes.ok) return loi(res, 400, 'DOI_CODE_THAT_BAI', token.error_description ?? token.error);

      const claims = await kiemIdToken(token.id_token, cho.nonce);
      if (claims.loi) return loi(res, 401, claims.ma, claims.loi);

      const kq = timHoacTaoTaiKhoan(claims);
      if (kq.loi) return loi(res, 409, kq.ma, kq.loi);

      const idPhien = ngauNhien();
      phien.set(idPhien, kq.taiKhoan.id);
      res.append('Set-Cookie', `phien=${idPhien}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`);
      res.redirect(`/toi?cach=${kq.cach}`);
    } catch (err) {
      next(err);
    }
  });

  /**
   * Kiểm id_token. BỎ BẤT KỲ DÒNG NÀO cũng là một lỗ hổng:
   *   · chữ ký  → ai cũng tự tạo token được
   *   · iss     → token của nhà cung cấp khác
   *   · aud     → token cấp cho APP KHÁC (app độc hại xin token của khách rồi đem sang đây)
   *   · exp     → token cũ bị lộ dùng mãi được
   *   · nonce   → token bị bắt được đem phát lại vào luồng khác
   */
  async function kiemIdToken(idToken, nonce) {
    try {
      const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: cauHinh.issuer,
        audience: clientId,
        algorithms: ['RS256'], // chặn tấn công đổi alg (vd "none", hoặc HS256 dùng khoá công khai làm secret)
      });
      if (payload.nonce !== nonce) return { ma: 'NONCE_SAI', loi: 'nonce không khớp' };
      return payload;
    } catch (err) {
      return { ma: 'ID_TOKEN_KHONG_HOP_LE', loi: err.code ?? err.message };
    }
  }

  /**
   * Liên kết danh tính ngoài với tài khoản trong shop.
   *
   * ⚠️ KHOÁ ĐỊNH DANH LÀ (iss, sub) — KHÔNG PHẢI email.
   *   · email đổi được; sub thì không bao giờ đổi
   *   · hai nhà cung cấp khác nhau có thể cùng một sub → phải kèm iss
   */
  function timHoacTaoTaiKhoan({ iss, sub, email, email_verified, name }) {
    const khoa = `${iss}|${sub}`;

    for (const tk of taiKhoan.values()) {
      if (tk.lienKet.includes(khoa)) return { taiKhoan: tk, cach: 'da-lien-ket' };
    }

    const trungEmail = [...taiKhoan.values()].find((tk) => tk.email === email);
    if (trungEmail) {
      // CHIẾM TÀI KHOẢN: kẻ tấn công đăng ký ở nhà cung cấp bằng email của nạn nhân
      // (chưa xác minh) → nếu ta tự liên kết theo email, kẻ tấn công vào thẳng
      // tài khoản nạn nhân mà không cần mật khẩu.
      if (email_verified !== true) {
        return { ma: 'EMAIL_CHUA_XAC_MINH', loi: 'Email này đã có tài khoản; nhà cung cấp chưa xác minh bạn sở hữu nó' };
      }
      trungEmail.lienKet.push(khoa);
      return { taiKhoan: trungEmail, cach: 'lien-ket-moi' };
    }

    const moi = { id: idTiepTheo++, email, ten: name, lienKet: [khoa] };
    taiKhoan.set(moi.id, moi);
    return { taiKhoan: moi, cach: 'tao-moi' };
  }

  app.get('/toi', (req, res) => {
    const tk = taiKhoan.get(phien.get(docCookie(req).phien));
    if (!tk) return loi(res, 401, 'CHUA_DANG_NHAP', 'Cần đăng nhập');
    res.json({ id: tk.id, email: tk.email, ten: tk.ten, lienKet: tk.lienKet, cach: req.query.cach });
  });

  // Lộ ra cho test gọi trực tiếp (thử token giả mạo mà không cần đi hết luồng)
  app.locals.kiemIdToken = kiemIdToken;

  app.use((err, req, res, _next) => {
    console.error(err);
    loi(res, 500, 'LOI_HE_THONG', 'Lỗi hệ thống');
  });

  return app;
}
