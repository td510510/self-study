# Buổi 11 — Middleware nâng cao & validation với zod

Giáo án: [`giao-an/phase-2/buoi-11-middleware-zod.md`](../../giao-an/phase-2/buoi-11-middleware-zod.md)

```bash
npm install
npm start
npm test      # 13 test
```

## Bộ 5 middleware dùng lại được

| Middleware | Việc | Ghi chú |
|---|---|---|
| `requestId()` | Gắn UUID cho mỗi request, trả qua header | Tôn trọng `X-Request-Id` từ proxy |
| `rateLimit()` | Giới hạn số request/IP, trả `429` + `Retry-After` | ⚠️ RAM — chỉ đúng với 1 tiến trình |
| `timeout()` | Không để request treo vô hạn | Dọn cả `finish` lẫn `close` |
| `logRequest()` | Đo thời gian qua `res.on('finish')` | |
| `chiChapNhanJson()` | Khôi phục hành vi `415` | |

Tất cả đều là **middleware factory** — hàm trả về middleware, để cấu hình được:

```js
app.use('/api', rateLimit({ soLanToiDa: 100 }));
app.use('/dang-nhap', rateLimit({ soLanToiDa: 5 }));   // chặt hơn
```

## Thứ tự middleware không được xếp bừa

```js
app.use(requestId());            // đầu tiên → mọi log phía sau có id
app.use(logRequest(logger));     // thứ hai  → đo được cả phần dưới
app.use(timeout(10_000));
app.use(rateLimit(gioiHanRate)); // TRƯỚC express.json()
app.use(chiChapNhanJson());
app.use(express.json());
// ... routes ...
app.use(traVe404);               // sau mọi route
app.use(xuLyLoi);                // LUÔN cuối cùng
```

> Đảo `rateLimit` xuống sau `express.json()` → server vẫn phải đọc hết 1MB body của kẻ tấn công rồi mới từ chối.

## zod thay validator viết tay

| | Project 1 | zod |
|---|---|---|
| ~70 dòng `if/else` | ✍️ | khai báo schema |
| Chống mass assignment | tự xây object `sach` | `.strict()` |
| Trim, ép kiểu, mặc định | tự viết | `.trim()`, `.coerce`, `.default()` |
| Nhiều lỗi cùng lúc | tự gom | có sẵn |

## ⚠️ Bẫy `.partial()` + `.default()`

```js
const base = z.object({ a: z.string(), b: z.boolean().default(false) });
base.partial().parse({});      // → { b: false }  ⚠️ KHÔNG phải {}
```

`.partial()` biến trường thành tuỳ chọn nhưng **không gỡ `.default()`**.

Hậu quả: `PATCH` với body rỗng **lặng lẽ ghi đè** giá trị mặc định lên dữ liệu đang có — mất dữ liệu, không báo lỗi.

Cách sửa: tách schema gốc không có default, rồi `.extend()` thêm default chỉ cho POST/PUT. Xem `src/todos/todo.schema.js`.

## Hệ quả: service gọn hẳn đi

Validate chuyển ra biên → service không phải phòng thủ nữa:

```js
// Project 1: phải kiểm tra id
const id = Number(idTho);
if (!Number.isInteger(id) || id < 1) throw loi.duLieuSai(...);

// Buổi 11: id đã CHẮC CHẮN là số nguyên dương
const todo = repo.layTheoId(id);
```

Đây chính là DTO + ValidationPipe của NestJS ở buổi 32.
