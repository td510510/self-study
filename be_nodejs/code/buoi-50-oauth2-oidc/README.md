# Buổi 50 — Đăng nhập bằng OAuth2 / OpenID Connect

Giáo án: [`giao-an/phase-6/buoi-50-oauth2-oidc.md`](../../giao-an/phase-6/buoi-50-oauth2-oidc.md)

Không cần Docker, **không cần Internet**: repo tự chạy một nhà cung cấp OIDC mini đóng vai "Google".

```bash
npm install
cp .env.example .env
npm start          # nhà cung cấp :4000, shop :3000 → mở http://localhost:3000
npm test           # 15 test
```

## Hai tiến trình, hai vai

| | Vai | File |
|---|---|---|
| `:4000` | **Nhà cung cấp** (Authorization Server) — đóng vai Google | `src/nha-cung-cap/app.js` |
| `:3000` | **Shop** (Client / Relying Party) — ứng dụng của ta | `src/shop/app.js` |

Shop dùng **discovery** (`/.well-known/openid-configuration`) nên không hard-code endpoint nào.
Muốn thử với Google thật: tạo OAuth client ở Google Cloud Console, đổi 3 dòng `OIDC_*` trong `.env`, đặt `CHAY_NHA_CUNG_CAP=0`. Code shop **không đổi dòng nào**.

## Ba tài khoản ở nhà cung cấp mini

| sub | email | xác minh? | Kết quả khi đăng nhập vào shop |
|---|---|---|---|
| `gg-1001` | an@vd.vn | ✅ | **liên kết** với tài khoản mật khẩu có sẵn (id 1) |
| `gg-1002` | moi@vd.vn | ✅ | **tạo mới** tài khoản |
| `gg-6666` | binh@vd.vn | ❌ | **409** — chặn chiếm tài khoản của Bình |

## 15 test — 3 test luồng đúng, 12 test tấn công

| Tấn công | Chặn bằng |
|---|---|
| CSRF đăng nhập (gửi link callback của kẻ tấn công cho nạn nhân) | `state` + cookie ràng buộc trình duyệt |
| Đổi code bị đánh cắp | **PKCE** `code_verifier` |
| Dùng lại code | code xoá ngay lần dùng đầu |
| `redirect_uri` giả | so khớp **chính xác**, sai thì KHÔNG redirect |
| id_token của app khác | kiểm `aud` |
| id_token giả chữ ký / `alg: none` | JWKS + `algorithms: ['RS256']` |
| Phát lại id_token | `nonce` |
| Chiếm tài khoản qua email chưa xác minh | chỉ liên kết khi `email_verified === true`; định danh bằng `(iss, sub)` |

```
# tests 15   # pass 15
```

> ⚠️ `src/nha-cung-cap/` là **code học tập**. Đừng tự viết authorization server cho production — dùng Keycloak, Auth0, Cognito, hoặc Google/GitHub.
