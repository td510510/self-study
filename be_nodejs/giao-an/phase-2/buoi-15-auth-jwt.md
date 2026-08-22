# Buổi 15 — Authentication: JWT & bcrypt

> **Phase 2** · Express.js
> **Mục tiêu:** Xây luồng đăng nhập chuẩn công nghiệp — chủ đề học viên chắc chắn sẽ implement lại nhiều lần trong sự nghiệp.
> **Code thực hành:** [`code/buoi-15-auth-jwt/`](../../code/buoi-15-auth-jwt/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 14 |
| 15–60′ | **bcrypt: vì sao cố tình chậm** |
| 60–105′ | JWT: cấu trúc, ký, xác thực |
| 105–140′ | Access token vs Refresh token, và **rotation** |
| 140–170′ | **Bốn lỗ hổng và cách chặn** |
| 170–180′ | Bài tập & tổng kết |

---

## 1. Mở đầu — nối lại buổi 01 (15–20′)

Mở lại bài luận học viên viết ở buổi 01: *"Vì sao HTTP stateless vừa là điểm yếu vừa là điểm mạnh?"*

Hôm nay ta trả nợ câu hỏi đó.

> Server **không nhớ** bạn là ai. Vậy làm sao nó biết bạn đã đăng nhập?
> → Client phải **gửi kèm bằng chứng** ở **mỗi** request.

Toàn bộ buổi học là về việc thiết kế "bằng chứng" đó cho an toàn.

---

## 2. bcrypt — vì sao cố tình chậm (20–60′)

[`src/demo-bcrypt-cost.js`](../../code/buoi-15-auth-jwt/src/demo-bcrypt-cost.js)

### 2.1. Câu hỏi mở đầu

> *"Vì sao không băm mật khẩu bằng SHA-256 cho nhanh?"*

Đa số học viên sẽ thấy câu hỏi hợp lý. Chạy demo để trả lời bằng số:

```
100.000 lần băm SHA-256: 166ms
→ 603.304 lần/giây trên MỘT nhân CPU
```

> Một nhân CPU thường làm được **600 nghìn** phép băm mỗi giây. Kẻ tấn công có GPU làm được **hàng tỷ**. Với tốc độ đó, mọi mật khẩu yếu bị dò ra trong vài phút.

### 2.2. bcrypt và tham số cost

Số liệu đo thật:

| cost | thời gian | số lần thử/giây |
|---|---|---|
| 10 | 54ms | 18.5 |
| 11 | 107ms | 9.4 |
| 12 | **215ms** | **4.6** |
| 13 | 427ms | 2.3 |

**Mỗi lần tăng cost thêm 1, thời gian băm tăng gấp đôi.**

So sánh cuối cùng — viết to lên bảng:

```
SHA-256      : 603.304 lần/giây
bcrypt cost 12:     4.6 lần/giây

Chênh lệch: ~131.000 lần
```

> **Đó chính là ý đồ thiết kế.** bcrypt chậm *có chủ đích*. Và khi CPU nhanh gấp đôi sau vài năm, ta chỉ cần tăng cost lên 1 để giữ nguyên mức bảo vệ.

**Chọn cost bao nhiêu?**

- Mục tiêu: mỗi lần băm mất **200–500ms** trên máy chủ production
- Quá thấp → dễ bị dò
- Quá cao → đăng nhập chậm, **và** kẻ tấn công lợi dụng chính điều đó để làm nghẽn server (mỗi request đăng nhập giả đều tốn CPU thật)
- Khuyến nghị hiện nay: **12**

> Nối lại buổi 02: `bcrypt.hash` là **CPU-bound**. Nó chạy trong thread pool của libuv, không chặn Event Loop — nhưng thread pool chỉ có 4 luồng mặc định. Đây là lý do endpoint đăng nhập cần rate limit (buổi 11).

### 2.3. Salt — vì sao hai hash khác nhau

```
hash 1: $2b$10$rPGqZsRlmlyWyRjgswLolOGdoh8AMs4etXa6.EZ.yAhq6C2l8d0ce
hash 2: $2b$10$... (khác hoàn toàn)
giống nhau? false   ← dù CÙNG mật khẩu
```

Cấu trúc chuỗi bcrypt:

```
$2b$10$<22 ký tự salt><31 ký tự hash>
 │   │
 │   └── cost
 └────── phiên bản thuật toán
```

Ba hệ quả:

1. **`bcrypt.compare()` tự biết cách băm lại** — vì salt và cost nằm ngay trong chuỗi
2. **Rainbow table vô dụng** — bảng hash tính sẵn không khớp với salt ngẫu nhiên
3. **Hai người cùng mật khẩu `123456` cũng không lộ ra là họ trùng nhau**

### 2.4. Vì sao không được tự viết `hash1 === hash2`

> `===` dừng ngay ở ký tự đầu tiên khác nhau → **thời gian phản hồi tiết lộ ta đoán đúng được bao nhiêu ký tự**. Đó là **tấn công đo thời gian** (timing attack).
>
> `bcrypt.compare()` so sánh theo kiểu **thời gian không đổi**. Luôn dùng nó.

---

## 3. JWT — cấu trúc và cách hoạt động (60–105′)

### 3.1. Ba phần, ngăn cách bởi dấu chấm

```
eyJhbGciOiJIUzI1NiJ9 . eyJzdWIiOiIxIiwiZW1haWwiOi4uLn0 . SflKxwRJSMeKKF2QT4f
└─── header ────────┘  └────── payload ──────────────┘  └──── signature ───┘
```

### 3.2. Điểm quan trọng nhất về JWT

> **⚠️ Payload KHÔNG được mã hoá. Nó chỉ được KÝ.**

Có hẳn một test chứng minh điều đó:

```js
// Giải mã KHÔNG cần secret — payload chỉ là base64url
const phanGiua = accessToken.split('.')[1];
const payload = JSON.parse(Buffer.from(phanGiua, 'base64url').toString('utf8'));

assert.equal(payload.email, NGUOI_DUNG.email);   // ✅ đọc được!
```

> **📝 Ghi chú giảng viên**
> Cho học viên copy một token thật, dán vào [jwt.io](https://jwt.io), và **thấy tận mắt** email của mình hiện ra mà không cần secret.
>
> Chữ ký chỉ đảm bảo **không sửa được**, chứ không đảm bảo **không đọc được**.
>
> **Quy tắc: không bao giờ đưa mật khẩu, số thẻ, hay thông tin nhạy cảm vào payload.**

### 3.3. Chỉ đưa vào payload thứ cần thiết

```js
jwt.sign(
  { sub: String(user.id), email: user.email, vaiTro: user.vaiTro },
  ACCESS_SECRET,
  { expiresIn: '15m', issuer: 'hocbe-auth' }
);
```

`sub` (subject) là claim chuẩn cho "người dùng nào". Còn có `exp`, `iat`, `iss`, `aud` — nên dùng tên chuẩn thay vì tự đặt.

### 3.4. Cái giá của stateless

```js
req.nguoiDung = { id: Number(payload.sub), vaiTro: payload.vaiTro };
```

> **⚠️ Đây là dữ liệu TỪ TOKEN, không phải từ database.**
>
> Nếu admin hạ quyền một user hoặc khoá tài khoản, **token cũ vẫn mang thông tin cũ** cho tới khi hết hạn.
>
> Đó chính là cái giá của stateless — và là lý do access token phải **sống ngắn** (15 phút).

---

## 4. Access token vs Refresh token (105–140′)

| | Access token | Refresh token |
|---|---|---|
| Tuổi thọ | 15 phút | 7 ngày |
| Lưu ở database? | **Không** | **Có** (lưu hash) |
| Dùng để | gọi API | xin access token mới |
| Thu hồi được? | không | **có** |
| Gửi ở đâu | header `Authorization` | chỉ khi refresh |

**Vì sao phải tách hai loại?**

- Access token **không lưu** database → mỗi request không phải truy vấn → đó là **toàn bộ giá trị** của JWT
- Nhưng vậy thì không thu hồi được → nên phải sống ngắn
- Refresh token **có lưu** → thu hồi được → nên sống dài an toàn

### 4.1. Hai secret phải khác nhau

```js
if (ACCESS_SECRET === REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET và JWT_REFRESH_SECRET PHẢI KHÁC NHAU');
}
```

> Dùng chung khoá = refresh token đem đi gọi API được như access token, phá vỡ toàn bộ thiết kế. Có test canh giữ:
> ```js
> test('refresh token KHÔNG dùng được như access token', ...)  // → 401
> ```

### 4.2. Lưu hash của refresh token, không lưu token thô

```prisma
model RefreshToken {
  tokenHash String @unique     // ← SHA-256 của token
  ...
}
```

Cùng lý do với mật khẩu: database bị lộ thì kẻ tấn công vẫn không dùng được token.

> **Vì sao dùng SHA-256 chứ không bcrypt?** Token đã là chuỗi ngẫu nhiên 200+ ký tự, không thể đoán bằng từ điển. bcrypt cố tình chậm để chống đoán **mật khẩu**; với token thì cái chậm đó chỉ phí CPU mỗi lần refresh.

### 4.3. Refresh token rotation — cơ chế quan trọng nhất

**Mỗi refresh token chỉ dùng được ĐÚNG MỘT LẦN.** Dùng xong bị thu hồi, cấp token mới.

Vì sao? Vì nó biến việc **đánh cắp token** thành việc **phát hiện được**:

```js
if (banGhi.thuHoiLuc) {
  // 🚨 Token đã dùng rồi mà lại dùng tiếp → nhiều khả năng BỊ ĐÁNH CẮP
  // Phản ứng an toàn: thu hồi TOÀN BỘ token của user
  await prisma.refreshToken.updateMany({
    where: { userId: banGhi.userId, thuHoiLuc: null },
    data: { thuHoiLuc: new Date() },
  });
  throw loi.chuaDangNhap('Token đã bị dùng lại — đã thu hồi toàn bộ phiên');
}
```

Kịch bản thật, vẽ lên bảng:

```
1. Kẻ tấn công đánh cắp refresh token của bạn
2. Hắn dùng trước       → nhận cặp token mới, token cũ bị thu hồi
3. Bạn dùng token cũ    → hệ thống phát hiện DÙNG LẠI
4. → thu hồi TOÀN BỘ phiên của bạn
5. → cả hai đều bị đăng xuất. Bạn đăng nhập lại, kẻ tấn công thì không.
```

> **📝 Ghi chú giảng viên**
> Điểm tinh tế: hệ thống **không biết** ai là kẻ trộm — nên nó thu hồi **cả hai**. Bạn phải đăng nhập lại (phiền một chút), nhưng kẻ tấn công mất quyền truy cập hoàn toàn.
>
> Đây là ví dụ đẹp về **đánh đổi giữa bảo mật và tiện lợi**, và vì sao đôi khi phải chọn phương án phiền hơn.

---

## 5. Bốn lỗ hổng và cách chặn (140–170′)

Cả bốn đều có test canh giữ trong [`test/auth.test.js`](../../code/buoi-15-auth-jwt/test/auth.test.js).

### 5.1. Tấn công `alg: none`

Kẻ tấn công tự tạo token, khai thuật toán là `none`, không cần biết secret:

```js
const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
const payload = Buffer.from(JSON.stringify({ sub: '1', vaiTro: 'admin' })).toString('base64url');
const tokenGia = `${header}.${payload}.`;      // ← không có chữ ký
```

**Cách chặn — một dòng:**

```js
jwt.verify(token, ACCESS_SECRET, {
  algorithms: ['HS256'],   // ⚠️ BẮT BUỘC khai
});
```

> Không khai `algorithms`, thư viện sẽ tin thuật toán ghi trong **header của chính token** — tức là tin lời kẻ tấn công. Đây là lỗ hổng **algorithm confusion**, từng khiến nhiều thư viện JWT phải vá khẩn cấp.

### 5.2. Dò tài khoản (user enumeration)

```js
const LOI_CHUNG = 'Email hoặc mật khẩu không đúng';   // ← DÙNG CHUNG cho cả hai
```

Test canh giữ:

```js
assert.equal(saiMatKhau.body.loi, khongCoEmail.body.loi,
  'hai thông điệp phải GIỐNG HỆT nhau');
```

> Nếu tách riêng *"email không tồn tại"* và *"mật khẩu sai"*, kẻ tấn công dò được email nào đã đăng ký. Với ứng dụng nhạy cảm (y tế, tài chính, hẹn hò), **chỉ riêng việc biết một email có tài khoản đã là rò rỉ**.

### 5.3. Dò tài khoản qua thời gian phản hồi

Thông điệp giống nhau vẫn chưa đủ — **thời gian** vẫn tố cáo:

- Email tồn tại → có băm bcrypt → ~215ms
- Email không tồn tại → trả về ngay → ~2ms

Kẻ tấn công đo thời gian là biết. Cách chặn:

```js
if (!user) {
  // Vẫn băm một lần dù user không tồn tại, để thời gian tương đương
  await bamMatKhau('chuoi_gia_de_ton_thoi_gian_tuong_duong');
  throw loi.chuaDangNhap(LOI_CHUNG);
}
```

> **📝 Ghi chú giảng viên**
> Đây là chi tiết hầu như không tutorial nào nhắc tới. Hỏi lớp: *"Còn chỗ nào khác trong hệ thống lộ thông tin qua thời gian?"* → quên mật khẩu, kiểm tra email đã tồn tại khi đăng ký…

### 5.4. Không bao giờ trả về hash

```js
function locUser(u) {
  return { id: u.id, email: u.email, ten: u.ten, vaiTro: u.vaiTro };
  // ← matKhauHash KHÔNG có ở đây
}
```

Test canh giữ ở **mọi** endpoint:

```js
assert.equal(r.body.matKhauHash, undefined, 'TUYỆT ĐỐI không được lộ hash');
assert.equal(r.text.includes(NGUOI_DUNG.matKhau), false, 'không được lộ mật khẩu thô');
```

> Cách viết `res.json(user)` thẳng từ Prisma là lỗi phổ biến — nó trả về **mọi** cột, kể cả `matKhauHash`. Luôn có một hàm lọc.

### 5.5. `401` vs `403`

```js
if (!req.nguoiDung) return next(loi.chuaDangNhap());          // 401
if (!vaiTroChoPhep.includes(...)) return next(loi.khongDuQuyen()); // 403
```

| Mã | Nghĩa | Frontend nên làm gì |
|---|---|---|
| `401` | *"Tôi không biết bạn là ai"* | chuyển tới trang đăng nhập |
| `403` | *"Tôi biết bạn, nhưng bạn không đủ quyền"* | hiện thông báo, **không** chuyển trang |

> Nhầm hai mã này khiến frontend đá người dùng ra trang đăng nhập dù họ đã đăng nhập rồi — bug gây khó chịu và rất hay gặp.

---

## 6. JWT hay Session-Cookie? (bàn thêm)

| | JWT (stateless) | Session-Cookie (stateful) |
|---|---|---|
| Lưu trạng thái | không | ở server (RAM/Redis/DB) |
| Thu hồi ngay | ❌ phải chờ hết hạn | ✅ xoá session là xong |
| Nhiều server | dễ — không cần chia sẻ gì | cần Redis chung |
| Kích thước | lớn (gửi kèm mỗi request) | nhỏ (chỉ một id) |
| Chống CSRF | không tự có | cần `SameSite` |
| Lưu ở client | localStorage ⚠️ hoặc cookie | cookie `httpOnly` |

> **⚠️ Lưu JWT ở `localStorage` thì JavaScript đọc được → dính XSS là mất token.**
> An toàn hơn: cookie `httpOnly` + `SameSite=Strict` + `Secure`.
>
> Ta gặp lại chủ đề này ở buổi 22 (OWASP) và 23 (CORS).

Nguyên tắc thực dụng:
- **Ứng dụng web đơn thuần** → session-cookie thường đơn giản và an toàn hơn
- **API cho nhiều client** (mobile, third-party, microservices) → JWT

---

## 7. Nghiệm thu

```
# tests 20
# pass 20
# fail 0
```

| Nhóm test | Canh giữ điều gì |
|---|---|
| Đăng ký | không lộ hash, mật khẩu được băm, trùng email → 409 |
| Đăng nhập | thông điệp lỗi giống nhau (chống dò tài khoản) |
| Route bảo vệ | thiếu/sai/hết hạn token, **`alg=none`**, secret khác |
| Rotation | token mới mỗi lần, **dùng lại → thu hồi toàn bộ** |
| Payload | ai cũng đọc được → không đưa dữ liệu nhạy cảm |

---

## 8. Bài tập về nhà

1. **Rate limit endpoint đăng nhập.** Dùng middleware buổi 11, giới hạn 5 lần/phút/IP cho `/auth/dang-nhap`. Giải thích vì sao endpoint này cần chặt hơn các endpoint khác (gợi ý: bcrypt tốn CPU).

2. **Đổi mật khẩu.** Viết `POST /auth/doi-mat-khau` yêu cầu mật khẩu cũ, và **thu hồi toàn bộ refresh token** sau khi đổi. Vì sao bước thu hồi là bắt buộc?

3. **Đo thời gian phản hồi.** Gọi `/auth/dang-nhap` 20 lần với email tồn tại và 20 lần với email không tồn tại, tính thời gian trung bình mỗi nhóm. Xoá dòng `await bamMatKhau('chuoi_gia...')` rồi đo lại. Lập bảng so sánh.

4. **Cookie httpOnly.** Chuyển refresh token từ body sang cookie `httpOnly` + `SameSite=Strict`. Liệt kê điều gì an toàn hơn và điều gì phức tạp hơn.

5. **Dọn token hết hạn.** Viết script xoá các `RefreshToken` đã hết hạn hoặc đã thu hồi quá 30 ngày. Vì sao cần? (Gợi ý: bảng phình to vô hạn.)

6. **Tự khai thác.** Xoá `algorithms: ['HS256']` khỏi `xacThucAccessToken`, chạy lại test `alg=none`. Nó có còn pass không? Giải thích chuyện gì vừa xảy ra.

---

## 9. Checklist kết thúc buổi

- [ ] Vì sao không dùng SHA-256 để băm mật khẩu?
- [ ] Cost của bcrypt tăng 1 thì chậm thêm bao nhiêu?
- [ ] Salt giải quyết vấn đề gì? Nó nằm ở đâu?
- [ ] Payload của JWT có được mã hoá không?
- [ ] Vì sao access token phải sống ngắn?
- [ ] Vì sao hai secret phải khác nhau?
- [ ] Refresh token rotation phát hiện được điều gì?
- [ ] `alg: none` là tấn công gì? Chặn bằng cách nào?
- [ ] Vì sao vẫn phải băm khi email không tồn tại?
- [ ] `401` và `403` — frontend xử lý khác nhau ra sao?

---

**Buổi trước:** [Buổi 14 — MongoDB & Mongoose](./buoi-14-mongodb-mongoose.md)
**Buổi tiếp theo:** Buổi 16 — Authorization & RBAC
