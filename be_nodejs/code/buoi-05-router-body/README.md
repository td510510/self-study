# Buổi 05 — Router thủ công & parse body

Giáo án: [`giao-an/phase-1/buoi-05-router-body.md`](../../giao-an/phase-1/buoi-05-router-body.md)

Không cần `npm install` — chỉ Node core.

## Chạy

```bash
node --watch server.js
node --test test/router.test.js
```

## Cấu trúc

```
lib/
├── router.js    ← pathToRegex + createRouter (bản chất của mọi routing library)
├── body.js      ← đọc & parse JSON body, giới hạn kích thước
├── errors.js    ← HttpError mang theo status code
└── respond.js   ← chuẩn hoá response & chuyển lỗi thành HTTP
server.js        ← ráp tất cả lại
test/router.test.js
```

## Thử toàn bộ API

```bash
B=http://localhost:3000

curl -s $B/todos
curl -s $B/todos/thong-ke                     # route cụ thể thắng route :id
curl -s $B/todos/999                          # 404
curl -i -X POST $B/todos -H "Content-Type: application/json" -d '{"tieuDe":"Học stream"}'   # 201 + Location
curl -s -X POST $B/todos -H "Content-Type: application/json" -d '{"tieuDe":""}'             # 400 + chiTiet
curl -s -X POST $B/todos -d 'abc'                                                           # 415
curl -s -X POST $B/todos -H "Content-Type: application/json" -d '{hong'                     # 400
curl -s -X PATCH $B/todos/2 -H "Content-Type: application/json" -d '{"xong":true}'          # 200
curl -s -X PUT   $B/todos/2 -H "Content-Type: application/json" -d '{"xong":true}'          # 400 (PUT cần đủ trường)
curl -i -X DELETE $B/todos/1                                                                # 204
curl -i -X DELETE $B/todos                                                                  # 405 + Allow

# 413 — body vượt 1MB
node -e "process.stdout.write(JSON.stringify({tieuDe:'x'.repeat(2*1024*1024)}))" > big.json
curl -s -X POST $B/todos -H "Content-Type: application/json" --data-binary @big.json
```

## Ba điểm dạy cốt lõi

**1. Thứ tự route quyết định route nào thắng.** Route cụ thể (`/todos/thong-ke`) phải đăng ký **trước** route có tham số (`/todos/:id`). Đảo lại là `/todos/thong-ke` rơi vào `:id`. Express hành xử y hệt.

**2. `req.destroy()` làm hỏng response 413.** Cách viết trực giác:

```js
if (tongByte > gioiHan) {
  req.destroy();                      // ❌ giết socket ngay, 413 chưa kịp gửi
  reject(new HttpError(413, '...'));
}
```

→ client nhận status `100`, body rỗng. Cách đúng: `req.pause()` + `Connection: close`.

**3. Log đầy đủ cho mình, trả tối thiểu cho người dùng.** Không bao giờ gửi stack trace cho client — nó lộ đường dẫn server, phiên bản thư viện, cấu trúc database.
