# Buổi 49 — Design pattern & SOLID trong backend Node

> **Phase 6** · Hero — vượt qua mức junior
> **Mục tiêu:** Nhận ra *khi nào* code cần một pattern (và khi nào không), refactor một hàm "biết tuốt" thành các mảnh thay được, test được — và hiểu NestJS đã làm hộ ta những gì ở Phase 4.
> **Code thực hành:** [`code/buoi-49-design-patterns/`](../../code/buoi-49-design-patterns/)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Khởi động Phase 6: vì sao có phase này |
| 15–45′ | **Đọc code xấu mà vẫn chạy** — đếm lý do để sửa |
| 45–80′ | Adapter + Strategy: san phẳng hai SDK khác nhau |
| 80–105′ | Factory/Registry & chữ **O** — và một cái bẫy gặp thật |
| 105–130′ | Decorator: retry và đo thời gian mà không sửa ai |
| 130–155′ | Observer & bẫy EventEmitter |
| 155–175′ | **DI thủ công & composition root** — mở hộp NestJS |
| 175–180′ | Bài tập |

---

## 1. Khởi động Phase 6 (0–15′)

Sau capstone (buổi 48), học viên đã làm được một backend production-ready. Phase 6 trả lời câu hỏi tiếp theo: *"Còn gì ngăn tôi lên mid/senior?"*

| Buổi | Chủ đề | Vì sao senior phải biết |
|---|---|---|
| 49 | Design pattern & SOLID | Code sống 5 năm, qua tay 20 người |
| 50 | OAuth2 / OpenID Connect | Không ai tự viết đăng nhập Google — nhưng ai cũng phải tích hợp **đúng** |
| 51 | Thanh toán & webhook | Tiền thật, bên thứ ba, mạng không hoàn hảo |
| 52 | RabbitMQ | Giao tiếp bất đồng bộ giữa các dịch vụ |
| 53 | Microservices: outbox & saga | Nhất quán dữ liệu khi không còn transaction chung |
| 54 | Observability | Gỡ lỗi hệ thống mà không thể "đặt breakpoint" |
| 55 | Diễn tập sự cố & tổng kết | Bình tĩnh khi production cháy |

> **📝 Ghi chú giảng viên**
> Nói rõ ngay từ đầu: **pattern không phải mục tiêu**. Một đoạn code có 5 pattern mà giải quyết vấn đề 1 dòng là code *tệ hơn*. Buổi này dạy **nhận ra vấn đề** trước, gọi tên pattern sau.

---

## 2. Đọc code xấu mà vẫn chạy (15–45′)

```bash
cd code/buoi-49-design-patterns
npm run truoc
```

Mở [`src/truoc-refactor.js`](../../code/buoi-49-design-patterns/src/truoc-refactor.js). Hàm `datHang` **chạy đúng**. Hỏi lớp: *"Vậy nó có vấn đề gì?"*

Cho lớp đếm **lý do để hàm này bị sửa**:

| Thay đổi nghiệp vụ | Phải sửa `datHang`? |
|---|---|
| Thêm cổng thanh toán thứ ba | ✅ thêm một nhánh `else if` 20 dòng |
| Đổi nhà cung cấp email | ✅ |
| Thêm "cộng điểm thưởng" | ✅ |
| Thêm retry khi ví điện tử timeout | ✅ sửa từng nhánh |
| Muốn test logic "hết hàng" | ❌ không test được nếu không chạy thật cả cổng thanh toán |

> Bốn lý do để sửa = bốn trách nhiệm. Mỗi lần sửa một cái, có nguy cơ làm hỏng ba cái kia.

### SOLID — chỉ giữ phần dùng hằng ngày

| Chữ | Phát biểu một dòng | Triệu chứng khi vi phạm |
|---|---|---|
| **S** — Single responsibility | Một module chỉ có **một lý do để thay đổi** | File tên `utils.js` 2.000 dòng; mỗi PR đụng cùng một hàm |
| **O** — Open/closed | Thêm tính năng bằng cách **thêm** code, không **sửa** code cũ | Chuỗi `if/else` / `switch` theo loại, dài dần mỗi quý |
| **L** — Liskov | Lớp con dùng thay lớp cha được mà không bất ngờ | Lớp con ném `NotImplemented` cho một nửa phương thức |
| **I** — Interface segregation | Đừng bắt ai phụ thuộc thứ họ không dùng | Mock một "service" 30 hàm chỉ để test một hàm |
| **D** — Dependency inversion | Phụ thuộc vào **hình dạng**, không vào lớp cụ thể | `import { prisma }` rải khắp service → không test được |

> **📝 Ghi chú giảng viên**
> S và D là hai chữ học viên dùng **mỗi ngày**. O dùng khi có "loại" (cổng thanh toán, kênh thông báo, định dạng xuất file). L và I chỉ cần nhận ra khi đọc code người khác. Đừng dành 30 phút cho Liskov.

---

## 3. Adapter + Strategy (45–80′)

Mở [`sdk-gia-lap.js`](../../code/buoi-49-design-patterns/src/thanh-toan/sdk-gia-lap.js). Hai SDK "bên thứ ba", **không sửa được** (chúng nằm trong `node_modules`):

| | Ví điện tử | Thẻ quốc tế |
|---|---|---|
| Kiểu API | callback | Promise |
| Đơn vị tiền | đồng | **cent USD** |
| Kết quả | `{ transId }` | `{ id, status }` |
| Báo lỗi | `err` đầu callback | `status: 'failed'` — **không throw!** |

Adapter ([`adapter.js`](../../code/buoi-49-design-patterns/src/thanh-toan/adapter.js)) bọc cả hai về **một hình dạng**:

```js
{ ten, thanhToan({ donHangId, soTien }) → Promise<{ maGiaoDich }> }   // soTien: ĐỒNG
```

Ba việc adapter làm — cho lớp chỉ ra trong code:

1. **Đổi kiểu API** — `promisify` callback một lần (nối buổi 07)
2. **Đổi đơn vị** — đồng → cent *ở đây*, service không bao giờ biết "cent" là gì
3. **Đổi cách báo lỗi** — `status: 'failed'` thành `throw new LoiThanhToan(...)`, và đánh dấu `tamThoi` cho lỗi mạng

> Câu hỏi cho lớp: *"Vì sao adapter phải phân biệt lỗi tạm thời và lỗi vĩnh viễn?"*
> → Vì tầng retry (mục 5) cần biết. Thẻ bị từ chối mà thử lại 3 lần, ngân hàng có thể **khoá thẻ của khách**.

**Strategy** là cùng một thứ nhìn từ phía service: service nhận *một* cổng, gọi `thanhToan()`, không cần biết là cổng nào.

> **📝 Ghi chú giảng viên**
> JavaScript không có `interface`. "Hình dạng" ở đây là **thoả thuận** (duck typing). Hỏi: *"Cái gì đảm bảo thoả thuận được giữ?"* → Test (xem `thanh-toan.test.js`: *"hai adapter trả về CÙNG hình dạng"*), và TypeScript nếu có. Nối buổi 28.

---

## 4. Factory/Registry & chữ O (80–105′)

```js
dangKyCong('vi-dien-tu', ({ loiLanDau }) => new ViDienTuAdapter(new ViDienTuSdk({ loiLanDau })));
dangKyCong('the-quoc-te', () => new TheQuocTeAdapter(new TheQuocTeSdk()));

taoCong('vi-dien-tu', cauHinh);   // tên lạ → lỗi rõ ràng, liệt kê tên hợp lệ
```

Thêm cổng thứ ba = **thêm một dòng `dangKyCong`**, không sửa hàm nào có sẵn. Test chứng minh: `factory: cổng mới đăng ký được mà không sửa code cũ`.

### ⚠️ Lỗi gặp thật khi soạn bài

> **📝 Ghi chú giảng viên — kể câu chuyện này, nó đáng giá hơn định nghĩa pattern**
>
> Bản đầu đăng ký kiểu:
>
> ```js
> dangKyCong('vi-dien-tu', () => new ViDienTuAdapter(new ViDienTuSdk({ loiLanDau: viLoiLanDau })));
> ```
>
> Chạy demo: kịch bản *"ví lỗi mạng 2 lần"* và *"5 lần"* đều **thành công ngay lần đầu**. Không lỗi, không cảnh báo.
>
> Nguyên nhân: bảng registry là biến module — sống suốt tiến trình (nối buổi 03: module chỉ chạy một lần). Hàm đăng ký chỉ chạy lần đầu; closure **giữ mãi** `viLoiLanDau = 0` của lần gọi đầu tiên.
>
> **Bài học:** registry chỉ giữ *cách tạo*; cấu hình đi vào *lúc tạo*. Và tổng quát hơn: **trạng thái toàn cục là nơi bug ẩn nấp** — nó làm test phụ thuộc thứ tự chạy, làm cấu hình "biến mất".

---

## 5. Decorator (105–130′)

```js
const cong = voiDoThoiGian(voiThuLai(taoCong('vi-dien-tu', cfg)), { ghiNhan });
```

Mỗi decorator nhận một cổng, trả về một cổng **cùng hình dạng**. Vì cùng hình dạng nên xếp chồng được — như búp bê Nga.

Chạy `npm run demo`, xem kết quả thật:

```
── Ví lỗi mạng 2 lần đầu → decorator thử lại
  ↻ vi-dien-tu lỗi tạm thời, thử lại lần 2
  ↻ vi-dien-tu lỗi tạm thời, thử lại lần 3
  ✅ vi-dien-tu · 150000đ · mã GD VI-3-150000
  ⏱  vi-dien-tu thanh-cong sau 128 ms
```

Hỏi lớp: *"Đổi thứ tự thành `voiThuLai(voiDoThoiGian(...))` thì số ms đo được khác gì?"*
→ Đo thời gian bọc **trong** retry thì chỉ đo lần thử cuối; bọc **ngoài** thì đo cả thời gian chờ thử lại. Cái nào đúng tuỳ câu hỏi bạn muốn trả lời — "cổng chậm bao nhiêu" hay "khách chờ bao lâu".

> Đừng nhầm với `@UseGuards()` của NestJS (buổi 33). Cú pháp decorator của TypeScript là tính năng ngôn ngữ; Decorator ở đây là **cách ghép object**. Trùng tên, khác thứ.

---

## 6. Observer & bẫy EventEmitter (130–155′)

Service phát `don-hang.da-dat`; email và thống kê **tự đăng ký**. Thêm việc phụ thứ năm = một dòng `bus.dangKy(...)`.

Nhưng vì sao không dùng luôn `EventEmitter` của Node?

```js
emitter.on('da-dat', () => { throw new Error('SMTP chết'); });
emitter.emit('da-dat', don);   // 💥 lỗi bay NGƯỢC vào service → ĐƠN HÀNG THẤT BẠI vì email
```

```js
emitter.on('da-dat', async () => { throw new Error('SMTP chết'); });
emitter.emit('da-dat', don);   // 💥 unhandledRejection → tiến trình chết (buổi 07)
```

`BusSuKien` ([`su-kien.js`](../../code/buoi-49-design-patterns/src/lib/su-kien.js)) dùng `Promise.allSettled`: mọi listener đều chạy, một cái lỗi không kéo theo cái khác. Test: *"listener sự kiện lỗi KHÔNG làm hỏng đơn hàng"*.

> **Giới hạn cần nói thẳng:** bus trong bộ nhớ → tiến trình chết giữa chừng là **mất sự kiện**. Email chưa gửi thì không bao giờ gửi nữa. Buổi 52–53 đưa đúng ý tưởng này ra RabbitMQ + Outbox. Pattern giữ nguyên, chỉ đổi nơi chứa.

---

## 7. DI thủ công & composition root (155–175′)

Mở [`don-hang.service.js`](../../code/buoi-49-design-patterns/src/don-hang.service.js):

```js
constructor({ kho, cong, bus, taoId = () => crypto.randomUUID() }) { ... }
```

Service **không `import`** cổng thanh toán, email hay database. Mọi thứ được **tiêm vào**. Hệ quả nằm trong test:

```js
const congGia = { ten: 'gia', thanhToan: async () => ({ maGiaoDich: 'GD-1' }) };
const service = new DonHangService({ kho, cong: congGia, bus: busGia, taoId: () => 'DH-1' });
```

Năm test service chạy trong vài mili-giây, không mạng, không DB.

Mở [`container.js`](../../code/buoi-49-design-patterns/src/container.js) — nơi **duy nhất** gọi `new` với lớp cụ thể.

| Tự viết (buổi này) | NestJS (Phase 4) |
|---|---|
| `constructor({ kho, cong })` | `constructor(private kho: KhoService)` |
| `container.js` gọi `new` theo thứ tự | `@Module({ providers })` — Nest tự sắp thứ tự |
| Tự thay đồ giả trong test | `Test.createTestingModule().overrideProvider()` |

> **📝 Ghi chú giảng viên**
> Đây là khoảnh khắc "à" của buổi học: học viên đã dùng DI của Nest suốt Phase 4 mà có thể chưa hiểu nó **thay thế** cái gì. Giờ họ thấy: Nest chỉ là một `container.js` viết bằng decorator.

### Khi nào KHÔNG dùng pattern

| Tình huống | Đừng |
|---|---|
| Chỉ có **một** cổng thanh toán, không có kế hoạch thêm | Factory + registry |
| Script chạy một lần | DI container |
| Hai nhánh `if` đơn giản | Strategy |

> Quy tắc ba lần: lần đầu cứ viết thẳng. Lần hai, chép lại và nhăn mặt. **Lần ba** mới trừu tượng hoá — lúc đó bạn đã biết cái gì thật sự thay đổi.

---

## 8. Bài tập về nhà

1. **Cổng thứ ba.** Thêm cổng "thanh toán khi nhận hàng" (COD). Đếm số file phải **sửa** (không tính file mới). Mục tiêu: chỉ `container.js`.

2. **Decorator thứ ba.** Viết `voiNgatMach(cong, { nguong: 5, moLaiSauMs: 30000 })` — **circuit breaker**: lỗi liên tiếp 5 lần thì trong 30 giây từ chối ngay, không gọi cổng. Viết test. Vì sao nó bảo vệ **cả hai phía**?

3. **Kênh thông báo.** Refactor việc gửi thông báo thành Strategy: email, SMS, Zalo. Khách chọn kênh trong hồ sơ.

4. **Soi Project 2.** Tìm trong `project-02-ecommerce` một chỗ vi phạm **S** hoặc **D** rõ nhất. Viết 5 dòng: vi phạm gì, hậu quả cụ thể, sửa thế nào. *Không cần sửa code.*

5. **Nâng cao.** Viết lại `DonHangService` bằng TypeScript với `interface CongThanhToan`. Cố tình viết một adapter thiếu hàm `thanhToan` — TypeScript báo lỗi ở đâu? So sánh với việc test bắt lỗi đó.

---

## 9. Checklist kết thúc buổi

- [ ] Đếm được số trách nhiệm của một hàm bằng câu hỏi "có bao nhiêu lý do để sửa nó?"
- [ ] S và D phát biểu một dòng, kèm triệu chứng khi vi phạm
- [ ] Adapter làm ba việc gì với SDK bên thứ ba?
- [ ] Vì sao retry chỉ áp cho lỗi **tạm thời**?
- [ ] Cái bẫy của registry dùng chung là gì? Sửa thế nào?
- [ ] Hai cách `EventEmitter` làm hỏng luồng chính khi listener lỗi
- [ ] Composition root là gì? NestJS thay nó bằng gì?
- [ ] Nêu một tình huống dùng pattern là **quá tay**

---

**Buổi trước:** [Buổi 48 — Capstone: bảo vệ & tổng kết](../phase-5/buoi-48-capstone-bao-ve.md)
**Buổi tiếp theo:** [Buổi 50 — Đăng nhập bằng OAuth2 / OpenID Connect](./buoi-50-oauth2-oidc.md)
