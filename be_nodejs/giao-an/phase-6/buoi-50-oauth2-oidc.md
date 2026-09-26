# Buổi 50 — Đăng nhập bằng OAuth2 / OpenID Connect

> **Phase 6** · Hero
> **Mục tiêu:** Tích hợp "Đăng nhập bằng Google" **đúng** — hiểu từng tham số trong URL, vì sao nó tồn tại, và tấn công nào xảy ra khi bỏ nó đi.
> **Code thực hành:** [`code/buoi-50-oauth2-oidc/`](../../code/buoi-50-oauth2-oidc/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 49 |
| 15–40′ | **OAuth2 là ủy quyền, OIDC là xác thực** — phân biệt hai thứ hay bị trộn |
| 40–80′ | Đi hết luồng Authorization Code + PKCE, từng request một |
| 80–110′ | Kiểm id_token: năm dòng, năm lỗ hổng |
| 110–145′ | **Ba tấn công thật:** CSRF đăng nhập, đánh cắp code, chiếm tài khoản qua email |
| 145–170′ | Liên kết tài khoản & phiên sau đăng nhập |
| 170–180′ | Bài tập |

---

## 1. OAuth2 vs OpenID Connect (15–40′)

> **📝 Ghi chú giảng viên**
> Học viên gần như chắc chắn đang nghĩ "OAuth = đăng nhập bằng Google". Sửa ngay từ đầu, vì nhầm lẫn này sinh ra lỗ hổng thật.

| | OAuth 2.0 | OpenID Connect (OIDC) |
|---|---|---|
| Trả lời câu hỏi | "App này được **làm gì** thay tôi?" | "Người này **là ai**?" |
| Sản phẩm | `access_token` — chìa khoá gọi API | `id_token` — JWT chứa danh tính |
| Ví dụ | App lịch xin quyền đọc Google Calendar | Shop cho "Đăng nhập bằng Google" |
| Ai đọc token | **API của Google** | **Chính app của ta** |

> OIDC = OAuth2 + `id_token` + vài quy ước (`scope=openid`, discovery, JWKS).

**Lỗi kinh điển:** dùng `access_token` để xác định danh tính — *"gọi /userinfo được thì là người đó"*. Nhưng access_token có thể được cấp cho **app khác** rồi đem sang app ta. Chỉ `id_token` có `aud` (audience) chỉ rõ nó dành cho **ai**.

### Bốn vai

```
  Người dùng (Resource Owner)      — người bấm "Đồng ý"
  Trình duyệt (User Agent)         — chỉ chuyển tiếp, KHÔNG được tin
  Shop (Client / Relying Party)    — ứng dụng của ta, cổng 3000
  Nhà cung cấp (Authorization Server) — Google; ở đây là bản mini, cổng 4000
```

> Vì sao repo tự dựng nhà cung cấp mini? Để lớp học chạy được **không cần Internet**, không cần tài khoản Google Cloud — và để **nhìn thấy** bên trong nhà cung cấp làm gì. Shop dùng discovery, nên đổi sang Google thật chỉ là đổi `.env`.

---

## 2. Đi hết luồng, từng request một (40–80′)

```bash
cd code/buoi-50-oauth2-oidc
npm install && cp .env.example .env && npm start
```

### Bước 1 — Shop chuyển khách sang nhà cung cấp

```bash
curl -i localhost:3000/dang-nhap/oidc
```

Kết quả thật:

```
HTTP/1.1 302 Found
Set-Cookie: oidc_tam=LNYkVbG2…; HttpOnly; SameSite=Lax; Path=/dang-nhap; Max-Age=600
Location: http://localhost:4000/authorize?response_type=code&client_id=shop-demo
  &redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fdang-nhap%2Foidc%2Fcallback
  &scope=openid+email+profile
  &state=JGgDbVKu…&nonce=NGvm-cl9…
  &code_challenge=m8_7R99a…&code_challenge_method=S256
```

Cho lớp điền bảng — **mỗi tham số chặn một tấn công**:

| Tham số | Để làm gì | Bỏ đi thì sao |
|---|---|---|
| `response_type=code` | Xin **code**, không xin token trực tiếp | "Implicit flow" cũ: token nằm trên URL → lộ qua lịch sử, log, Referer |
| `redirect_uri` | Code gửi về đâu | Nhà cung cấp phải so **chính xác** — nếu không, code bay tới kẻ tấn công |
| `scope=openid …` | Xin id_token + email + tên | Thiếu `openid` → chỉ là OAuth2, không có id_token |
| `state` | Ràng buộc callback với **trình duyệt này** | CSRF đăng nhập (mục 4.1) |
| `nonce` | Ràng buộc id_token với **luồng này** | Phát lại id_token cũ |
| `code_challenge` | PKCE — băm của bí mật chỉ server biết | Code bị đánh cắp đổi được thành token (mục 4.2) |

### Bước 2 — Người dùng đồng ý, nhà cung cấp gửi code về

Mở `http://localhost:3000` trên trình duyệt, bấm đăng nhập, chọn *Người Mới*. URL callback có dạng:

```
/dang-nhap/oidc/callback?code=xY3…&state=JGgDbVKu…
```

> Trình duyệt **chỉ cầm `code`**. Code vô dụng nếu thiếu `client_secret` (chỉ server shop biết) **và** `code_verifier` (chỉ server shop biết).

### Bước 3 — Server shop đổi code lấy token (server ↔ server)

```
POST /token
grant_type=authorization_code & code=… & redirect_uri=…
& client_id=shop-demo & client_secret=… & code_verifier=…
```

Trả về `id_token`, `access_token`. **Không bao giờ đi qua trình duyệt.** Test *"trình duyệt không bao giờ thấy access_token hay id_token"* kiểm chứng điều này: cookie duy nhất trình duyệt giữ sau cùng là `phien`.

### Cookie `SameSite=Lax` — không phải `Strict`

> **📝 Ghi chú giảng viên**
> Học viên vừa học buổi 22–23 thường chọn `Strict` "cho an toàn". Hỏi lớp: *"Lúc nhà cung cấp redirect VỀ shop, request đó đến từ miền nào?"* → Từ `localhost:4000` — **miền khác**. `Strict` không gửi cookie → callback không tìm thấy luồng đăng nhập → đăng nhập hỏng 100%. `Lax` vẫn gửi cookie cho điều hướng `GET` cấp cao nhất.

---

## 3. Kiểm id_token — năm dòng, năm lỗ hổng (80–110′)

```js
const { payload } = await jwtVerify(idToken, JWKS, {
  issuer: cauHinh.issuer,
  audience: clientId,
  algorithms: ['RS256'],
});
if (payload.nonce !== nonce) ...
```

| Bỏ dòng | Kẻ tấn công làm được | Test canh giữ |
|---|---|---|
| Chữ ký (JWKS) | Tự viết token "tôi là admin" | *id_token ký bằng khoá KHÁC* |
| `algorithms` | Gửi token `alg: "none"` không chữ ký | *id_token alg "none"* |
| `audience` | Lấy token app độc hại xin được, đem sang shop | *id_token cấp cho APP KHÁC* |
| `issuer` | Token của nhà cung cấp khác (có thể do chính họ dựng) | — |
| `nonce` | Phát lại id_token bắt được vào luồng khác | *nonce khác (phát lại)* |

### JWKS và khoá bất đối xứng

Nối buổi 15: ở đó ta ký JWT bằng **HS256** — một bí mật dùng chung để ký **và** kiểm. Ở đây là **RS256**:

- Nhà cung cấp giữ **khoá riêng** — chỉ họ ký được
- Công bố **khoá công khai** ở `/jwks` — ai cũng kiểm được, không ai giả được

`createRemoteJWKSet` tải JWKS, cache lại, và **tự tải lại** khi gặp `kid` lạ — vì Google xoay khoá định kỳ.

> **📝 Ghi chú giảng viên**
> Nói thẳng: **đừng tự viết** phần kiểm JWT. Dùng `jose` hoặc `openid-client`. Code buổi này tự viết *luồng* để học; phần mật mã luôn giao cho thư viện đã được kiểm toán.

---

## 4. Ba tấn công thật (110–145′)

### 4.1. CSRF đăng nhập

```
1. Kẻ tấn công tự đăng nhập tới bước callback, DỪNG LẠI, copy link:
     /dang-nhap/oidc/callback?code=<code CỦA KẺ TẤN CÔNG>&state=…
2. Gửi link cho nạn nhân (email, chat)
3. Nạn nhân bấm → bị đăng nhập vào TÀI KHOẢN KẺ TẤN CÔNG
4. Nạn nhân nhập địa chỉ, số thẻ… → kẻ tấn công đọc được hết
```

Chặn: `state` sinh ngẫu nhiên, lưu phía server gắn với cookie của **trình duyệt đã bắt đầu luồng**. Test chạy cả hai biến thể:

- Nạn nhân chưa từng bắt đầu → `LUONG_DANG_NHAP_KHONG_HOP_LE`
- Nạn nhân đang giữa luồng của chính mình → `STATE_SAI`

### 4.2. Đánh cắp code — PKCE

Code nằm trên URL → có thể lộ qua extension trình duyệt, log proxy, app giả mạo trên điện thoại cùng đăng ký một URL scheme.

```
code_verifier  = chuỗi ngẫu nhiên, CHỈ server shop giữ
code_challenge = BASE64URL(SHA256(code_verifier))   ← gửi lúc bắt đầu
```

Lúc đổi code, nhà cung cấp băm `code_verifier` và so. Kẻ trộm có code nhưng không có verifier → `invalid_grant`. Test: *"PKCE: code bị đánh cắp vô dụng nếu không có code_verifier"*.

> PKCE ban đầu dành cho app di động (không giữ được `client_secret`). Nay **OAuth 2.1 bắt buộc PKCE cho mọi client** — kể cả server.

### 4.3. Chiếm tài khoản qua email chưa xác minh

Nhà cung cấp mini có tài khoản `gg-6666` với email `binh@vd.vn` — **chưa xác minh**. Shop đã có tài khoản mật khẩu của Bình với đúng email đó.

```
Nếu shop tự liên kết theo email:
  kẻ tấn công đăng ký ở nhà cung cấp bằng email của Bình (không cần xác minh)
  → "Đăng nhập bằng …" → shop thấy email trùng → cho vào TÀI KHOẢN CỦA BÌNH
```

Chặn: chỉ liên kết khi `email_verified === true`. Test: *"CHIẾM TÀI KHOẢN: email CHƯA xác minh trùng tài khoản cũ → 409"*.

> **📝 Ghi chú giảng viên**
> Lỗ hổng này có thật, từng xảy ra ở nhiều sản phẩm lớn. Nhấn mạnh: kể cả `email_verified: true`, liên kết **tự động** vẫn là một quyết định rủi ro. Cách an toàn nhất: yêu cầu người dùng **đăng nhập bằng mật khẩu cũ** một lần để xác nhận liên kết (bài tập 3).

---

## 5. Liên kết tài khoản & phiên (145–170′)

**Khoá định danh là `(iss, sub)` — không phải email.**

| | email | sub |
|---|---|---|
| Đổi được? | ✅ người dùng đổi bất cứ lúc nào | ❌ không bao giờ |
| Duy nhất toàn cầu? | ❌ hai nhà cung cấp, hai người khác nhau | chỉ trong một `iss` → phải kèm `iss` |

Ba nhánh trong `timHoacTaoTaiKhoan`:

```
(iss, sub) đã liên kết         → dùng tài khoản đó             cach = da-lien-ket
email trùng + đã xác minh      → liên kết vào tài khoản cũ     cach = lien-ket-moi
email trùng + CHƯA xác minh    → 409
không trùng gì                 → tạo tài khoản mới            cach = tao-moi
```

**Sau khi đăng nhập xong, token của Google không còn vai trò gì.** Shop tạo **phiên của riêng mình** (cookie `phien` ở đây; hoặc JWT + refresh token như buổi 15). Đừng dùng id_token của Google làm token phiên — nó hết hạn sau vài phút và không thu hồi được từ phía ta.

---

## 6. Bài tập về nhà

1. **Google thật.** Tạo OAuth client trên Google Cloud Console, đổi `.env`, đăng nhập thật. Chụp payload id_token (giải mã ở jwt.io — *chỉ với token của chính bạn*). Trường nào có ở Google mà nhà cung cấp mini không có?

2. **Tích hợp Project 2.** Thêm `POST /auth/google` vào `project-02-ecommerce`: sau khi xác minh, phát **access + refresh token của shop** (buổi 15) thay cho cookie phiên.

3. **Liên kết an toàn.** Khi email trùng tài khoản mật khẩu, thay vì tự liên kết: chuyển sang trang "nhập mật khẩu cũ để liên kết". Chỉ liên kết khi mật khẩu đúng. Viết test.

4. **Đăng xuất.** Xoá phiên ở shop là đủ chưa? Người dùng vẫn đang đăng nhập ở nhà cung cấp — bấm "Đăng nhập" lần nữa thì chuyện gì xảy ra? Tìm hiểu `prompt=login` và `prompt=select_account`.

5. **Nâng cao.** Thêm nhà cung cấp thứ hai (chạy thêm một nhà cung cấp mini ở cổng 4001 với `iss` khác). Chứng minh cùng `sub = gg-1001` ở hai nhà cung cấp là **hai người khác nhau** trong shop.

---

## 7. Checklist kết thúc buổi

- [ ] OAuth2 và OIDC khác nhau ở câu hỏi nào? Token nào dành cho ai đọc?
- [ ] Vì sao trình duyệt chỉ được cầm `code`, không cầm token?
- [ ] `state`, `nonce`, `code_challenge` — mỗi cái chặn tấn công gì?
- [ ] Vì sao cookie luồng đăng nhập phải `SameSite=Lax` chứ không phải `Strict`?
- [ ] Năm thứ phải kiểm trong id_token
- [ ] RS256 khác HS256 ở đâu? Vì sao nhà cung cấp dùng RS256?
- [ ] Vì sao định danh bằng `(iss, sub)` chứ không bằng email?
- [ ] Kịch bản chiếm tài khoản qua `email_verified: false`

---

**Buổi trước:** [Buổi 49 — Design pattern & SOLID](./buoi-49-design-pattern-solid.md)
**Buổi tiếp theo:** [Buổi 51 — Tích hợp thanh toán & Webhook](./buoi-51-thanh-toan-webhook.md)
