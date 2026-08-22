# Buổi 04 — Dựng HTTP server bằng tay với module `http`

> **Phase 1** · Node.js Core
> **Mục tiêu:** Tự tay viết một HTTP server không framework, hiểu chính xác `req`/`res` là gì, và cảm nhận được cái giá mà Express sẽ trả thay ở Phase 2.
> **Code thực hành:** [`code/buoi-04-http-server/`](../../code/buoi-04-http-server/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 03 |
| 15–50′ | Lý thuyết: module `http` che giấu điều gì |
| 50–90′ | Thực hành: server đầu tiên + mổ xẻ `req` |
| 90–140′ | Thực hành: ba cách viết response + hai cái bẫy |
| 140–170′ | Thực hành: `node --watch`, cấu trúc thư mục |
| 170–180′ | Bài tập & tổng kết |

---

## 1. Lý thuyết (15–50′)

### 1.1. Nhìn lại buổi 01

Mở lại `echo-server.js` của buổi 01. Nhắc lớp nhớ: ta đã phải **tự tay** viết từng ký tự của response:

```js
socket.write('HTTP/1.1 200 OK\r\n');
socket.write('Content-Type: text/plain; charset=utf-8\r\n');
socket.write('Content-Length: ' + Buffer.byteLength(body) + '\r\n');
socket.write('\r\n');
socket.write(body);
```

Hôm nay ta dùng module `http` — và toàn bộ đoạn trên rút gọn thành:

```js
res.end(body);
```

**Câu hỏi mấu chốt: module `http` đã làm hộ ta những gì?**

Cho lớp tự liệt kê trước, rồi chốt lại thành bảng — **giữ bảng này lại tới buổi 10** để đối chiếu với Express:

| Module `http` **có** làm hộ | Module `http` **không** làm hộ |
|---|---|
| ✅ Parse request line → `req.method`, `req.url` | ❌ Routing |
| ✅ Parse header → `req.headers` | ❌ Parse body |
| ✅ Tự thêm `Content-Length` / `Transfer-Encoding` | ❌ Parse query string |
| ✅ Tự thêm `Date`, `Connection` | ❌ Xử lý lỗi tập trung |
| ✅ Quản lý keep-alive | ❌ Phục vụ file tĩnh |

> **📝 Ghi chú giảng viên**
> Bảng cột phải chính là **danh sách việc ta sẽ tự làm trong Phase 1**. Mỗi buổi tới sẽ gạch bớt một dòng: buổi 05 gạch routing + parse body, buổi 07 gạch xử lý lỗi.
> Đến buổi 10, ta chiếu lại bảng và nói: *"Express làm hộ toàn bộ cột phải. Giờ các bạn đã biết nó làm hộ cái gì."*

### 1.2. `req` và `res` thực chất là stream

Điểm này quyết định cả Phase 1:

```js
http.createServer((req, res) => {
  // req: IncomingMessage — là một READABLE stream
  // res: ServerResponse  — là một WRITABLE stream
});
```

Đây không phải chi tiết vụn vặt. Nó giải thích:
- Vì sao body của POST **không có sẵn** trong `req.body` — dữ liệu còn đang chảy tới.
- Vì sao gọi `res.write()` được **nhiều lần**.
- Vì sao gửi file 2GB không làm tràn RAM.

> Buổi 06 sẽ đào sâu stream. Hôm nay chỉ cần học viên nhớ hai chữ: **Readable** và **Writable**.

---

## 2. Thực hành (50–170′)

### Bước 1 — Server đầu tiên (50–65′)

[`01-hello-server.js`](../../code/buoi-04-http-server/01-hello-server.js)

```js
const http = require('node:http');

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  res.end('Xin chào từ module http!\n');
});

server.listen(3000, () => console.log('http://localhost:3000'));
```

Cho học viên thử gọi bằng nhiều method khác nhau và quan sát log:

```bash
curl http://localhost:3000/
curl -X POST http://localhost:3000/bat-ky
curl -X DELETE http://localhost:3000/gi-cung-duoc
```

**Nhận xét quan trọng:** server trả về **cùng một thứ** cho mọi đường dẫn, mọi method. Vì ta chưa có routing. Đó là việc của buổi 05.

### Bước 2 — Mổ xẻ object `req` (65–90′)

[`02-request-anatomy.js`](../../code/buoi-04-http-server/02-request-anatomy.js)

```bash
curl "http://localhost:3000/san-pham?trang=2&sap-xep=gia&sap-xep=ten"
```

Kết quả thật:

```json
{
  "method": "GET",
  "urlThô": "/san-pham?trang=2&sap-xep=gia&sap-xep=ten",
  "pathname": "/san-pham",
  "query": { "trang": "2", "sap-xep": "ten" },
  "queryLặp": ["gia", "ten"],
  "headers": { "host": "localhost:3000", "user-agent": "curl/8.12.1", "accept": "*/*" },
  "httpVersion": "1.1",
  "ipClient": "::1"
}
```

**Ba điểm dễ sai — bắt buộc nhấn mạnh:**

**1. `req.url` KHÔNG phải URL đầy đủ.**
Nó chỉ là `/san-pham?trang=2`. Không có `http://`, không có host. Vì trong HTTP/1.1, host nằm ở header `Host` riêng — nhớ lại buổi 01.

Muốn dùng class `URL` (giống hệt bên browser), phải ghép base:

```js
const url = new URL(req.url, `http://${req.headers.host}`);
```

**2. `req.headers` luôn viết THƯỜNG.**
Client gửi `Content-Type` → ta phải đọc `req.headers['content-type']`. Viết `req.headers['Content-Type']` sẽ ra `undefined`.

> Lỗi kinh điển. Cho học viên mắc một lần tại lớp để nhớ đời.

**3. Query lặp lại cần `getAll()`.**
So sánh trong kết quả trên: `query["sap-xep"]` chỉ giữ `"ten"` (giá trị cuối), còn `queryLặp` trả đủ `["gia", "ten"]`.

```js
url.searchParams.get('sap-xep');     // 'ten'  ← chỉ giá trị cuối
url.searchParams.getAll('sap-xep');  // ['gia', 'ten']
```

> **💡 Đối chiếu Frontend**
> `URL` và `URLSearchParams` là **cùng một API** với bên browser. Học viên đã dùng rồi. Đây là một trong số ít chỗ Node và browser giống hệt nhau — hãy chỉ ra để họ thấy kiến thức cũ vẫn dùng được.

### Bước 3 — Ba cách viết response (90–115′)

[`03-response-api.js`](../../code/buoi-04-http-server/03-response-api.js)

| Cách | Code | Dùng khi |
|---|---|---|
| `writeHead` | `res.writeHead(200, { 'Content-Type': ... })` | Biết hết header cùng lúc |
| `setHeader` | `res.statusCode = 201; res.setHeader(...)` | Set header rải rác ở nhiều nhánh |
| `write` nhiều lần | `res.write('a'); res.write('b'); res.end()` | Dữ liệu sinh dần (stream) |

Quan sát output thật của `/cach-1` vs `/cach-2`:

```
/cach-1 → Transfer-Encoding: chunked      ← Node không biết trước độ dài
/cach-2 → Content-Length: 19              ← Node tính được độ dài
```

Giải thích: khi ta gọi `res.end(body)` với body có sẵn, Node tính được `Content-Length`. Khi ta `write` nhiều lần, nó không biết còn bao nhiêu nữa → chuyển sang `chunked`.

> Đúng cơ chế `Transfer-Encoding: chunked` mà lớp đã thấy ở buổi 01 khi gọi `example.com`. Nối lại kiến thức cho học viên.

**Hàm helper dùng lại suốt Phase 1:**

```js
function guiJson(res, statusCode, duLieu) {
  const body = JSON.stringify(duLieu, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),   // đếm BYTE, nhớ buổi 01
  });
  res.end(body);
}
```

### Bước 4 — Hai cái bẫy (115–140′)

#### Bẫy 1 — `ERR_HTTP_HEADERS_SENT`

```bash
curl -i http://localhost:3000/loi-header
```

```js
res.write('Đã trót gửi dữ liệu rồi...\n');
res.setHeader('X-Qua-Muon', 'khong-the-set');   // 💥 ERR_HTTP_HEADERS_SENT
```

**Vì sao?** Header phải bay đi **trước** body. Khi chunk đầu tiên đã gửi, header đã lên đường rồi — không lấy lại được.

Ví dụ đời thường: đã dán tem và bỏ thư vào thùng bưu điện, giờ muốn sửa địa chỉ trên phong bì.

#### Bẫy 2 — Quên `return` sau `res.end()` → **sập cả server**

> **⚠️ Cảnh báo: gọi endpoint này CUỐI CÙNG trong buổi demo.**

```bash
curl -i http://localhost:3000/khong-co-gi     # chạy trước — OK
curl -i http://localhost:3000/end-hai-lan     # chạy cuối — sập server
curl -i http://localhost:3000/khong-co-gi     # KHÔNG CÒN AI TRẢ LỜI
```

Server in ra rồi chết hẳn:

```
Error [ERR_STREAM_WRITE_AFTER_END]: write after end
    at ServerResponse.end (node:_http_outgoing:1097:15)
Node.js v22.16.0
```

> **⚠️ Bài học quan trọng nhất buổi học**
>
> Code sai:
> ```js
> if (!user) { res.end('không thấy'); }   // ← quên return
> res.end(JSON.stringify(user));          // ← vẫn chạy tiếp
> ```
> Code đúng:
> ```js
> if (!user) { res.end('không thấy'); return; }
> ```
>
> **Hậu quả không chỉ là một request lỗi — mà là TOÀN BỘ TIẾN TRÌNH CHẾT.** Mọi người dùng khác đang kết nối đều mất kết nối, chỉ vì một request quên chữ `return`.
>
> Nối lại buổi 02: đơn luồng, một tiến trình phục vụ tất cả mọi người. Một lỗi không bắt được là sập tất cả.
>
> Buổi 08 sẽ học cách phòng kiểu sập này. Ở Express (buổi 10) lỗi này **vẫn còn nguyên**, chỉ khác thông báo.

### Bước 5 — Công cụ dev (140–170′)

**Tự khởi động lại khi sửa code** — Node 18+ có sẵn, không cần `nodemon`:

```bash
node --watch 01-hello-server.js
```

**Cổng linh hoạt** — chuẩn bị cho việc deploy sau này:

```js
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
```

Giải thích: khi deploy lên cloud (buổi 42), nền tảng sẽ **tự chọn cổng** và báo qua biến `PORT`. Hardcode `3000` là hỏng ngay.

**Xử lý lỗi `EADDRINUSE`** — lỗi học viên chắc chắn sẽ gặp:

```js
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Cổng ${PORT} đang bị chiếm. Đổi cổng hoặc tắt tiến trình cũ.`);
    process.exit(1);
  }
  throw err;
});
```

> **📝 Ghi chú giảng viên**
> Cách tắt tiến trình chiếm cổng — viết sẵn lên bảng, học viên sẽ cần suốt khoá:
>
> ```powershell
> # Windows PowerShell
> Get-NetTCPConnection -LocalPort 3000 -State Listen |
>   Select-Object -ExpandProperty OwningProcess -Unique |
>   ForEach-Object { Stop-Process -Id $_ -Force }
> ```
> ```bash
> # macOS / Linux
> lsof -ti:3000 | xargs kill -9
> ```

---

## 3. Bài tập về nhà

1. **Server đa route thủ công.** Dùng `if/else` theo `pathname` và `req.method`, dựng server có: `GET /`, `GET /ve-chung-toi`, `POST /lien-he`, và 404 cho phần còn lại. Mỗi route trả JSON đúng chuẩn qua hàm `guiJson`.

2. **Đo độ dài đúng.** Viết endpoint `GET /do-dai?text=...` trả về cả `soKyTu` (`text.length`) và `soByte` (`Buffer.byteLength(text)`). Thử với tiếng Việt có dấu và giải thích chênh lệch.

3. **Bắt lỗi cổng.** Thêm xử lý `EADDRINUSE` vào server của bạn. Kiểm chứng bằng cách mở hai terminal cùng chạy một file.

4. **Tự gây lỗi.** Cố tình viết một handler quên `return` sau `res.end()`, chạy, và chụp lại thông báo lỗi. Giải thích trong 3 câu vì sao cả server chết chứ không chỉ một request.

---

## 4. Checklist kết thúc buổi

- [ ] Module `http` làm hộ ta những gì? Không làm hộ những gì?
- [ ] `req` và `res` thuộc loại stream nào?
- [ ] Vì sao `req.url` không có `http://localhost:3000`?
- [ ] Vì sao `req.headers['Content-Type']` trả `undefined`?
- [ ] Khi nào Node dùng `Content-Length`, khi nào dùng `Transfer-Encoding: chunked`?
- [ ] Quên `return` sau `res.end()` gây hậu quả gì? Ở mức nào?

---

**Buổi trước:** [Buổi 03 — Module, npm & CLI tool](../phase-0/buoi-03-module-npm-cli.md)
**Buổi tiếp theo:** [Buổi 05 — Router thủ công & parse body](./buoi-05-router-body.md)
