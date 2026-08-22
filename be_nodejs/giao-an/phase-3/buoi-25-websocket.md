# Buổi 25 — Realtime với WebSocket / Socket.IO

> **Phase 3** · Backend chuyên sâu
> **Mục tiêu:** Bước ra khỏi mô hình request-response, hiểu kết nối hai chiều bền vững hoạt động thế nào — và các bẫy bảo mật đi kèm.
> **Code thực hành:** [`src/lib/realtime.js`](../../code/project-02-ecommerce/src/lib/realtime.js) · [`test/realtime.test.js`](../../code/project-02-ecommerce/test/realtime.test.js)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 24 |
| 15–50′ | Vì sao HTTP không đủ — bốn cách giải |
| 50–100′ | **Xác thực WebSocket — bẫy lớn nhất** |
| 100–140′ | Room: gửi đúng người |
| 140–165′ | Máy trạng thái đơn hàng |
| 165–180′ | Khi chạy nhiều bản sao — bài toán còn dang dở |

---

## 1. Vì sao HTTP không đủ (15–50′)

Nhắc lại buổi 01: **HTTP là request-response.** Client **hỏi**, server **trả lời**. Server **không có cách nào** chủ động báo cho client.

Nhưng nghiệp vụ cần: *"đơn hàng của bạn đã được xác nhận"*, *"có đơn mới"*, *"tin nhắn mới"*.

### Bốn cách giải, theo thứ tự lịch sử

| Cách | Cơ chế | Nhược điểm |
|---|---|---|
| **Polling** | client hỏi mỗi 5 giây | 99% request trả về "không có gì mới"; vẫn trễ tới 5s |
| **Long polling** | client hỏi, server **giữ** request tới khi có tin | mỗi client chiếm một kết nối; phức tạp |
| **SSE** (Server-Sent Events) | server đẩy một chiều qua HTTP | chỉ **một chiều**; giới hạn số kết nối trên HTTP/1.1 |
| **WebSocket** | nâng cấp lên kết nối **hai chiều**, giữ mãi | phức tạp hơn; cần xử lý mất kết nối |

> **📝 Ghi chú giảng viên**
> Hỏi lớp: *"Polling mỗi 5 giây, 10.000 người dùng — bao nhiêu request/giây?"*
> → 2.000 request/giây, trong đó **~99% trả về rỗng**. Đó là toàn bộ lý do WebSocket tồn tại.
>
> Nhưng cũng nói rõ: **nếu chỉ cần cập nhật mỗi 30 giây và có ít người dùng, polling là lựa chọn đúng** — đơn giản hơn nhiều. Đừng dùng WebSocket vì nó "hiện đại".

### WebSocket bắt đầu bằng một HTTP request

```
GET /socket.io/ HTTP/1.1
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: ...

← HTTP/1.1 101 Switching Protocols
```

> Sau `101`, kết nối TCP đó **không còn là HTTP nữa** — nó thành một ống hai chiều. Đây là lý do WebSocket dùng chung cổng và chung `http.Server` với Express:
>
> ```js
> const server = app.listen(PORT, ...);
> taoRealtime(server, { ... });   // ← dùng CHUNG server, không mở cổng thứ hai
> ```

### Vì sao Socket.IO chứ không WebSocket thuần?

| Socket.IO cho sẵn | Tự viết thì phải làm |
|---|---|
| Tự kết nối lại khi rớt mạng | tự viết logic retry + backoff |
| Lùi về long-polling khi bị firewall chặn | không có đường lui |
| **Room** — nhóm socket | tự quản danh sách |
| Sự kiện có tên, có ack | tự định nghĩa giao thức trên chuỗi thô |

---

## 2. Trọng tâm: xác thực WebSocket (50–100′)

> **📝 Ghi chú giảng viên — bẫy lớn nhất buổi học**
>
> Hỏi lớp: *"Client kết nối WebSocket. Server làm sao biết đó là ai?"*
>
> Đa số sẽ nói *"đọc header Authorization"*. **Sai** — WebSocket **không tự động** kèm header như HTTP.

### Xác thực ở lúc BẮT TAY, không phải trong từng sự kiện

```js
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Thiếu token'));

  try {
    const payload = xacThucAccessToken(token);
    socket.nguoiDung = { id: Number(payload.sub), vaiTro: payload.vaiTro };
    next();
  } catch {
    next(new Error('Token không hợp lệ'));
  }
});
```

> **Không xác thực lúc bắt tay = ai cũng kết nối được và nghe được mọi thứ.**
>
> Và phải làm ở **middleware**, không phải trong từng handler sự kiện — vì quên một handler là thủng.

Test canh giữ:

```js
test('🚨 KHÔNG có token → TỪ CHỐI kết nối', async () => {
  await assert.rejects(() => ketNoi(undefined), /Thiếu token/);
});

test('🚨 token giả → TỪ CHỐI kết nối', async () => {
  await assert.rejects(() => ketNoi('token.gia.mao'), /không hợp lệ/);
});
```

### Ba khác biệt so với HTTP

| | HTTP | WebSocket |
|---|---|---|
| Xác thực | **mỗi request** | **một lần** lúc bắt tay |
| Token hết hạn | request sau bị 401 | **kết nối vẫn sống** ⚠️ |
| CORS | trình duyệt kiểm tra | phải cấu hình riêng cho Socket.IO |

> **⚠️ Vấn đề token hết hạn:** access token sống 15 phút (buổi 15), nhưng WebSocket có thể mở **hàng giờ**. Kết nối cũ vẫn mang danh tính cũ.
>
> Cách xử lý ở production: định kỳ yêu cầu client gửi token mới, hoặc chủ động ngắt kết nối khi token hết hạn. Bài tập số 5.

---

## 3. Room — gửi đúng người (100–140′)

**Room** là nhóm socket. Đây là cách gửi tin cho **đúng** người thay vì phát cho tất cả.

```js
socket.join(`user:${nd.id}`);

if (nd.vaiTro === 'admin' || nd.vaiTro === 'nhanVien') {
  socket.join('nhan-vien');
}
```

> **⚠️ Tên room lấy từ TOKEN, không phải từ client gửi lên.**
>
> Nếu để client tự chọn room:
> ```js
> socket.on('join', (room) => socket.join(room));   // ❌ THẢM HOẠ
> ```
> thì ai cũng vào `user:42` và nghe được đơn hàng của người khác.
>
> Đây là **cùng một lỗi** với ba thứ đã học:
> - cache thiếu id người dùng (buổi 21)
> - idempotency key thiếu id (buổi 24)
> - IDOR (buổi 16)
>
> Ba biểu hiện, một nguyên nhân: **tin vào dữ liệu client gửi lên để quyết định quyền truy cập.**

### Phát sự kiện

```js
export function baoChoNguoiDung(userId, suKien, duLieu) {
  _io?.to(`user:${userId}`).emit(suKien, duLieu);
}

export function baoChoNhanVien(suKien, duLieu) {
  _io?.to('nhan-vien').emit(suKien, duLieu);
}
```

Test chứng minh cách ly đúng:

```js
test('🔒 khách KHÔNG nhận được thông báo dành cho nhân viên', async () => {
  sKhach.on('don-hang:moi', () => { nhanNham = true; });
  // ... tạo đơn ...
  assert.equal(nhanNham, false, 'khách KHÔNG được vào room nhân viên');
});
```

### Phát sự kiện SAU KHI ghi database

```js
const daSua = await prisma.donHang.update({ ... });

// ⚠️ Phát sự kiện SAU KHI ghi database thành công.
// Phát trước mà transaction rollback là báo tin sai cho khách hàng.
baoChoNguoiDung(don.userId, 'don-hang:doi-trang-thai', { ... });
```

> Hỏi lớp: *"Nếu phát sự kiện bên trong transaction thì sao?"*
> → Transaction rollback nhưng tin nhắn **đã gửi đi rồi** — không thu hồi được. Khách hàng nhận thông báo "đơn đã xác nhận" cho một đơn không tồn tại.

---

## 4. Máy trạng thái đơn hàng (140–165′)

Không phải mọi chuyển trạng thái đều hợp lệ. Đưa luật vào **dữ liệu** thay vì rải `if/else`:

```js
const CHUYEN_HOP_LE = {
  choXacNhan: ['daXacNhan', 'daHuy'],
  daXacNhan: ['dangGiao', 'daHuy'],
  dangGiao: ['daGiao'],
  daGiao: [],      // ← trạng thái cuối
  daHuy: [],
};
```

```js
const choPhep = CHUYEN_HOP_LE[don.trangThai] ?? [];
if (!choPhep.includes(trangThaiMoi)) {
  throw loi.xungDot(
    `Không thể chuyển từ "${don.trangThai}" sang "${trangThaiMoi}". ` +
    `Chỉ cho phép: ${choPhep.join(', ') || '(trạng thái cuối)'}`
  );
}
```

> **📝 Ghi chú giảng viên**
> Cùng một nguyên tắc với **bảng quyền** ở buổi 16: đưa luật vào **dữ liệu**, không rải `if/else`.
>
> Ba lợi ích giống hệt: đọc bảng là biết toàn bộ luật; thêm trạng thái chỉ sửa một chỗ; và **thông báo lỗi tự sinh ra** từ dữ liệu, luôn khớp với luật thật.

Test canh giữ:

```js
test('🚨 KHÔNG cho nhảy cóc trạng thái', async () => {
  // choXacNhan → daGiao bỏ qua daXacNhan và dangGiao
  const r = await doi(donId, 'daGiao').expect(409);
});

test('🚨 trạng thái CUỐI không chuyển được nữa', ...);
test('khách KHÔNG đổi được trạng thái đơn → 403', ...);
```

---

## 5. Bài toán còn dang dở: nhiều bản sao server (165–180′)

```
Bản sao A ─── socket của Người 1
Bản sao B ─── socket của Người 2

Người 1 đặt hàng (rơi vào bản sao A)
→ A gọi baoChoNhanVien(...)
→ Nhân viên đang kết nối vào bản sao B  →  KHÔNG NHẬN ĐƯỢC GÌ
```

> **Vấn đề:** `io.to(room).emit()` chỉ gửi tới các socket **của chính tiến trình đó**.

**Giải pháp: Redis adapter.**

```js
import { createAdapter } from '@socket.io/redis-adapter';
io.adapter(createAdapter(pubClient, subClient));
```

> Socket.IO dùng Redis pub/sub để **phát tin giữa các bản sao**. Bản sao A đăng tin lên Redis, mọi bản sao nhận được và chuyển tới socket của mình.
>
> Đây là **cùng một bài toán** với rate limit ở buổi 21: trạng thái nằm trong RAM tiến trình thì hỏng khi scale ngang. Giải pháp cũng giống nhau — đưa ra kho dùng chung.

Ba vấn đề khác của WebSocket ở production, để học viên biết đường:

| Vấn đề | Hướng giải |
|---|---|
| Load balancer phải "dính" client vào một bản sao | sticky session, hoặc Redis adapter |
| Nginx cần cấu hình riêng cho `Upgrade` | `proxy_set_header Upgrade $http_upgrade` (buổi 42) |
| Kết nối rớt không báo trước | heartbeat/ping — Socket.IO làm sẵn |

---

## 6. Nghiệm thu

```
# tests 58
# pass 58
# fail 0
```

10 test mới:

| Nhóm | Canh giữ |
|---|---|
| Xác thực | token hợp lệ/thiếu/giả |
| Room | khách nhận đúng đơn của mình; nhân viên nhận đơn mới; **khách không nghe được tin nhân viên** |
| Máy trạng thái | không nhảy cóc, trạng thái cuối, phân quyền |

> **📝 Ghi chú giảng viên — lỗi gặp thật khi soạn bài**
> Bốn test đầu tiên fail với `400 Bad Request`. Nguyên nhân **không phải** code sai, mà là **dữ liệu test sai**: địa chỉ `'Test'` chỉ 4 ký tự trong khi schema yêu cầu tối thiểu 5.
>
> Và thông báo lỗi ban đầu chỉ nói `expected 201, got 400` — không nói **vì sao**. Phải sửa test để in cả body lỗi mới tìm ra.
>
> **Bài học:** khi test fail, câu hỏi đầu tiên là *"code sai hay test sai?"*. Và hãy làm cho test **nói rõ nó thấy gì**, đừng chỉ nói nó mong đợi gì.

---

## 7. Bài tập về nhà

1. **Client thật.** Viết một trang HTML nhỏ kết nối Socket.IO, đăng nhập lấy token, và hiển thị thông báo đơn hàng theo thời gian thực. Mở hai tab với hai tài khoản khác nhau để kiểm chứng cách ly.

2. **Tự tạo lỗ hổng.** Thêm `socket.on('join', (room) => socket.join(room))`. Dùng client thật vào room của người khác và nghe trộm. Rồi xoá đi và giải thích.

3. **Thông báo "đang gõ".** Thêm sự kiện hai chiều: khách gõ tin nhắn hỗ trợ → nhân viên thấy "khách đang gõ...". Đây là lúc cần **client gửi tin lên server**, khác với các ví dụ một chiều ở trên.

4. **Đếm người online.** Hiển thị số nhân viên đang kết nối. Gợi ý: `io.sockets.adapter.rooms.get('nhan-vien')?.size`. Vì sao con số này **sai** khi chạy nhiều bản sao?

5. **Token hết hạn.** Access token sống 15 phút nhưng WebSocket mở hàng giờ. Viết cơ chế: server kiểm tra token định kỳ và ngắt kết nối khi hết hạn, client tự kết nối lại với token mới.

6. **Nâng cao — Redis adapter.** Cài `@socket.io/redis-adapter`, chạy **hai** tiến trình server trên hai cổng. Kết nối client vào cổng A, tạo đơn qua cổng B, kiểm chứng client vẫn nhận được thông báo.

---

## 8. Checklist kết thúc buổi

- [ ] Vì sao HTTP không tự báo tin cho client được?
- [ ] Bốn cách giải, mỗi cách nhược điểm gì?
- [ ] WebSocket bắt đầu bằng gì? Status code nào?
- [ ] Vì sao WebSocket dùng chung `http.Server` với Express?
- [ ] Xác thực WebSocket làm ở đâu? Vì sao không làm trong từng sự kiện?
- [ ] Token hết hạn thì kết nối WebSocket có bị ngắt không?
- [ ] Vì sao tên room phải lấy từ token, không lấy từ client?
- [ ] Vì sao phát sự kiện phải **sau** khi ghi database?
- [ ] Vì sao đưa luật chuyển trạng thái vào **dữ liệu** thay vì `if/else`?
- [ ] Chạy nhiều bản sao server thì WebSocket hỏng ở đâu? Giải thế nào?

---

**Buổi trước:** [Buổi 24 — Thiết kế API chuẩn REST](./buoi-24-thiet-ke-api.md)
**Buổi tiếp theo:** Buổi 26 — Background jobs với BullMQ
