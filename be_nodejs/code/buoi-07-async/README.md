# Buổi 07 — Async patterns & xử lý lỗi

Giáo án: [`giao-an/phase-1/buoi-07-async.md`](../../giao-an/phase-1/buoi-07-async.md)

Không cần `npm install`.

```bash
node 01-tuan-tu-vs-song-song.js
node 02-bay-foreach.js
node 03-promise-combinators.js
node 04-bay-xu-ly-loi.js
node 05-promisify-va-luoi-an-toan.js
```

## Số liệu thật đo được

| Demo | Kết quả |
|---|---|
| 5 lời gọi × 300ms — tuần tự | **1505 ms** |
| 5 lời gọi × 300ms — song song | **302 ms** |
| 20 việc × 100ms, giới hạn 5 đồng thời | **404 ms**, đỉnh đồng thời = 5 |

## Bốn quy tắc

1. **Trong code async, không dùng `forEach`.** Cần tuần tự → `for...of` + `await`. Cần song song → `map` + `Promise.all`.
2. **Luôn `await` trước hàm async**, kể cả khi không cần kết quả — nếu không, lỗi thành `unhandledRejection`.
3. **`Promise.all` ném lỗi đầu tiên và nuốt phần còn lại.** Nó gắn handler vào mọi promise nên lỗi sau *không* thành `unhandledRejection` — chúng biến mất lặng lẽ. Cần biết mọi lỗi → `allSettled`.
4. **Lưới an toàn cấp tiến trình phải `process.exit(1)`**, không được "chạy tiếp như không có gì".

## Bẫy `forEach` — hậu quả thật

```js
app.post('/import', async (req, res) => {
  danhSach.forEach(async (item) => { await luuVaoDb(item); });
  res.json({ ok: true });     // ← trả về khi CHƯA lưu xong gì cả
});
```

Client nhận `{ ok: true }`, dữ liệu chưa vào database. Server restart → mất sạch, không một dòng log lỗi.
