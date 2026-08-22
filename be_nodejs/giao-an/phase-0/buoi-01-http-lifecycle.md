# Buổi 01 — Client–Server & vòng đời một HTTP request

> **Phase 0** · Cầu nối tư duy Frontend → Backend
> **Mục tiêu:** Học viên hiểu chính xác điều gì xảy ra giữa lúc bấm nút trên UI và lúc dữ liệu về tới màn hình — nhìn từ phía server, chứ không phải từ phía `fetch()`.
> **Code thực hành:** [`code/buoi-01-raw-http/`](../../code/buoi-01-raw-http/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–20′ | Khởi động: vẽ lại đường đi của một request |
| 20–75′ | Lý thuyết: HTTP là văn bản, stateless, status code |
| 75–145′ | Thực hành: curl → gửi HTTP thô bằng socket → dựng echo server |
| 145–180′ | Bài tập về nhà & tổng kết |

---

## 1. Khởi động (0–20′)

Học viên đã gọi API hàng trăm lần. Điều họ chưa từng thấy là **phía bên kia**.

Mở đầu bằng câu hỏi ném ra cho cả lớp:

> **"Khi bạn gọi `fetch('/api/users')` — ai đang trả lời bạn?"**

Để lớp trả lời tự do vài phút. Câu trả lời thường mơ hồ: "server", "backend", "database". Đó chính là khoảng trống ta lấp trong 16 tuần tới.

Vẽ lên bảng đường đi đầy đủ, đánh số từng mắt xích:

```
[1] Browser
      │  fetch('/api/users')
      ▼
[2] DNS          api.example.com → 93.184.216.34
      ▼
[3] TCP          bắt tay 3 bước, mở đường ống
      ▼
[4] TLS          mã hoá (nếu là https)
      ▼
[5] HTTP request  ← VĂN BẢN THUẦN, gửi qua ống
      ▼
[6] Nginx        reverse proxy, phân phối
      ▼
[7] Node process  ← 16 TUẦN TỚI TA SỐNG Ở ĐÂY
      ▼
[8] Database
      │
      ▼  và ngược lại toàn bộ chặng đường
```

Chỉ vào ô **[7]** và nói rõ: *"Đây là nơi chúng ta sẽ sống. Hôm nay ta bắt đầu từ ô [5] — hiểu cái mà ô [7] nhận được."*

---

## 2. Lý thuyết (20–75′)

### 2.1. HTTP là văn bản thuần

Đây là điểm cần phá vỡ ảo tưởng đầu tiên. HTTP **không** phải một object JavaScript. Nó là văn bản, gửi qua một đường ống TCP.

Một request thật trông như thế này:

```http
POST /api/todos HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...
Content-Length: 27

{"title":"Hoc Node.js"}
```

Cấu trúc gồm **4 phần**, học viên phải thuộc lòng:

1. **Dòng đầu (request line):** `METHOD PATH VERSION`
2. **Các header:** dạng `Key: Value`, mỗi dòng một header
3. **Một dòng trống** — ranh giới báo hiệu "hết header"
4. **Body** — phần dữ liệu (có thể rỗng)

Response cũng đúng cấu trúc đó, chỉ khác dòng đầu là **status line**:

```http
HTTP/1.1 201 Created
Content-Type: application/json
Content-Length: 52

{"id":42,"title":"Hoc Node.js","done":false}
```

> **💡 Đối chiếu Frontend**
> Object `Response` mà học viên quen dùng trong `fetch` chỉ là lớp bọc do trình duyệt tạo ra **sau khi đã parse** đoạn văn bản trên. Trong Node, `req` và `res` cũng vậy — chỉ là lớp bọc. Ở buổi 04 ta sẽ tự tay bóc nó ra.

### 2.2. Stateless — khái niệm quan trọng nhất buổi học

**Mỗi HTTP request là một tờ giấy trắng. Server không nhớ request trước đó của cùng một người dùng.**

Đây là khác biệt tư duy lớn nhất so với frontend, nơi state sống dai dẳng trong bộ nhớ suốt phiên làm việc.

Hệ quả trực tiếp — và **mọi thứ ta học sau này đều sinh ra từ hệ quả này**:

| Vấn đề | Sinh ra giải pháp | Học ở buổi |
|---|---|---|
| Muốn biết "ai đang gọi" → phải gửi kèm bằng chứng ở *mỗi* request | Cookie / JWT | 16–17 |
| Muốn giữ dữ liệu qua nhiều request → phải ghi ra chỗ khác | Database | 12–14 |
| Không nhớ gì → chạy 10 bản sao song song được | Horizontal scaling | 44 |

Câu hỏi hỏi lớp:

> *"Nếu server không nhớ gì, tại sao Facebook vẫn biết bạn là ai khi bạn F5 trang?"*

Dẫn tới câu trả lời: vì trình duyệt **gửi lại** bằng chứng (cookie) ở mỗi request. Server không nhớ — client phải tự nhắc.

### 2.3. Status code — hợp đồng ngữ nghĩa với frontend

| Nhóm | Ý nghĩa | Hay dùng | Bẫy thường gặp |
|---|---|---|---|
| **2xx** | Thành công | `200` OK · `201` Created · `204` No Content | Trả `200` cho mọi thứ, kể cả khi vừa tạo mới |
| **3xx** | Chuyển hướng | `301` vĩnh viễn · `302` tạm thời | Dùng `301` nhầm → trình duyệt cache vĩnh viễn, cực khó gỡ |
| **4xx** | Client sai | `400` · `401` · `403` · `404` · `409` · `422` | Nhầm `401` (chưa đăng nhập) với `403` (đã đăng nhập, không đủ quyền) |
| **5xx** | Server sai | `500` · `502` · `503` | Trả `500` khi thực chất client gửi sai → hỏng thống kê lỗi, báo động giả lúc 3h sáng |

Nhấn mạnh: **status code là API contract**. Frontend viết:

```js
if (res.status === 401) redirectToLogin();
```

Nếu backend trả sai mã, frontend hỏng — và đây là loại bug rất khó truy vết vì "API vẫn trả về dữ liệu mà".

### 2.4. HTTP method — ý nghĩa, không phải cú pháp

| Method | Ý nghĩa | Idempotent? | Có body? |
|---|---|---|---|
| `GET` | Đọc, không đổi gì | ✅ | ❌ |
| `POST` | Tạo mới | ❌ | ✅ |
| `PUT` | Thay thế toàn bộ | ✅ | ✅ |
| `PATCH` | Sửa một phần | ❌ | ✅ |
| `DELETE` | Xoá | ✅ | ❌ |

**Idempotent** = gọi 1 lần hay 10 lần cho cùng kết quả. Giải thích bằng ví dụ đời thường: bấm nút "Đặt hàng" (POST) hai lần → hai đơn hàng. Bấm "Xoá đơn #5" (DELETE) hai lần → vẫn chỉ xoá một đơn, lần hai không làm gì thêm.

> Khái niệm này sẽ quay lại ở buổi 24 (thiết kế API) và buổi 26 (retry job trong queue).

---

## 3. Thực hành (75–145′)

Toàn bộ code buổi này nằm ở [`code/buoi-01-raw-http/`](../../code/buoi-01-raw-http/).

### Bước 1 — Đọc header bằng curl (75–95′)

Mục đích: thấy response thật, không qua lớp bọc của DevTools.

```bash
# -i: in cả header lẫn body
curl -i https://api.github.com/users/nodejs

# -I: chỉ xem header (gửi HEAD request)
curl -I https://api.github.com/users/nodejs

# -v: xem toàn bộ hội thoại, kể cả request mình gửi đi
curl -v https://api.github.com/users/nodejs

# Gửi POST kèm JSON — giả lập đúng những gì frontend làm
curl -X POST https://httpbin.org/post \
  -H "Content-Type: application/json" \
  -d '{"title":"Hoc Node.js","done":false}'
```

Yêu cầu học viên chỉ ra trong output: dòng status, `content-type`, `date`, và các header đặc thù như `x-ratelimit-remaining` — GitHub cho biết bạn còn bao nhiêu lượt gọi.

> Một khái niệm ta sẽ **tự tay implement** ở buổi 22 (rate limiting).

### Bước 2 — Tự gửi HTTP thô bằng TCP socket (95–120′)

Đây là khoảnh khắc "à há" của buổi học. Bỏ qua mọi thư viện HTTP, mở thẳng kết nối TCP và gõ giao thức bằng tay.

Cho học viên gõ lại file [`raw-request.js`](../../code/buoi-01-raw-http/raw-request.js):

```bash
node raw-request.js
```

Output thật sẽ trông như sau:

```http
HTTP/1.1 200 OK
Date: Sat, 15 Aug 2026 03:41:59 GMT
Content-Type: text/html
Transfer-Encoding: chunked
Connection: close
Server: cloudflare

22f
<!doctype html><html lang="en">...</html>

0
```

**Bốn điều phải dừng lại phân tích khi output hiện ra:**

1. **Response cũng là văn bản thuần** — status line, headers, dòng trống, rồi HTML. Đúng cấu trúc vừa học.
2. **`Transfer-Encoding: chunked`** — thay vì báo trước độ dài bằng `Content-Length`, server gửi từng khối kèm kích thước ở dạng hex (`22f` = 559 byte), kết thúc bằng khối rỗng `0`. Đây là cách server trả dữ liệu **khi chưa biết trước độ dài** — ví dụ dữ liệu sinh dần từ database. Ta sẽ dùng đúng cơ chế này ở buổi 06 (stream).
3. **Dữ liệu về theo nhiều `chunk`** — sự kiện `data` chạy nhiều lần. Đây chính là **stream**, chủ đề buổi 06.
4. **Bỏ header `Host` thử xem** — server trả `400 Bad Request`. Vì HTTP/1.1 bắt buộc có `Host` để biết bạn hỏi website nào trên cùng một địa chỉ IP.

> **📝 Ghi chú giảng viên**
> Cho học viên sửa `'GET / HTTP/1.1'` thành `'GET /khong-ton-tai HTTP/1.1'` và quan sát status đổi thành `404`.
> Nhấn mạnh: ***404 do server quyết định, không phải một hiện tượng tự nhiên.*** Ở buổi 05, chính học viên sẽ là người viết dòng code quyết định khi nào trả 404.

### Bước 3 — Đảo vai: server nhận được gì? (120–145′)

Chạy [`echo-server.js`](../../code/buoi-01-raw-http/echo-server.js), rồi mở `http://localhost:3000` trong trình duyệt.

```bash
node echo-server.js
```

Học viên sẽ thấy trình duyệt gửi một loạt header mà họ chưa từng để ý:

```
GET / HTTP/1.1
Host: localhost:3000
User-Agent: Mozilla/5.0 ...
Accept: text/html,application/xhtml+xml,...
Accept-Encoding: gzip, deflate, br
Accept-Language: vi-VN,vi;q=0.9
Connection: keep-alive
Sec-Fetch-Mode: navigate
```

Hỏi lớp:

> *"Header nào trong số này sẽ giúp ta biết người dùng đã đăng nhập hay chưa?"*

→ dẫn tự nhiên sang `Cookie` / `Authorization`, chủ đề authentication về sau.

> **⚠️ Lỗi hay gặp — dạy bằng con số cụ thể**
> `Content-Length` phải tính bằng **byte**, không phải số ký tự.
>
> Chuỗi `'Xin chào từ TCP server thuần!'` có **29 ký tự** nhưng chiếm **34 byte** — vì mỗi chữ có dấu (`à`, `ừ`, `ầ`…) tốn 2–3 byte trong UTF-8. Cho học viên tự kiểm chứng ngay tại lớp:
>
> ```js
> const s = 'Xin chào từ TCP server thuần!';
> console.log(s.length);                 // 29  ← số ký tự
> console.log(Buffer.byteLength(s));     // 34  ← số byte thật gửi đi
> ```
>
> Nếu khai `body.length`, trình duyệt chỉ đọc 29 byte đầu rồi dừng → **nội dung bị cắt cụt giữa chừng**. Cho học viên thử sai để thấy tận mắt. Đây cũng là lần đầu học viên chạm tới khái niệm **Buffer** — sẽ đào sâu ở buổi 06.

---

## 4. Bài tập về nhà

1. **Khảo sát header.** Dùng `raw-request.js` gọi tới **ba API công khai khác nhau**. Với mỗi API, lập bảng liệt kê toàn bộ response header và giải thích ý nghĩa của ít nhất 5 header.

2. **Đổi Content-Type.** Sửa `echo-server.js` để trả về HTML thay vì text thuần, kiểm chứng trình duyệt render khác đi thế nào. Sau đó **cố tình** khai báo sai `Content-Type: image/png` và mô tả hiện tượng.

3. **Viết luận ngắn (150 chữ).** Trả lời: *"Vì sao HTTP stateless lại vừa là điểm yếu vừa là điểm mạnh?"*
   → Bài này sẽ được dùng lại làm điểm tựa ở buổi 16 (authentication).

---

## 5. Checklist kết thúc buổi

Học viên phải trả lời được:

- [ ] Một HTTP request gồm mấy phần? Kể tên.
- [ ] Vì sao dòng trống giữa header và body lại quan trọng?
- [ ] "Stateless" nghĩa là gì, và nó dẫn tới sự tồn tại của những thứ gì?
- [ ] Khác nhau giữa `401` và `403`?
- [ ] `PUT` và `PATCH` khác nhau chỗ nào?

---

**Buổi tiếp theo:** [Buổi 02 — Node.js runtime & Event Loop](./buoi-02-event-loop.md)
