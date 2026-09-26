# Buổi 52 — Message broker: RabbitMQ (và khi nào cần Kafka)

> **Phase 6** · Hero
> **Mục tiêu:** Cho các dịch vụ nói chuyện **bất đồng bộ** mà không mất message — hiểu ba điều kiện để message sống sót, ack/prefetch, retry có độ trễ, dead letter; và biết khi nào RabbitMQ không đủ.
> **Code thực hành:** [`code/project-05-microservices/`](../../code/project-05-microservices/) — [`shared/mq.js`](../../code/project-05-microservices/shared/mq.js)

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 51 |
| 15–35′ | Dựng Project 5, nhìn hệ thống chạy |
| 35–65′ | **BullMQ đã có, cần RabbitMQ làm gì?** Exchange, queue, binding |
| 65–95′ | Ba điều kiện để message không mất |
| 95–125′ | **Ack, prefetch và "ít nhất một lần"** |
| 125–155′ | Retry có độ trễ & dead letter queue |
| 155–175′ | Kafka: một mô hình khác hẳn |
| 175–180′ | Bài tập |

---

## 1. Dựng Project 5 (15–35′)

```bash
cd code/project-05-microservices
docker compose up -d
npm install && cp .env.example .env
npm run tat-ca
```

Terminal khác:

```bash
curl -X POST localhost:3201/don-hang -H 'content-type: application/json' \
  -d '{"sanPhamId":"mu","soLuong":2,"email":"an@vd.vn"}'
```

Kết quả thật:

```
HTTP/1.1 202 Accepted
{"donHangId":"4ec7259d-…","trangThai":"CHO_XAC_NHAN","xem":"/don-hang/4ec7259d-…"}
```

Hai giây sau:

```bash
curl localhost:3201/don-hang/4ec7259d-…   # → "trangThai":"XAC_NHAN"
curl localhost:3202/san-pham              # → mũ còn 3 (từ 5)
curl localhost:3203/email                 # → "Đơn 4ec7259d đã xác nhận: 2 × mu"
```

Log của ba dịch vụ (rút gọn) — để ý **cùng một `trace_id`**, buổi 54 sẽ giải thích:

```
kho      │ {"trace_id":"c1eb20c8…","donHangId":"4ec7259d…","ketQua":"da-giu","msg":"xử lý đơn mới"}
don-hang │ {"trace_id":"c1eb20c8…","loai":"kho.da-giu","trungLap":false,"msg":"đã nhận kết quả từ kho"}
thong-bao│ {"trace_id":"c1eb20c8…","email":"an@vd.vn","msg":"📧 Đơn 4ec7259d đã xác nhận: 2 × mu"}
```

> **📝 Ghi chú giảng viên**
> Hỏi lớp: *"Vì sao trả 202 chứ không phải 201?"* → Vì lúc trả lời, dịch vụ đơn hàng **chưa biết** còn hàng hay không. 202 = "đã nhận yêu cầu, đang xử lý". Đây là thay đổi tư duy lớn nhất của kiến trúc hướng sự kiện: **API không còn trả kết quả cuối cùng ngay**.

Mở RabbitMQ UI: http://localhost:15673 (hoc/hoc) → tab *Exchanges* → `su-kien` → *Bindings*.

---

## 2. Cần RabbitMQ làm gì khi đã có BullMQ? (35–65′)

| | BullMQ (buổi 26) | RabbitMQ |
|---|---|---|
| Mô hình | **Hàng đợi việc**: "ai đó làm việc này đi" | **Phân phối sự kiện**: "chuyện này đã xảy ra, ai quan tâm thì nghe" |
| Người gửi biết người nhận? | Biết tên hàng đợi | **Không** — chỉ biết tên sự kiện |
| Một message tới bao nhiêu nơi? | Một worker | **Mọi** hàng đợi có binding khớp |
| Ngôn ngữ | Node (BullMQ là thư viện) | Mọi ngôn ngữ (giao thức AMQP) |
| Dùng khi | Việc nền **trong** một dịch vụ | Giao tiếp **giữa** các dịch vụ |

### Exchange → binding → queue

```
  don-hang ──publish("don-hang.da-tao")──▶ [exchange su-kien, loại topic]
                                             │ binding "don-hang.da-tao"
                                             ▼
                                   [kho.don-hang-da-tao] ──▶ dịch vụ kho
```

- **Người gửi** chỉ biết exchange + routing key
- **Người nhận** tự khai báo hàng đợi của mình và binding
- Thêm dịch vụ "phân tích" nghe `don-hang.*` = tạo hàng đợi mới, **không sửa** dịch vụ đơn hàng

> Đây chính là **Observer** của buổi 49 — nhưng qua mạng, giữa các tiến trình, và sống sót khi tiến trình chết.

| Loại exchange | Định tuyến | Ví dụ |
|---|---|---|
| `direct` | routing key khớp **chính xác** | `gui-email` |
| `topic` | khớp mẫu: `*` một từ, `#` nhiều từ | `don-hang.*`, `kho.#` |
| `fanout` | gửi **mọi** hàng đợi gắn vào | phát tin toàn hệ thống |

Project dùng `topic` vì linh hoạt nhất.

### Tên hàng đợi theo **người nhận**, không theo sự kiện

```
kho.don-hang-da-tao              ← "hàng đợi của KHO, chứa sự kiện đơn-hàng-đã-tạo"
thong-bao.don-hang-da-xac-nhan
```

Hai dịch vụ cùng nghe một sự kiện → hai hàng đợi **riêng** → mỗi dịch vụ nhận **một bản sao**. Hai bản sao của **cùng** một dịch vụ (scale ngang) → **cùng** hàng đợi → chia nhau message.

---

## 3. Ba điều kiện để message không mất (65–95′)

> **📝 Ghi chú giảng viên**
> Viết lên bảng: *"Message mất ở đâu?"* — cho lớp liệt kê trước khi giảng.

| Mất ở đâu | Chặn bằng | Trong `mq.js` |
|---|---|---|
| RabbitMQ khởi động lại → hàng đợi biến mất | hàng đợi **durable** | `assertQueue(ten, { durable: true })` |
| RabbitMQ khởi động lại → message trong RAM biến mất | message **persistent** | `publish(..., { persistent: true })` |
| Broker nhận chưa xong thì mạng đứt → người gửi tưởng đã gửi | **publisher confirm** | `createConfirmChannel()` + chờ callback |

**Thiếu bất kỳ cái nào = mất message** trong một tình huống cụ thể. Durable queue mà message không persistent → hàng đợi còn, message mất.

```js
export function phatHanh(ch, khoa, noiDung, { messageId } = {}) {
  return new Promise((resolve, reject) =>
    ch.publish(EXCHANGE, khoa, Buffer.from(JSON.stringify(noiDung)),
      { persistent: true, contentType: 'application/json', messageId },
      (err) => (err ? reject(err) : resolve()))   // ← broker XÁC NHẬN rồi mới resolve
  );
}
```

> Vẫn còn một chỗ mất: dịch vụ ghi DB xong rồi **chết trước khi publish**. Ba điều kiện trên không cứu được. Buổi 53 giải quyết bằng Outbox.

---

## 4. Ack, prefetch và "ít nhất một lần" (95–125′)

### Ack **sau cùng**

```js
await xuLy(suKien);   // ghi DB, v.v.
ch.ack(msg);          // ← chỉ khi đã xong
```

Tiến trình chết **trước** `ack` → broker giao lại message cho consumer khác. **Không bao giờ mất.**

Nhưng: chết **sau** khi ghi DB, **trước** `ack` → message được xử lý **hai lần**.

```
  Không ack được mà đã làm xong   →   TRÙNG
  Ack trước khi làm xong          →   MẤT
```

> Không có lựa chọn thứ ba. Mọi hệ thống message thực tế chọn **"ít nhất một lần"** (at-least-once) và làm consumer **idempotent**. Project 5 dùng bảng `su_kien_da_xu_ly` — buổi 53.

Test *"GIAO TRÙNG: cùng message tới kho 2 lần → chỉ trừ tồn một lần"* chứng minh: tồn kho vẫn 8, `giu_hang` vẫn 1 dòng.

### Prefetch

```js
await ch.prefetch(10);
```

Không đặt → broker đẩy **toàn bộ** hàng đợi (có thể hàng triệu message) vào RAM của consumer. Lần thứ tư trong khoá học gặp cùng một bài học: **giới hạn việc song song** (buổi 07 `Promise.all`, 20 pool, 26 `concurrency`).

> **📝 Ghi chú giảng viên**
> Hỏi: *"prefetch = 10 và pool DB = 10. Có liên quan gì không?"* → Có. Mỗi message đang xử lý giữ một kết nối DB. Prefetch **lớn hơn** pool → message xếp hàng chờ kết nối. Buổi 55 đo được chính hiện tượng này.

### Kho chết thì sao?

Test *"KHO CHẾT"*: tắt dịch vụ kho, đặt hàng.

```
POST /don-hang → 202                      ← đặt hàng VẪN thành công
hàng đợi kho.don-hang-da-tao: 1 message   ← message nằm chờ
kho sống lại → đơn XAC_NHAN               ← xử lý bù, không mất gì
```

> So với gọi HTTP đồng bộ (`await fetch('http://kho/giu-hang')`): kho chết → **đặt hàng lỗi 500**. Message broker biến "dịch vụ khác đang chết" từ **sự cố** thành **độ trễ**.

---

## 5. Retry có độ trễ & DLQ (125–155′)

### Vì sao không `nack(requeue: true)`?

```js
ch.nack(msg, false, true);   // trả lại hàng đợi
```

Message quay lại **ngay lập tức** → lỗi ngay → quay lại → **vòng lặp nóng** đốt 100% CPU và dội dịch vụ đang ốm (nối buổi 26: backoff).

### Hàng đợi thử lại có TTL

```
  q ──lỗi tạm thời──▶ q.thu-lai (expiration: 500·2^lần ms)
                          │ hết TTL → dead-letter-exchange ''
                          ▼ dead-letter-routing-key = q
                          q                                  ← quay về, thử lại
  q ──lỗi vĩnh viễn / hết lượt──▶ q.dlq                      ← người điều tra
```

```js
await ch.assertQueue(`${ten}.thu-lai`, {
  durable: true,
  arguments: { 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': ten },
});
```

RabbitMQ **không có** tính năng "gửi lại sau N giây" có sẵn — ta ghép nó từ TTL + dead-letter. Đếm số lần thử bằng header `x-so-lan-thu`.

> ⚠️ **Giới hạn cần biết:** TTL **theo từng message** chỉ được kiểm ở **đầu** hàng đợi. Message chờ 8s nằm trước message chờ 0.5s → cái sau phải chờ cái trước. Với project này chấp nhận được (chỉ chậm hơn, không sai). Hệ thống lớn dùng **một hàng đợi thử lại cho mỗi mức độ trễ**, hoặc plugin *delayed message exchange*.

### Hai loại lỗi

| | Lỗi tạm thời | Lỗi vĩnh viễn |
|---|---|---|
| Ví dụ | SMTP timeout, DB quá tải | email sai định dạng, JSON hỏng |
| Thử lại có ích? | ✅ | ❌ — lần thứ 100 vẫn sai y hệt |
| Đi đâu | `.thu-lai` → quay lại | **thẳng** `.dlq` |
| Trong code | `throw new Error(...)` | `throw new LoiVinhVien(...)` |

Số đo thật — diễn tập SMTP lỗi ngẫu nhiên 30%, 200 đơn:

```
messages_processed_total{…,ket_qua="thanh_cong"} 99
messages_processed_total{…,ket_qua="thu_lai"}    29
messages_processed_total{…,ket_qua="dlq"}         4     ← đúng 4 đơn có email hỏng
email_da_gui: 594 dòng, 594 đơn khác nhau               ← không email nào trùng
```

Test *"MESSAGE RÁC (không phải JSON) → DLQ, consumer không chết"*: một message hỏng **không được** làm chết consumer, và **không được** kẹt ở đầu hàng đợi chặn mọi message phía sau (*poison message*).

> **DLQ phải có người xem.** Dashboard buổi 54 có ô đỏ *"Message trong DLQ"*. DLQ không ai nhìn = thùng rác âm thầm nuốt đơn hàng.

---

## 6. Kafka — một mô hình khác hẳn (155–175′)

> **📝 Ghi chú giảng viên**
> Buổi này **không** code Kafka — dựng Kafka đúng cách tốn cả buổi và học viên junior/mid hiếm khi phải tự vận hành nó. Mục tiêu: hiểu **khác biệt về mô hình**, để biết khi nào đề xuất nó.

| | RabbitMQ | Kafka |
|---|---|---|
| Bản chất | **Hàng đợi**: message bị xoá sau khi ack | **Nhật ký (log)**: message được **giữ lại** N ngày |
| Người nhận | Broker đẩy message tới | Consumer tự đọc, tự nhớ vị trí (**offset**) |
| Đọc lại quá khứ | ❌ đã ack là mất | ✅ tua offset về trước — "phát lại" cả tuần |
| Thứ tự | Trong một hàng đợi, một consumer | Trong một **partition** (theo key) |
| Scale người nhận | Thêm consumer vào cùng hàng đợi | Thêm consumer vào **consumer group**, tối đa = số partition |
| Định tuyến linh hoạt | ✅ exchange, binding, pattern | ❌ chỉ theo topic |
| Thông lượng | chục nghìn msg/s | **hàng triệu** msg/s |
| Vận hành | đơn giản | phức tạp hơn nhiều |

**Chọn Kafka khi:**
- Cần **đọc lại** lịch sử sự kiện (dựng lại dữ liệu, dịch vụ mới cần toàn bộ quá khứ)
- **Nhiều** hệ thống cùng đọc một luồng dữ liệu lớn (analytics, search index, data lake)
- Thông lượng rất lớn — clickstream, log, IoT

**Chọn RabbitMQ khi:**
- Giao việc giữa các dịch vụ, cần định tuyến linh hoạt, retry, DLQ
- Quy mô vừa phải — phần lớn hệ thống

> Hầu hết team **không** cần Kafka. Nếu phải hỏi "có cần Kafka không?", câu trả lời thường là chưa.

---

## 7. Bài tập về nhà

1. **Dịch vụ thứ tư.** Viết dịch vụ `phan-tich` nghe `don-hang.#` và đếm số đơn theo trạng thái. **Không sửa** ba dịch vụ cũ. Chụp màn hình RabbitMQ UI: exchange `su-kien` giờ có bao nhiêu binding?

2. **Scale ngang.** Chạy **hai** bản sao dịch vụ kho (hai terminal, cổng khác nhau). Bắn 200 đơn. Đếm log mỗi bản sao xử lý bao nhiêu. Có đơn nào bị xử lý hai lần không? Vì sao không?

3. **Mất message thật.** Tạm sửa `phatHanh` bỏ `persistent: true`. Đặt 10 đơn khi kho đang **tắt**, rồi `docker restart hocbe-micro-rabbitmq`. Còn bao nhiêu message? Khôi phục lại code và làm lại.

4. **Prefetch.** Đặt `KHO_DO_TRE_MS=200`, thử `prefetch` = 1, 10, 50. Đo thời gian 200 đơn ngã ngũ. Từ mức nào không nhanh hơn nữa? Nối với kích thước pool DB.

5. **Nâng cao — Kafka.** Chạy Kafka bằng Docker (image `apache/kafka`), dùng thư viện `kafkajs`. Publish 100 sự kiện với key = `donHangId`. Tạo consumer group đọc từ đầu, rồi đổi group id và đọc **lại** từ đầu. RabbitMQ làm được điều này không?

---

## 8. Checklist kết thúc buổi

- [ ] BullMQ và RabbitMQ khác nhau ở mô hình nào?
- [ ] Exchange, queue, binding — ai khai báo cái nào?
- [ ] Vì sao đặt tên hàng đợi theo **người nhận**?
- [ ] Ba điều kiện để message không mất khi broker khởi động lại
- [ ] Vì sao ack **sau cùng**? Cái giá phải trả là gì?
- [ ] Prefetch liên quan gì tới pool DB?
- [ ] Vì sao không `nack(requeue)` khi lỗi? Retry có độ trễ ghép từ gì?
- [ ] Lỗi tạm thời vs vĩnh viễn — mỗi loại đi đâu?
- [ ] Hai tình huống nên chọn Kafka thay RabbitMQ

---

**Buổi trước:** [Buổi 51 — Thanh toán & Webhook](./buoi-51-thanh-toan-webhook.md)
**Buổi tiếp theo:** [Buổi 53 — Microservices: Outbox & Saga](./buoi-53-microservices-outbox-saga.md)
