# Buổi 08 — fs/promises, process & graceful shutdown

Giáo án: [`giao-an/phase-1/buoi-08-process-shutdown.md`](../../giao-an/phase-1/buoi-08-process-shutdown.md)

Không cần `npm install`.

```bash
node 01-ghi-file-an-toan.js
node 02-shutdown-ngay-tho.js     # rồi curl /cham + Ctrl+C
node 03-shutdown-dung-cach.js    # rồi curl /cham + Ctrl+C
```

## Kịch bản demo

```bash
# Terminal 1
node 03-shutdown-dung-cach.js

# Terminal 2
curl http://localhost:3000/cham

# Terminal 1: nhấn Ctrl+C NGAY khi thấy "[bắt đầu]"
```

## Kết quả đo thật

| | `02` ngây thơ | `03` đúng cách |
|---|---|---|
| Request đang chạy dở | ❌ `ECONNRESET` sau 835ms | ✅ `200 OK` sau 5041ms |
| Mã thoát | `null` (bị giết) | `0` (thoát sạch) |

## Ba điểm dễ hiểu sai

**1. Không phải request mới nào cũng nhận 503.**

| Loại kết nối | Nhận gì |
|---|---|
| keep-alive đã mở sẵn | `503` + `Connection: close` |
| kết nối TCP mới | `ECONNREFUSED` (server.close() đã đóng cổng lắng nghe) |

**2. Thiếu `server.closeIdleConnections()` → shutdown treo.** `server.close()` chờ client tự ngắt, với keep-alive có thể hàng chục giây.

**3. `process.exitCode` chỉ hiệu quả khi mọi handle đã đóng.** Timer chưa `unref()`, kênh IPC, kết nối DB — bất kỳ handle nào còn mở đều giữ tiến trình sống.

## Lưu ý cho Windows

Windows không có hệ thống tín hiệu thật. `Ctrl+C` vẫn tạo `SIGINT` và Node xử lý được, **nhưng không thể gửi `SIGINT`/`SIGTERM` từ tiến trình khác** — `child.kill()` giết ngay, không qua handler.

Vì vậy `03-shutdown-dung-cach.js` có thêm kênh **IPC** để viết được test tự động:

```js
if (process.send) {
  process.on('message', (msg) => {
    if (msg === 'shutdown') tatTuTe('IPC').then(() => process.disconnect());
  });
}
```

Trên Linux/macOS dùng `SIGTERM` như bình thường.
