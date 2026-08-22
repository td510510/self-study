# Buổi 23 — CORS, Helmet & Rate limiting

> **Phase 3** · Backend chuyên sâu
> **Mục tiêu:** Cấu hình đúng các lớp phòng thủ ở biên hệ thống — phần hay bị cấu hình sai nhất, vì ai cũng "bật allow all cho chạy".
> **Code thực hành:** [`src/lib/bao-mat.js`](../../code/project-02-ecommerce/src/lib/bao-mat.js) · [`test/bao-mat.test.js`](../../code/project-02-ecommerce/test/bao-mat.test.js)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 22 |
| 15–80′ | **CORS: hiểu cho đúng bản chất** |
| 80–120′ | Helmet: từng header làm gì |
| 120–160′ | Rate limit thật với Redis |
| 160–175′ | Thứ tự middleware bảo mật |
| 175–180′ | Bài tập & tổng kết |

---

## 1. CORS — hiểu cho đúng (15–80′)

### 1.1. Câu hỏi mở đầu

> *"CORS bảo vệ server của bạn khỏi ai?"*

Đa số học viên sẽ nói: *"khỏi kẻ tấn công"*. **Sai.**

> **⚠️ CORS KHÔNG phải bảo mật cho server.**
>
> `curl`, Postman, script Python, app mobile, server-to-server — **tất cả đều bỏ qua CORS hoàn toàn**.

Chứng minh ngay tại lớp:

```bash
# Trình duyệt bị CORS chặn, nhưng curl thì không
curl http://localhost:3000/san-pham
```

### 1.2. Vậy CORS bảo vệ ai?

**Bảo vệ NGƯỜI DÙNG, không phải server.**

Kịch bản — vẽ lên bảng:

```
1. Bạn đăng nhập vào bank.com, trình duyệt lưu cookie
2. Bạn vào trang web độc hại xau.com
3. JavaScript của xau.com gọi:  fetch('https://bank.com/chuyen-tien', {...})
4. Trình duyệt TỰ ĐỘNG gửi kèm cookie bank.com của bạn
5. → Nếu không có CORS, tiền của bạn bay
```

> **CORS là cơ chế TRÌNH DUYỆT tự áp lên chính nó**, để trang web này không dùng được danh tính của bạn ở trang web khác.

### 1.3. Điểm dạy quan trọng nhất: server VẪN xử lý request

```js
test('🚨 origin LẠ → KHÔNG có header cho phép', async () => {
  const r = await request(app).get('/health').set('Origin', 'https://ke-tan-cong.com');

  // Server VẪN trả dữ liệu, nhưng thiếu header
  // → TRÌNH DUYỆT là bên từ chối đưa dữ liệu cho JavaScript.
  assert.equal(r.headers['access-control-allow-origin'], undefined);
});
```

> **📝 Ghi chú giảng viên**
> Đây là hiểu lầm phổ biến nhất. Học viên tưởng CORS **chặn request**. Thực tế:
>
> 1. Request **vẫn tới server**
> 2. Server **vẫn xử lý** (kể cả ghi database!)
> 3. Response **vẫn quay về**
> 4. **Trình duyệt** đọc header, thấy không được phép, và **từ chối đưa kết quả cho JavaScript**
>
> Hệ quả nghiêm trọng: nếu endpoint đó **ghi dữ liệu**, dữ liệu **đã bị ghi** rồi — kẻ tấn công chỉ không đọc được kết quả.
>
> → **Không bao giờ dựa vào CORS để bảo vệ thao tác ghi.** Phải có xác thực và CSRF token.

### 1.4. Preflight — vì sao có request `OPTIONS` thừa

Với request "không đơn giản" (có `Authorization`, `Content-Type: application/json`, hoặc method `PUT`/`DELETE`), trình duyệt gửi **trước** một `OPTIONS` để hỏi phép:

```
→ OPTIONS /san-pham
  Origin: http://localhost:5173
  Access-Control-Request-Method: POST
  Access-Control-Request-Headers: Authorization

← 204
  Access-Control-Allow-Methods: POST
  Access-Control-Allow-Headers: Authorization
  Access-Control-Max-Age: 600      ← cache 10 phút, bớt một request mỗi lần gọi
```

> Không có `maxAge`, **mỗi** request thật đều kèm một `OPTIONS` → gấp đôi số request.

### 1.5. Bốn lỗi cấu hình CORS

**(a) `origin: '*'` cùng với `credentials: true`**

```js
cors({ origin: '*', credentials: true })   // ❌ trình duyệt TỪ CHỐI
```

> Đây là quy định của chuẩn: không được vừa cho mọi origin, vừa cho gửi cookie. Trình duyệt sẽ báo lỗi dù server cấu hình thế.

**(b) Quên `exposedHeaders`**

```js
exposedHeaders: ['X-Request-Id', 'Retry-After'],
```

> Header **tự đặt** phải khai ở đây thì JavaScript phía client mới **đọc được**. Thiếu dòng này, frontend không lấy được `X-Request-Id` để báo lỗi (buổi 18) — mà cũng không có thông báo lỗi nào, chỉ là `undefined`.

Có test canh giữ:

```js
assert.match(r.headers['access-control-expose-headers'], /X-Request-Id/i);
```

**(c) Chặn luôn request không có `Origin`**

```js
if (!origin) return callback(null, true);
```

> Không có `origin` nghĩa là: `curl`, Postman, app mobile, server-to-server. CORS **vốn không áp dụng** cho chúng. Chặn là tự làm hỏng app mobile của chính mình.

**(d) Danh sách origin hardcode**

```js
origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',')
```

> Dev, staging, production có domain khác nhau → phải là biến môi trường (buổi 03).

---

## 2. Helmet (80–120′)

Mỗi header một dòng phòng thủ. Bảng để học viên chép:

| Header | Chống gì | Test |
|---|---|---|
| `X-Powered-By` bị **xoá** | lộ công nghệ đang dùng | ✅ |
| `X-Frame-Options: DENY` | clickjacking — nhúng site bạn vào iframe rồi lừa click | ✅ |
| `X-Content-Type-Options: nosniff` | trình duyệt tự đoán kiểu file — nối buổi 17 | ✅ |
| `Content-Security-Policy` | XSS — kiểm soát script nào được chạy | ✅ |
| `Strict-Transport-Security` | buộc HTTPS, chống hạ cấp về HTTP | ✅ |
| `Referrer-Policy: no-referrer` | rò rỉ URL nội bộ sang site khác | ✅ |

### CSP cho API thuần JSON

```js
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'none'"],       // ← API không cần tải gì cả
    frameAncestors: ["'none'"],
    sandbox: ['allow-forms', 'allow-scripts'],
  },
},
```

> CSP mặc định của helmet dành cho **trang HTML**. API thuần JSON thì siết chặt hơn nữa: **cấm mọi thứ**. Nếu file upload được phục vụ từ cùng domain (buổi 17), CSP là lớp phòng thủ cuối chống XSS lưu trữ.

### ⚠️ HSTS — con dao hai lưỡi

```js
hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true }
```

> **Chỉ bật khi ĐÃ chắc chắn có HTTPS.**
>
> Header này bảo trình duyệt: *"trong 1 năm tới, chỉ dùng HTTPS với domain này"*. Bật nhầm khi site còn chạy HTTP → **người dùng không vào được nữa** cho tới khi hết hạn, và bạn **không thể gỡ** vì trình duyệt đã nhớ.
>
> Cho học viên nhớ: đây là header **khó hoàn tác nhất** trong web.

---

## 3. Rate limit thật (120–160′)

Nâng cấp từ bản `Map` ở buổi 11 sang Redis (buổi 21):

```js
export function rateLimit({ soLanToiDa = 100, cuaSoGiay = 60, tien = 'chung' } = {}) {
  return async (req, res, next) => {
    // Đã đăng nhập → giới hạn theo NGƯỜI; chưa → theo IP
    const dinhDanh = req.nguoiDung?.id ? `u:${req.nguoiDung.id}` : `ip:${req.ip}`;
    const khoa = `rl:${tien}:${dinhDanh}`;
    ...
  };
}
```

### 3.1. Giới hạn theo tầng

```js
app.use(rateLimit({ soLanToiDa: 300, cuaSoGiay: 60, tien: 'chung' }));
app.use('/auth/dang-nhap', rateLimit({ soLanToiDa: 5, cuaSoGiay: 60, tien: 'dangnhap' }));
```

> Endpoint đăng nhập siết chặt **60 lần** hơn. Hai lý do:
> 1. `bcrypt` tốn CPU (buổi 15) — mỗi request giả cũng tốn 215ms CPU thật
> 2. Đây là mục tiêu số một của tấn công dò mật khẩu

Test chứng minh:

```
5 lần đầu  → 401 (sai mật khẩu, được xử lý)
lần thứ 6  → 429 + Retry-After
```

### 3.2. Header chuẩn

```js
res.setHeader('RateLimit-Limit', soLanToiDa);
res.setHeader('RateLimit-Remaining', Math.max(0, soLanToiDa - dem));
res.setHeader('RateLimit-Reset', conLaiGiay);
res.setHeader('Retry-After', conLaiGiay);   // khi bị chặn
```

> Client tử tế sẽ đọc `RateLimit-Remaining` và **tự giảm tốc** trước khi bị chặn. Không có header này, client chỉ biết mình bị chặn khi đã quá muộn.

### 3.3. Quyết định thiết kế: Redis chết thì sao?

```js
} catch (err) {
  // ⚠️ Redis chết → CHO QUA thay vì chặn hết.
  req.log?.warn({ err: err.message }, 'rate limit lỗi, cho qua');
  next();
}
```

> **📝 Ghi chú giảng viên — câu hỏi hay để thảo luận**
>
> Hỏi lớp: *"Redis chết. Nên cho qua hết hay chặn hết?"*
>
> | Chọn | Rủi ro |
> |---|---|
> | **Cho qua** (fail open) | bị gọi quá nhiều trong lúc Redis chết |
> | **Chặn hết** (fail closed) | **toàn bộ** người dùng hợp lệ bị từ chối |
>
> Với API thương mại điện tử: **cho qua** — thà chịu rủi ro còn hơn mất toàn bộ doanh thu.
> Với API ngân hàng hoặc chuyển tiền: có thể chọn **chặn hết**.
>
> Điểm mấu chốt: đây là **quyết định nghiệp vụ**, phải cân nhắc có ý thức, không phải mặc định của thư viện.

---

## 4. Thứ tự middleware bảo mật (160–175′)

```js
app.use(pinoHttp(...));           // 1. log + request-id
app.use(cauHinhHelmet());         // 2. header bảo mật
app.use(cauHinhCors(origins));    // 3. CORS
app.use(rateLimit({ ... }));      // 4. rate limit
app.use(express.json({ ... }));   // 5. parse body
// ... routes ...
```

| Vị trí | Lý do |
|---|---|
| `helmet` **sớm** | để header áp cho **mọi** response, kể cả response lỗi |
| `cors` **trước route** | preflight `OPTIONS` phải được trả lời trước khi vào router |
| `rateLimit` **trước** `express.json()` | chặn kẻ tấn công **trước khi** tốn công đọc body 100KB của họ |

> Nối lại buổi 11: cùng một tập middleware, thứ tự khác nhau cho ra hệ thống khác nhau **về chất**.

---

## 5. Nghiệm thu

```
# tests 41
# pass 41
# fail 0
```

14 test mới canh giữ:

| Nhóm | Canh giữ |
|---|---|
| Helmet | 6 header bảo mật đều có mặt |
| CORS | origin cho phép/từ chối, preflight, `exposedHeaders`, không có Origin |
| Rate limit | header `RateLimit-*`, đăng nhập bị siết 5 lần/phút, bộ đếm ở Redis |

---

## 6. Bài tập về nhà

1. **Chứng minh CORS không chặn server.** Viết endpoint ghi vào database. Gọi từ một origin **không** được phép bằng `fetch` trong trình duyệt. Kiểm chứng: JavaScript báo lỗi CORS, **nhưng dữ liệu đã vào database**. Rút ra kết luận gì?

2. **Tự gây lỗi cấu hình.** Đặt `origin: '*'` cùng `credentials: true`, mở DevTools và chụp lại thông báo lỗi của trình duyệt. Giải thích.

3. **Bỏ `exposedHeaders`.** Xoá nó khỏi cấu hình, viết một trang HTML nhỏ gọi API và thử đọc `X-Request-Id`. Kết quả là gì? Có thông báo lỗi nào không?

4. **Rate limit theo người dùng.** Sửa để user đã đăng nhập có hạn mức cao hơn khách vãng lai (ví dụ 1000 vs 100). Test cả hai trường hợp.

5. **CSP cho file upload.** Nếu phục vụ ảnh upload từ `/uploads`, CSP nên đặt thế nào? Viết cấu hình và giải thích cách nó chặn XSS lưu trữ ở buổi 17.

6. **Nâng cao — CSRF.** Nếu chuyển từ JWT trong header sang cookie `httpOnly` (buổi 15), CSRF trở thành mối đe doạ. Tìm hiểu `SameSite=Strict` và CSRF token. Cái nào đủ, cái nào không?

---

## 7. Checklist kết thúc buổi

- [ ] CORS bảo vệ ai — server hay người dùng?
- [ ] Khi origin bị từ chối, server có xử lý request không?
- [ ] Vì sao không được dựa vào CORS để bảo vệ thao tác ghi?
- [ ] Preflight `OPTIONS` xảy ra khi nào? `maxAge` giải quyết gì?
- [ ] Vì sao `origin: '*'` không dùng chung được với `credentials: true`?
- [ ] `exposedHeaders` để làm gì? Quên nó thì hiện tượng ra sao?
- [ ] Vì sao HSTS là header khó hoàn tác nhất?
- [ ] Vì sao endpoint đăng nhập cần rate limit chặt hơn nhiều?
- [ ] Redis chết thì rate limit nên cho qua hay chặn hết? Tuỳ vào gì?
- [ ] Vì sao `rateLimit` phải đặt trước `express.json()`?

---

**Buổi trước:** [Buổi 22 — OWASP Top 10 thực chiến](./buoi-22-owasp.md)
**Buổi tiếp theo:** Buổi 24 — Thiết kế API chuẩn REST
