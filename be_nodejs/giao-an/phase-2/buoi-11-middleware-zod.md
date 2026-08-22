# Buổi 11 — Middleware nâng cao & validation với zod

> **Phase 2** · Express.js
> **Mục tiêu:** Viết middleware tái sử dụng được, và chặn dữ liệu sai ngay tại cửa ngõ hệ thống — nguyên tắc *validate at the boundary*.
> **Code thực hành:** [`code/buoi-11-middleware-zod/`](../../code/buoi-11-middleware-zod/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 10 |
| 15–70′ | Bộ 5 middleware tự viết, dùng lại được mọi dự án |
| 70–90′ | **Thứ tự middleware — vì sao không được xếp bừa** |
| 90–150′ | zod: schema, `safeParse`, middleware factory |
| 150–170′ | **Bẫy `.partial()` + `.default()`** |
| 170–180′ | Bài tập & tổng kết |

---

## 1. Middleware factory — pattern quan trọng nhất buổi học (15–70′)

[`src/lib/middlewares.js`](../../code/buoi-11-middleware-zod/src/lib/middlewares.js)

Điểm chung của cả 5 middleware: chúng là **hàm trả về middleware**, không phải middleware trực tiếp.

```js
export function rateLimit({ soLanToiDa = 100, cuaSoMs = 60_000 } = {}) {
  const kho = new Map();               // ← state riêng cho mỗi lần gọi

  return (req, res, next) => { ... };  // ← middleware thật nằm ở đây
}
```

**Vì sao?** Để cấu hình được:

```js
app.use('/api', rateLimit({ soLanToiDa: 100 }));
app.use('/dang-nhap', rateLimit({ soLanToiDa: 5 }));   // ← chặt hơn nhiều
```

Mỗi lần gọi tạo một `Map` riêng, hai bộ đếm độc lập.

> **💡 Đối chiếu Frontend**
> Giống hệt custom hook nhận tham số trong React: `useFetch(url, options)` trả về logic đã được cấu hình. Cùng một ý tưởng đóng gói.
>
> Và cũng chính là ý tưởng của **decorator có tham số** trong NestJS: `@Roles('admin')` (buổi 33).

### 1.1. `requestId` — mã định danh cho mỗi request

```js
req.id = req.headers['x-request-id'] ?? randomUUID();
res.setHeader('X-Request-Id', req.id);
```

**Vì sao cần?** Ở production có hàng nghìn request mỗi phút, log trộn lẫn nhau. Có `request-id` thì lọc được toàn bộ log của **một** request cụ thể khi có sự cố.

Hai chi tiết đáng dạy:

1. **Tôn trọng id do proxy gửi xuống** (`req.headers['x-request-id']`) — để truy vết xuyên nhiều service, chuẩn bị cho microservices ở buổi 39.
2. **Trả về qua header** — người dùng gặp lỗi chỉ cần gửi mã đó, ta tra ra ngay toàn bộ ngữ cảnh.

Và trong error middleware:

```js
res.status(500).json({ loi: 'Lỗi máy chủ nội bộ', requestId: req.id });
```

> Người dùng không cần biết lỗi gì. Nhưng khi họ đọc cho ta con số đó, ta biết **chính xác** chuyện gì xảy ra. Đây là cách dung hoà giữa bảo mật (không lộ chi tiết) và khả năng hỗ trợ.

### 1.2. `rateLimit` — và giới hạn của nó

```js
if (ban.dem > soLanToiDa) {
  res.setHeader('Retry-After', conLaiGiay);   // ← chuẩn HTTP
  return next(new HttpError(429, `Quá nhiều request, thử lại sau ${conLaiGiay} giây`));
}
```

> **⚠️ Giới hạn phải nói rõ với lớp**
> Bản này lưu bộ đếm **trong RAM** nên chỉ đúng khi chạy **một tiến trình**. Chạy 4 bản sao (buổi 44) thì mỗi bản đếm riêng → giới hạn thật bị nhân lên 4 lần.
>
> Ở buổi 22 ta chuyển bộ đếm sang **Redis** để mọi bản sao dùng chung.
>
> Dạy luôn thói quen: *khi viết một giải pháp, hãy nói rõ nó hỏng ở đâu.* Đó là khác biệt giữa junior và senior.

### 1.3. `timeout` — dọn dẹp cả hai lối thoát

```js
res.on('finish', () => clearTimeout(dongHo));   // response gửi xong bình thường
res.on('close', () => clearTimeout(dongHo));    // client ngắt giữa chừng
```

Thiếu `close` → client đóng tab, timer vẫn sống tới hết 10 giây. Nhân với hàng nghìn request là rò rỉ bộ nhớ.

---

## 2. Thứ tự middleware — không được xếp bừa (70–90′)

[`src/app.js`](../../code/buoi-11-middleware-zod/src/app.js)

Chiếu đoạn này lên và hỏi lớp: *"Đổi chỗ hai dòng bất kỳ, chuyện gì xảy ra?"*

```js
app.use(requestId());              // 1
app.use(logRequest(logger));       // 2
app.use(timeout(10_000));          // 3
app.use(rateLimit(gioiHanRate));   // 4
app.use(chiChapNhanJson());        // 5
app.use(express.json({ ... }));    // 6
app.get('/health', ...);           // 7
app.use('/todos', router);         // 8
app.use(traVe404);                 // 9
app.use(xuLyLoi);                  // 10 — LUÔN CUỐI CÙNG
```

| Vị trí | Lý do |
|---|---|
| `requestId` **đầu tiên** | để mọi log phía sau đều có id |
| `logRequest` **thứ hai** | để đo được cả thời gian của các middleware phía dưới |
| `rateLimit` **trước** `express.json()` | chặn kẻ tấn công **trước khi** tốn công đọc 1MB dữ liệu của họ |
| `chiChapNhanJson` **trước** `express.json()` | từ chối sớm, khỏi parse vô ích |
| `traVe404` **sau mọi route** | request tới đây nghĩa là không route nào khớp |
| `xuLyLoi` **cuối cùng** | Express chỉ gọi error middleware nằm sau chỗ lỗi phát sinh |

> **📝 Ghi chú giảng viên**
> Cho học viên **thử đảo** `rateLimit` xuống sau `express.json()`, rồi gửi một body 1MB nhiều lần. Server vẫn phải đọc hết body rồi mới từ chối — lãng phí băng thông và bộ nhớ đúng lúc đang bị tấn công.
>
> Đây là ví dụ điển hình: **cùng một tập middleware, thứ tự khác nhau cho ra hệ thống khác nhau về chất.**

---

## 3. Validation với zod (90–150′)

### 3.1. So sánh trực tiếp với validator viết tay

| | Project 1 — `todo.validator.js` | zod — `todo.schema.js` |
|---|---|---|
| Cách viết | ~70 dòng `if/else` | khai báo schema |
| Lỗi trả về | tự gom vào object | zod gom sẵn, nhiều lỗi cùng lúc |
| Trim / ép kiểu | tự viết `.trim()`, `Number()` | `.trim()`, `.coerce` |
| Mặc định | tự gán | `.default()` |
| Chống mass assignment | tự xây object `sach` | `.strict()` |

```js
export const taoTodoSchema = todoGoc.extend({
  xong: todoGoc.shape.xong.default(false),
  uuTien: todoGoc.shape.uuTien.default('trung'),
});
```

> **Khác biệt ngữ nghĩa đáng chú ý:**
> - Project 1: **lặng lẽ loại bỏ** trường lạ
> - `.strict()`: **báo lỗi 400** khi có trường lạ
>
> Cách thứ hai chặt hơn và tốt hơn — client biết ngay mình gửi sai, thay vì tưởng đã lưu thành công.

### 3.2. Middleware factory validate

[`src/lib/validate.js`](../../code/buoi-11-middleware-zod/src/lib/validate.js)

```js
export function validate(nguon, schema) {
  return (req, res, next) => {
    const ketQua = schema.safeParse(req[nguon]);

    if (!ketQua.success) {
      return next(new HttpError(400, 'Dữ liệu không hợp lệ', {
        chiTiet: doiDangLoi(ketQua.error),
      }));
    }

    req[nguon] = ketQua.data;   // ← GHI ĐÈ bằng dữ liệu đã làm sạch
    next();
  };
}
```

Ba điểm dạy:

**(a) `safeParse` chứ không phải `parse`.** `parse` ném exception, `safeParse` trả `{ success, data | error }`. Với dữ liệu từ người dùng, lỗi là **chuyện bình thường**, không phải ngoại lệ — dùng `safeParse` để xử lý bằng luồng điều khiển thường.

**(b) Ghi đè `req[nguon]` bằng dữ liệu đã làm sạch.** Từ đó trở đi, handler chỉ thấy dữ liệu đã trim, đã ép kiểu, đã điền mặc định. **Không cần kiểm tra gì thêm.**

**(c) Express 5 khiến `req.query` chỉ đọc:**

```js
if (nguon === 'query') {
  Object.defineProperty(req, 'query', { value: ketQua.data, writable: true });
} else {
  req[nguon] = ketQua.data;
}
```

> Ở Express 4, `req.query = ...` gán được bình thường. Express 5 biến nó thành getter → gán im lặng không có tác dụng. Bẫy rất hay làm người mới vấp khi nâng cấp.

### 3.3. Hệ quả kiến trúc: service gọn hẳn đi

Vì validate đã chuyển ra **biên**, tầng service không còn phải phòng thủ:

```js
// Project 1
function timHoacNem(idTho) {
  const id = Number(idTho);
  if (!Number.isInteger(id) || id < 1) throw loi.duLieuSai(...);   // ← không cần nữa
  ...
}

// Buổi 11 — id đã CHẮC CHẮN là số nguyên dương
function timHoacNem(id) {
  const todo = repo.layTheoId(id);
  if (!todo) throw loi.khongTimThay(...);
  return todo;
}
```

> **Nguyên tắc: kiểm tra một lần ở cửa ngõ, bên trong tin tưởng.**
> Ở buổi 32, NestJS làm đúng việc này bằng **DTO + ValidationPipe**. Học viên đã hiểu nguyên lý thì chỉ còn học cú pháp.

### 3.4. Khai báo route trở nên tự mô tả

```js
router.put(
  '/:id',
  validate('params', idParamSchema),
  validate('body', thayTheTodoSchema),
  async (req, res) => { ... }
);
```

Đọc một dòng route là biết ngay nó nhận dữ liệu hình dạng nào — không cần mở handler ra xem.

---

## 4. Bẫy `.partial()` + `.default()` (150–170′)

> **📝 Ghi chú giảng viên — lỗi này phát hiện được nhờ có test**

Cách viết trực giác cho schema PATCH:

```js
export const suaTodoSchema = taoTodoSchema.partial().refine(
  (d) => Object.keys(d).length > 0,
  { error: 'Phải có ít nhất một trường để cập nhật' }
);
```

Test `PATCH {}` → **200 thay vì 400**. Vì sao?

Chạy thử để lớp thấy tận mắt:

```js
const base = z.object({ a: z.string(), b: z.boolean().default(false) });

base.partial().parse({});      // → { b: false }   ⚠️
```

**`.partial()` chỉ biến trường thành *tuỳ chọn*, nó KHÔNG gỡ bỏ `.default()`.** Nên `{}` biến thành `{ xong: false, uuTien: 'trung' }` — có 2 khoá, `.refine()` thấy không rỗng nên cho qua.

**Hậu quả thật nếu không phát hiện:** `PATCH /todos/5` với body rỗng sẽ **lặng lẽ ghi đè** `xong = false` và `uuTien = 'trung'` lên dữ liệu đang có. Người dùng mất dữ liệu mà không có lỗi nào báo.

**Cách sửa:** tách schema gốc **không có** default:

```js
const todoGoc = z.object({
  tieuDe: z.string().trim().min(1).max(200),
  xong: z.boolean(),
  uuTien: z.enum(UU_TIEN),
}).strict();

export const taoTodoSchema = todoGoc.extend({          // POST: có mặc định
  xong: todoGoc.shape.xong.default(false),
  uuTien: todoGoc.shape.uuTien.default('trung'),
});

export const suaTodoSchema = todoGoc.partial().refine(...);  // PATCH: không mặc định
```

> **Bài học lớn hơn cả zod:** thư viện làm hộ ta rất nhiều, nhưng **hành vi của nó ở các trường hợp biên thì phải tự kiểm chứng.** Bug này chỉ lộ ra vì có một test cho trường hợp `PATCH {}`.
>
> Hỏi lớp: *"Nếu không viết test đó, bao lâu nữa ta mới phát hiện?"* — câu trả lời thường là: khi khách hàng báo mất dữ liệu.

---

## 5. Nghiệm thu

```
# tests 13
# pass 13
# fail 0
```

Các hành vi được test canh giữ:

| Test | Chứng minh |
|---|---|
| tự trim và điền mặc định | zod làm sạch dữ liệu |
| ép kiểu query thành **số** | `z.coerce` hoạt động |
| gộp **nhiều** lỗi trong một response | ưu điểm so với validator viết tay |
| `.strict()` từ chối trường lạ | chống mass assignment |
| `PATCH {}` → 400 | bẫy `.partial()` đã được vá |
| mọi lỗi kèm `requestId` | truy vết được |
| rate limit → 429 + `Retry-After` | middleware hoạt động |

---

## 6. Bài tập về nhà

1. **Middleware xác thực.** Viết `requireApiKey()` kiểm tra header `X-API-Key` so với `process.env.API_KEY`; thiếu → `401`, sai → `403`. Áp dụng cho `/todos` nhưng **không** cho `/health`. Giải thích vì sao `401` khác `403`.

2. **Đảo thứ tự để thấy hậu quả.** Chuyển `rateLimit` xuống **sau** `express.json()`, gửi body 1MB nhiều lần, mô tả điều gì thay đổi và vì sao đó là vấn đề.

3. **Schema lồng nhau.** Thêm trường `hanChot` (ngày, tuỳ chọn) với `z.iso.datetime()` và kiểm tra nó phải ở **tương lai**. Gợi ý: `.refine()`.

4. **Tự tái hiện bẫy.** Đổi `suaTodoSchema` về dùng `taoTodoSchema.partial()`, chạy test, chụp lại kết quả fail, rồi giải thích bằng lời của bạn.

5. **Middleware `cache-control`.** Viết middleware đặt `Cache-Control: public, max-age=60` cho mọi `GET`, và `no-store` cho các method còn lại.

6. **Nâng cao — suy ra kiểu.** Nếu dự án dùng TypeScript, `z.infer<typeof taoTodoSchema>` cho ra kiểu TS tự động từ schema. Tìm hiểu và viết 5 dòng giải thích vì sao điều đó loại bỏ được cả một lớp bug.

---

## 7. Checklist kết thúc buổi

- [ ] Middleware factory là gì? Vì sao cần trả về hàm thay vì viết middleware trực tiếp?
- [ ] Vì sao `rateLimit` phải đặt trước `express.json()`?
- [ ] Vì sao `timeout` phải dọn cả `finish` lẫn `close`?
- [ ] `safeParse` khác `parse` thế nào? Khi nào dùng cái nào?
- [ ] `.strict()` làm gì? Chống được lỗ hổng nào?
- [ ] Vì sao `req.query` ở Express 5 không gán trực tiếp được?
- [ ] `.partial()` có gỡ bỏ `.default()` không? Hậu quả nếu tưởng là có?
- [ ] Vì sao tầng service gọn đi sau khi có validate ở biên?

---

**Buổi trước:** [Buổi 10 — Express cơ bản](./buoi-10-express-co-ban.md)
**Buổi tiếp theo:** Buổi 12 — PostgreSQL & Prisma: schema và migration
