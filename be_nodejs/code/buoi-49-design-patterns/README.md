# Buổi 49 — Design pattern & SOLID trong backend Node

Giáo án: [`giao-an/phase-6/buoi-49-design-pattern-solid.md`](../../giao-an/phase-6/buoi-49-design-pattern-solid.md)

Không cần Docker, không cần `npm install` (chỉ dùng Node thuần).

```bash
npm run truoc   # hàm "biết tuốt" — trước khi refactor
npm run demo    # cùng kịch bản, sau khi refactor
npm test        # 13 test
```

## Bản đồ file → pattern

| File | Pattern | Giải quyết việc gì |
|---|---|---|
| `src/truoc-refactor.js` | *(phản mẫu)* | Một hàm 4 trách nhiệm, chuỗi `if/else` theo cổng thanh toán |
| `src/thanh-toan/sdk-gia-lap.js` | — | Hai SDK "bên thứ ba" có API **khác nhau** (callback vs Promise, đồng vs cent) |
| `src/thanh-toan/adapter.js` | **Adapter** + **Strategy** | San phẳng hai SDK về cùng một hình dạng `thanhToan({ donHangId, soTien })` |
| `src/thanh-toan/nha-may.js` | **Factory** + Registry | Thêm cổng mới bằng `dangKyCong()`, không sửa code cũ (chữ **O**) |
| `src/lib/trang-tri.js` | **Decorator** | Thêm retry, đo thời gian mà không đụng vào adapter |
| `src/lib/su-kien.js` | **Observer** | Việc phụ (email, thống kê) tự đăng ký; một listener lỗi không làm hỏng đơn |
| `src/kho.repository.js` | **Repository** | Service hỏi "còn hàng không", không viết SQL |
| `src/don-hang.service.js` | **DI** thủ công | Mọi phụ thuộc tiêm qua constructor (chữ **D**) |
| `src/container.js` | Composition root | Nơi DUY NHẤT gọi `new` — việc NestJS làm tự động |

## Kết quả chạy thật

```
── Ví lỗi mạng 2 lần đầu → decorator thử lại
  ↻ vi-dien-tu lỗi tạm thời, thử lại lần 2
  ↻ vi-dien-tu lỗi tạm thời, thử lại lần 3
  ✅ vi-dien-tu · 150000đ · mã GD VI-3-150000
  ⏱  vi-dien-tu thanh-cong sau 128 ms

── Ví lỗi mạng 5 lần → hết lượt thử, hàng được trả lại kho
  ↻ vi-dien-tu lỗi tạm thời, thử lại lần 2
  ↻ vi-dien-tu lỗi tạm thời, thử lại lần 3
  ❌ LoiThanhToan: Ví điện tử lỗi khi thanh toán đơn 15c6f643-…
  ⏱  vi-dien-tu loi sau 136 ms
  📦 tồn kho "Áo thun" còn 5
```

## ⚠️ Lỗi gặp thật khi soạn bài

Bản đầu, hai kịch bản "ví lỗi mạng" **không hề lỗi** — chạy thành công ngay lần đầu.

Nguyên nhân: registry trong `nha-may.js` sống suốt tiến trình, và hàm tạo cổng được đăng ký kiểu
`() => new ViDienTuSdk({ loiLanDau })` — closure **giữ mãi cấu hình của lần gọi đầu tiên**.
Mọi cấu hình sau bị lờ đi, **không có lỗi nào báo**.

Sửa: registry chỉ giữ *cách tạo*; cấu hình truyền vào *lúc tạo* — `taoCong(ten, cauHinh)`.
Đây là cái bẫy kinh điển của mọi thứ "dùng chung toàn cục" (singleton, module-level state).
