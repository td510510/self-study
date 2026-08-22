# Buổi 05 — Router thủ công & parse body

> **Phase 1** · Node.js Core
> **Mục tiêu:** Tự viết một router mini để hiểu bản chất của mọi routing library, tự parse JSON body, và dựng bộ xử lý lỗi tập trung đầu tiên.
> **Code thực hành:** [`code/buoi-05-router-body/`](../../code/buoi-05-router-body/)

Đây là **buổi bản lề của Phase 1**. Sau buổi này, học viên sẽ không còn coi router là "phép màu" của framework.

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 04 |
| 15–40′ | Lý thuyết: routing thực chất là gì |
| 40–85′ | Thực hành: viết `pathToRegex` + `createRouter` + test |
| 85–120′ | Thực hành: đọc & parse body, giới hạn kích thước |
| 120–160′ | Thực hành: `HttpError` + xử lý lỗi tập trung + ráp server |
| 160–180′ | Bài tập & tổng kết |

---

## 1. Lý thuyết (15–40′)

### 1.1. Routing thực chất là gì?

Mở đầu bằng câu hỏi: *"Khi bạn viết `app.get('/todos/:id', handler)` trong Express, chuyện gì thực sự xảy ra?"*

Câu trả lời gọn: **một vòng lặp `for`, so khớp regex, và gọi hàm.** Hết. Không có phép màu.

Router cần làm đúng bốn việc:

1. **Lưu** danh sách `{ method, path, handler }` khi ta đăng ký route.
2. **So khớp** `req.method` + `req.url` với danh sách đó.
3. **Trích** tham số động (`:id`) ra khỏi đường dẫn.
4. **Gọi** handler tương ứng, hoặc báo không tìm thấy.

Hôm nay ta viết cả bốn.

### 1.2. Từ mẫu đường dẫn tới biểu thức chính quy

Bài toán cốt lõi: biến `'/todos/:id'` thành thứ so khớp được với `'/todos/42'` và lấy ra `42`.

```
'/todos'                  →  /^\/todos\/?$/                       , []
'/todos/:id'              →  /^\/todos\/([^/]+)\/?$/              , ['id']
'/users/:uid/todos/:tid'  →  /^\/users\/([^/]+)\/todos\/([^/]+)\/?$/, ['uid','tid']
```

Viết ba dòng này lên bảng và giải thích từng ký hiệu regex. Đa số học viên frontend biết regex ở mức cơ bản — đây là dịp tốt để củng cố.

> **📝 Ghi chú giảng viên**
> Đừng đưa code sẵn. Hãy để lớp tự đề xuất cách biến `:id` thành regex, rồi cùng nhau vấp vào các bẫy bên dưới. Học viên tự vấp thì nhớ lâu hơn nghe giảng gấp nhiều lần.

---

## 2. Thực hành (40–160′)

### Bước 1 — `pathToRegex` và ba cái bẫy (40–65′)

[`lib/router.js`](../../code/buoi-05-router-body/lib/router.js)

```js
export function pathToRegex(path) {
  const tenThamSo = [];

  // Bước 1: escape ký tự đặc biệt của regex (giữ lại dấu ':')
  const escaped = path.replace(/[.+*?^${}()|[\]\\]/g, '\\$&');

  // Bước 2: đổi mỗi ':ten' thành nhóm bắt giữ
  const pattern = escaped.replace(/:([A-Za-z0-9_]+)/g, (_, ten) => {
    tenThamSo.push(ten);
    return '([^/]+)';
  });

  return { regex: new RegExp(`^${pattern}/?$`), tenThamSo };
}
```

**Bẫy 1 — vì sao `[^/]+` chứ không phải `.+`?**

Với `.+`, route `/todos/:id` sẽ khớp cả `/todos/1/comments/5` và cho `id = '1/comments/5'`. Sai hoàn toàn.
`[^/]+` nghĩa là *"một hoặc nhiều ký tự **không phải** dấu `/`"* → chặn tham số ăn lan sang segment kế tiếp.

**Bẫy 2 — vì sao phải escape trước?**

Nếu path là `/file.json`, dấu `.` trong regex nghĩa là *"ký tự bất kỳ"* → `/fileXjson` cũng khớp. Escape để `.` mang nghĩa đen.

**Bẫy 3 — vì sao có `\/?$`?**

Để cả `/todos` lẫn `/todos/` đều khớp. Người dùng gõ thừa dấu `/` là chuyện bình thường.

### Bước 2 — Viết test cho router (65–85′)

Đây là **lần đầu học viên viết test trong khoá học**. Dùng test runner **có sẵn** của Node, không cần cài Jest:

```bash
node --test test/router.test.js
```

[`test/router.test.js`](../../code/buoi-05-router-body/test/router.test.js) — 5 test, tất cả pass:

```js
test('tham số KHÔNG ăn lan sang segment kế tiếp', () => {
  const { regex } = pathToRegex('/todos/:id');
  assert.ok(!regex.test('/todos/1/comments/5'));
});

test('ký tự đặc biệt của regex được hiểu theo nghĩa đen', () => {
  const { regex } = pathToRegex('/file.json');
  assert.ok(regex.test('/file.json'));
  assert.ok(!regex.test('/fileXjson'));
});
```

> **💡 Điểm dạy quan trọng**
> `pathToRegex` là **hàm thuần** — vào chuỗi, ra object. Không cần dựng server, không cần mạng, không cần database để test nó.
> Đây chính là lý do ta tách logic khỏi I/O (nhắc lại `report.js` ở buổi 03). **Code dễ test là code đã được thiết kế tốt** — không phải ngược lại.

### Bước 3 — `createRouter` và thứ tự route (85–100′)

Điểm dạy lớn nhất: **thứ tự đăng ký quyết định route nào thắng**.

```js
// ⚠️ ĐÚNG: route cụ thể TRƯỚC, route có tham số SAU
router.get('/todos/thong-ke', ...);   // đăng ký trước
router.get('/todos/:id', ...);        // đăng ký sau
```

Nếu đảo lại, gọi `/todos/thong-ke` sẽ rơi vào `/todos/:id` với `id = 'thong-ke'` — rồi `Number('thong-ke')` ra `NaN`, và API trả 404 khó hiểu.

> **📝 Ghi chú giảng viên**
> **Cố tình đảo thứ tự tại lớp**, gọi `/todos/thong-ke`, cho học viên thấy kết quả sai. Rồi mới đảo lại. Express hành xử **y hệt** (buổi 10) — bài học này dùng được cả đời.

Một chi tiết ít framework nào của người mới làm đúng — **405 Method Not Allowed**:

```js
const methodKhac = [];   // route khớp PATH nhưng sai METHOD
...
if (methodKhac.length > 0) {
  res.writeHead(405, { Allow: methodKhac.join(', ') });
}
```

Gọi `DELETE /todos` (chỉ có `GET` và `POST`) trả về:

```
HTTP/1.1 405 Method Not Allowed
Allow: GET, POST
```

Khác với 404 (*"đường dẫn này không tồn tại"*), 405 nói *"đường dẫn tồn tại, nhưng method này thì không"*. Đúng chuẩn HTTP, và giúp frontend debug nhanh hơn nhiều.

### Bước 4 — Đọc và parse body (100–120′)

[`lib/body.js`](../../code/buoi-05-router-body/lib/body.js)

Nhắc lại buổi 04: **`req` là Readable stream**. Body chưa có sẵn — dữ liệu còn đang chảy tới.

```js
export function docBody(req, gioiHan = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let tongByte = 0;

    req.on('data', (chunk) => {
      tongByte += chunk.length;
      if (tongByte > gioiHan) { /* xem phần 413 bên dưới */ }
      chunks.push(chunk);
    });

    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
```

**Ba câu hỏi phải hỏi lớp:**

**1. Vì sao body không có sẵn trong `req.body`?**
Vì `req` là stream — lúc handler chạy, dữ liệu còn đang chảy tới. Với body lớn, chờ đủ dữ liệu có thể mất vài giây. Node không tự chờ hộ, vì nhiều request (GET) không cần body.

**2. Vì sao `Buffer.concat` mà không nối chuỗi?**
Một ký tự UTF-8 có thể bị **cắt đôi giữa hai chunk**. Nối chuỗi từng chunk → chữ tiếng Việt vỡ thành ký tự lạ. Gom `Buffer` rồi mới `toString('utf8')` một lần là an toàn.

> Buổi 06 sẽ đào sâu đúng vấn đề này với stream — hãy báo trước để học viên chờ đợi.

**3. Vì sao phải giới hạn kích thước?**
Không giới hạn = **lỗ hổng DoS**. Kẻ tấn công gửi body 10GB, server gom hết vào RAM rồi chết. `express.json()` mặc định giới hạn 100kb chính vì lý do này.

### Bước 5 — Cái bẫy 413 (120–130′)

> **⚠️ Sai lầm tinh vi — chính giảng viên đã vấp khi soạn bài này**

Cách viết trực giác nhưng **sai**:

```js
if (tongByte > gioiHan) {
  req.destroy();                     // ← ngắt kết nối ngay
  reject(new HttpError(413, '...'));
}
```

Kết quả thật khi test: server ghi log `413` đúng, nhưng **client nhận status `100` và body rỗng**. Vì `destroy()` giết socket ngay lập tức — response 413 chưa kịp gửi đi. Client chỉ thấy kết nối đứt mà không biết vì sao bị từ chối.

Cách đúng:

```js
if (tongByte > gioiHan) {
  req.pause();        // ngừng đọc thêm
  chunks.length = 0;  // giải phóng bộ nhớ đã gom
  reject(new HttpError(413, `Body vượt quá giới hạn ${gioiHan} byte`));
}
```

kèm theo, ở tầng trả lỗi:

```js
// Client vẫn đang gửi dữ liệu lên. Ta đã ngừng đọc,
// nên phải báo đóng kết nối — nếu không, client cứ gửi tiếp mãi.
if (err.statusCode === 413) res.setHeader('Connection', 'close');
```

Kết quả sau khi sửa:

```
$ curl -X POST ... --data-binary @file-2mb.json
{ "loi": "Body vượt quá giới hạn 1048576 byte" }
[status 413]

$ curl http://localhost:3000/todos/thong-ke     # server vẫn sống
[status 200]
```

> **📝 Ghi chú giảng viên**
> Đây là bài học vàng về **kiểm chứng thay vì tin vào trực giác**. Code "trông đúng" nhưng hành vi thực tế sai. Nhấn mạnh với lớp: *luôn tự gọi thử API của mình bằng curl, đừng chỉ đọc code rồi tin là nó chạy đúng.*

### Bước 6 — Xử lý lỗi tập trung (130–160′)

[`lib/errors.js`](../../code/buoi-05-router-body/lib/errors.js) — nối tiếp `DataError` của buổi 03, lần này lỗi mang thêm **status code**:

```js
export class HttpError extends Error {
  constructor(statusCode, message, { cause, chiTiet } = {}) {
    super(message, { cause });
    this.statusCode = statusCode;
    this.chiTiet = chiTiet;
  }
}
```

**Vì sao?** Không có nó, mỗi handler phải tự nhớ trả mã nào — code lặp khắp nơi:

```js
if (!todo) { res.writeHead(404); res.end('...'); return; }   // 😖 lặp
```

Có nó, handler chỉ cần **ném lỗi**, và **một chỗ duy nhất** lo chuyển lỗi thành response:

```js
if (!todo) throw loi.khongTimThay(`Không có todo id = ${id}`);
```

Toàn bộ server gói trong **một** `try/catch`:

```js
const server = http.createServer(async (req, res) => {
  try {
    const daXuLy = await router.handle(req, res);
    if (!daXuLy) throw loi.khongTimThay(`Không có đường dẫn ${req.method} ${req.url}`);
  } catch (err) {
    guiLoi(res, err);
  } finally {
    // log mọi request kèm thời gian xử lý
  }
});
```

> **💡 Đây chính là ý tưởng của:**
> - error-handling middleware trong Express → **buổi 11**
> - Exception Filter trong NestJS → **buổi 35**
>
> Học viên viết tay hôm nay để hiểu bản chất, framework làm hộ sau. Hãy nói rõ điều này để họ thấy công sức bỏ ra hôm nay có giá trị.

**Nguyên tắc bảo mật — không thể thoả hiệp:**

```js
// Lỗi ngoài dự kiến = BUG
console.error('[LỖI KHÔNG MONG ĐỢI]', err);   // ghi log ĐẦY ĐỦ cho mình
json(res, 500, { loi: 'Lỗi máy chủ nội bộ' }); // trả TỐI THIỂU cho client
```

> **⚠️ KHÔNG BAO GIỜ trả stack trace cho client.** Stack trace lộ ra:
> - Đường dẫn thư mục trên server (`D:\Study\...`)
> - Tên thư viện và phiên bản → kẻ tấn công tra lỗ hổng đã biết
> - Cấu trúc database (nếu là lỗi SQL)
>
> Lỗi bảo mật cực phổ biến ở dự án người mới. Gặp lại trong OWASP Top 10 ở buổi 22.
> **Quy tắc: log đầy đủ cho mình, trả tối thiểu cho người dùng.**

---

## 3. Nghiệm thu — chạy thử toàn bộ

```bash
node --watch server.js
```

Kết quả thật của cả bộ endpoint:

| Request | Status | Ghi chú |
|---|---|---|
| `GET /todos` | `200` | có `soLuong` + `duLieu` |
| `GET /todos/thong-ke` | `200` | route cụ thể thắng route `:id` ✅ |
| `GET /todos/999` | `404` | `"Không có todo với id = 999"` |
| `POST /todos` | `201` | kèm header `Location: /todos/3` |
| `POST` body `{"tieuDe":""}` | `400` | kèm `chiTiet.tieuDe` |
| `POST` sai Content-Type | `415` | Unsupported Media Type |
| `POST` JSON hỏng | `400` | không phải 500! |
| `PATCH /todos/2` | `200` | sửa một phần |
| `PUT /todos/2` thiếu trường | `400` | PUT bắt buộc đủ trường |
| `DELETE /todos/1` | `204` | không có body |
| `DELETE /todos` | `405` | kèm `Allow: GET, POST` |
| `POST` body 2MB | `413` | server vẫn sống ✅ |

Log server hiển thị gọn gàng nhờ khối `finally`:

```
GET    /todos                       → 200 (3.7ms)
GET    /todos/thong-ke              → 200 (0.7ms)
POST   /todos                       → 201 (1.1ms)
POST   /todos                       → 415 (0.4ms)
DELETE /todos                       → 405 (0.4ms)
POST   /todos                       → 413 (4.5ms)
```

> **📝 Ghi chú giảng viên — PUT vs PATCH**
> Chỉ vào hai dòng `PUT` và `PATCH` trong bảng. Nhắc lại buổi 01:
> - **PUT** = thay thế **toàn bộ** → thiếu trường là `400`
> - **PATCH** = sửa **một phần** → thiếu trường là bình thường
>
> Rất nhiều API thực tế làm sai chỗ này. Học viên biết đúng từ đầu là một lợi thế.

---

## 4. Bài tập về nhà

1. **Thêm resource mới.** Dựng đầy đủ CRUD cho `/ghi-chu` (note) dùng lại `router.js`, `body.js`, `errors.js` — không sửa gì trong `lib/`. Nếu phải sửa `lib/`, nghĩa là thiết kế của bạn chưa đủ tổng quát.

2. **Phân trang.** Thêm `?trang=1&moiTrang=10` cho `GET /todos`. Trả về metadata: `{ tong, trang, moiTrang, tongSoTrang, duLieu }`.

3. **Test router.** Viết thêm ít nhất 3 test cho `pathToRegex`, bao gồm trường hợp route rỗng `'/'` và route có ký tự đặc biệt.

4. **Tự vấp bẫy thứ tự.** Đảo `/todos/:id` lên trước `/todos/thong-ke`, gọi thử, chụp kết quả sai, rồi giải thích trong 3 câu vì sao.

5. **Middleware mini (nâng cao).** Thêm khả năng đăng ký middleware chạy trước mọi route:
   ```js
   router.use((req, res) => { req.thoiGianBatDau = Date.now(); });
   ```
   → Bài này chuẩn bị trực tiếp cho buổi 10 (Express middleware).

---

## 5. Checklist kết thúc buổi

- [ ] Routing thực chất là gì? Kể 4 việc router phải làm.
- [ ] Vì sao dùng `[^/]+` mà không dùng `.+`?
- [ ] Vì sao route cụ thể phải đăng ký trước route có tham số?
- [ ] Khác nhau giữa `404`, `405`, `415`?
- [ ] Vì sao phải `Buffer.concat` thay vì nối chuỗi từng chunk?
- [ ] Vì sao `req.destroy()` làm hỏng response 413?
- [ ] Vì sao không được trả stack trace cho client?

---

**Buổi trước:** [Buổi 04 — Dựng HTTP server bằng tay](./buoi-04-http-server.md)
**Buổi tiếp theo:** Buổi 06 — Stream & Buffer
