# Buổi 01 — HTTP thô qua TCP

Giáo án: [`giao-an/phase-0/buoi-01-http-lifecycle.md`](../../giao-an/phase-0/buoi-01-http-lifecycle.md)

Không cần `npm install` — chỉ dùng Node core.

## `raw-request.js`

Gửi một HTTP request bằng tay qua TCP thuần. Không axios, không fetch, không cả module `http`.

```bash
node raw-request.js
```

Quan sát: response là **văn bản thuần** — status line, headers, dòng trống, body. Đúng cấu trúc đã học.

Thử nghiệm tại lớp:
- Đổi `GET /` → `GET /khong-ton-tai` → status thành `404`
- Xoá header `Host` → server trả `400 Bad Request`
- Đổi `Connection: close` → `keep-alive` → chương trình treo, không thoát

## `echo-server.js`

Đảo vai: xem trình duyệt gửi những gì lên server.

```bash
node echo-server.js
# rồi mở http://localhost:3000
```

Thử nghiệm tại lớp:
- Đổi `Content-Type` thành `text/html` → trình duyệt render khác đi
- Đổi `Buffer.byteLength(body)` thành `body.length` → **nội dung tiếng Việt bị cắt cụt**

Vì sao? Chuỗi `'Xin chào từ TCP server thuần!'` có **29 ký tự** nhưng chiếm **34 byte** trong UTF-8:

```js
const s = 'Xin chào từ TCP server thuần!';
console.log(s.length);              // 29
console.log(Buffer.byteLength(s));  // 34
```
