# Buổi 45 — System Design nhập môn

> **Phase 5** · Production-ready
> **Mục tiêu:** Đọc và tự vẽ được thiết kế hệ thống ở mức junior/mid — biết khi nào một kỹ thuật **đáng dùng**, khi nào là **over-engineering**.

---

## Dòng thời gian 180 phút

| Thời gian | Nội dung |
|---|---|
| 0–15′ | Chữa bài tập buổi 44 |
| 15–60′ | **Vẽ kiến trúc hệ thống của chính mình** |
| 60–110′ | Khi nào cần cache / queue / read replica — và khi nào KHÔNG |
| 110–150′ | Đánh đổi cơ bản: nhất quán, đồng bộ, ghép nối |
| 150–175′ | **Microservices: khi nào, và vì sao thường là quá sớm** |
| 175–180′ | Bài tập |

---

## 1. Vẽ kiến trúc của chính mình (15–60′)

> **📝 Ghi chú giảng viên**
> Đừng bắt đầu bằng sơ đồ của Netflix. Bắt đầu bằng **hệ thống học viên vừa tự xây** — họ hiểu từng mảnh, nên phân tích được thật sự.

Vẽ Project 2 lên bảng, **cùng cả lớp**:

```
                    ┌─────────┐
   Người dùng ──────│  Nginx  │  TLS, rate limit, gzip
                    └────┬────┘
                         ▼
                  ┌─────────────┐
                  │  API (Node) │  Express + Prisma
                  └──┬───┬───┬──┘
            ┌────────┘   │   └────────┐
            ▼            ▼            ▼
      ┌──────────┐  ┌────────┐  ┌─────────┐
      │ Postgres │  │ Redis  │  │ Worker  │
      │  (ghi+   │  │(cache+ │  │(BullMQ) │
      │   đọc)   │  │ rate)  │  └────┬────┘
      └──────────┘  └────────┘       │
            ▲                        │
            └────────────────────────┘
```

Rồi hỏi: **"Traffic tăng 100 lần. Cái gì gãy TRƯỚC?"**

Để lớp tranh luận. Dùng số liệu đã đo:

| Thành phần | Bằng chứng | Gãy khi nào |
|---|---|---|
| **Postgres** | pool 100 kết nối (buổi 20) | sớm nhất — nút thắt số 1 |
| API (Node) | 3305 RPS/tiến trình (buổi 44) | thêm bản sao là giải quyết được |
| Redis | rất nhanh | muộn |
| Worker | scale độc lập (buổi 26) | muộn |

> **Kết luận: database gần như luôn là nút thắt đầu tiên.** Và đó là thứ **khó** scale nhất — vì nó có **trạng thái**.

### Nguyên tắc nền: tách stateless khỏi stateful

| Stateless (dễ scale) | Stateful (khó scale) |
|---|---|
| API server | database |
| Worker | Redis (nếu dùng làm nguồn sự thật) |
| Nginx | file lưu trên đĩa cục bộ (buổi 17) |

> Mọi kỹ thuật scale đều xoay quanh việc **đẩy trạng thái ra khỏi** phần cần nhân bản.
>
> Nối lại: rate limit dùng `Map` (buổi 11) → Redis (buổi 21); file trên đĩa (buổi 17) → S3; WebSocket trong RAM (buổi 25) → Redis adapter. **Ba lần cùng một bài học.**

---

## 2. Khi nào cần gì — và khi nào KHÔNG (60–110′)

> **📝 Ghi chú giảng viên — phần chống over-engineering**
>
> Người mới học xong Phase 3 hay muốn dùng **tất cả** những gì vừa học. Buổi này dạy cách **không** dùng.

| Kỹ thuật | Dùng khi | ĐỪNG dùng khi | Cái giá |
|---|---|---|---|
| **Cache** | đọc nhiều hơn ghi rất nhiều; chấp nhận dữ liệu cũ | dữ liệu phải chính xác tuyệt đối (tồn kho, số dư) | dữ liệu cũ, thêm một chỗ để sai |
| **Queue** | việc chậm, không cần trả lời ngay | người dùng cần kết quả ngay | phức tạp hơn, phải lo idempotency |
| **Read replica** | đọc áp đảo ghi, chấp nhận trễ vài trăm ms | vừa ghi xong phải đọc thấy ngay | trễ đồng bộ, thêm chi phí |
| **CDN** | file tĩnh, ảnh | dữ liệu cá nhân hoá | cache invalidation |
| **Sharding** | một máy chủ database **thật sự** không đủ | gần như mọi dự án vừa và nhỏ | rất phức tạp, join xuyên shard rất khó |
| **Microservices** | nhiều team, ranh giới nghiệp vụ rõ | team < 20 người | mạng, triển khai, gỡ lỗi đều khó hơn |

### Ba câu hỏi trước khi thêm bất kỳ thành phần nào

```
1. Vấn đề CỤ THỂ nào tôi đang giải? (có SỐ ĐO không?)
2. Cách ĐƠN GIẢN NHẤT là gì? Đã thử chưa?
3. Thành phần này thêm những gì phải VẬN HÀNH và có thể HỎNG?
```

> Ví dụ thật: *"API chậm"* → thêm Redis?
>
> **Đo trước** (buổi 44). Có thể nguyên nhân là **thiếu index** (buổi 19) — sửa một dòng, nhanh gấp 300 lần, **không thêm** thành phần nào.

---

## 3. Ba đánh đổi cơ bản (110–150′)

### 3.1. Nhất quán mạnh vs nhất quán cuối cùng

| | Nhất quán mạnh | Nhất quán cuối cùng |
|---|---|---|
| Ghi xong đọc thấy ngay | ✅ | ❌ trễ chút |
| Ví dụ trong khoá học | tồn kho (buổi 19) | cache sản phẩm (buổi 21) |
| Cái giá | chậm hơn, khó scale | phải chấp nhận dữ liệu cũ |

> **Đây là quyết định NGHIỆP VỤ.**
>
> Câu hỏi đúng: *"Nếu hai người thấy dữ liệu khác nhau trong 30 giây, hậu quả là gì?"*
> - Số lượt xem bài viết lệch → không sao
> - Số dư tài khoản lệch → **thảm hoạ**

### 3.2. Đồng bộ vs bất đồng bộ

| Đồng bộ | Bất đồng bộ |
|---|---|
| Người dùng biết kết quả ngay | biết sau |
| Lỗi hiện ra ngay | lỗi phải tự phát hiện (buổi 26) |
| Giữ tài nguyên trong lúc chờ (buổi 20) | giải phóng ngay |

> Nối lại buổi 26: đặt hàng **đồng bộ** (khách phải biết ngay), gửi email **bất đồng bộ** (không ai cần biết ngay).

### 3.3. Ghép nối chặt vs lỏng

> Ghép lỏng (qua queue, qua sự kiện) cho phép các phần tiến hoá độc lập — nhưng làm **gỡ lỗi khó hơn nhiều**: không còn stack trace xuyên suốt, phải ghép log từ nhiều nơi.
>
> Đây là lý do `requestId` (buổi 43) trở thành **bắt buộc** khi hệ thống ghép lỏng.

---

## 4. Microservices: thường là quá sớm (150–175′)

Hỏi lớp: *"Vì sao các công ty lớn dùng microservices?"*

Câu trả lời thường gặp: *"để scale"*. **Không chính xác.**

> **Microservices giải quyết vấn đề TỔ CHỨC, không phải vấn đề kỹ thuật.**
>
> Khi 200 kỹ sư cùng sửa một codebase, họ chặn nhau: xung đột merge, deploy phải chờ nhau, một người làm hỏng thì cả công ty dừng. Microservices cho mỗi team **quyền tự chủ**.
>
> Với 5 người, "vấn đề" đó **không tồn tại** — nhưng cái giá thì có đủ.

### Cái giá cụ thể

| Với monolith | Với microservices |
|---|---|
| Gọi hàm — nano giây, không bao giờ lỗi | gọi mạng — mili giây, **có thể lỗi** |
| Transaction database | phải làm saga, bù trừ thủ công |
| Stack trace một chỗ | ghép log từ 5 service |
| Deploy một lần | phối hợp nhiều phiên bản |
| Chạy local: một lệnh | dựng 8 service mới chạy được |

> **📝 Ghi chú giảng viên**
> Chỉ vào bài học buổi 19: transaction + khoá dòng đảm bảo không bán quá hàng. Hỏi: *"Nếu tồn kho ở service A và đơn hàng ở service B, làm sao đảm bảo điều đó?"*
>
> → Không có transaction xuyên service. Phải làm **saga**: đặt chỗ tồn kho → tạo đơn → nếu lỗi thì **bù trừ** (trả lại tồn kho). Phức tạp gấp nhiều lần, và bản thân bước bù trừ cũng có thể lỗi.

### Lộ trình thực dụng

```
1. Monolith có kiến trúc tốt   ← Project 2 và 4 đang ở đây
2. Monolith module hoá rõ ranh giới
3. Tách RA phần có lý do RÕ RÀNG (ví dụ: xử lý ảnh cần nhiều CPU)
4. Microservices đầy đủ  ← chỉ khi tổ chức thật sự cần
```

> **Bắt đầu từ monolith gần như luôn đúng.** Tách ra thì dễ; gộp lại thì rất khó.

---

## 5. Bài tập về nhà

1. **Vẽ hệ thống của bạn.** Vẽ kiến trúc Project 2 hoặc Project 4, đánh dấu stateless/stateful, và chỉ ra **hai** điểm gãy đầu tiên nếu traffic tăng 100 lần. Dùng số liệu đã đo làm căn cứ.

2. **Thiết kế URL shortener.** Yêu cầu: 100 triệu link, 10.000 lượt đọc/giây, 100 lượt tạo/giây. Vẽ kiến trúc. Cần cache không? Cần sharding không? **Giải thích bằng số**.

3. **Phản biện một thiết kế.** Cho thiết kế: *"mọi request đi qua Kafka để tách rời các service"*. Nêu 3 vấn đề. Khi nào nó hợp lý?

4. **Bảng nhất quán.** Với Project 2, lập bảng: mỗi loại dữ liệu (tồn kho, giá, danh sách sản phẩm, đơn hàng, giỏ hàng) cần nhất quán mạnh hay cuối cùng? Giải thích từng cái.

5. **Chống over-engineering.** Nhớ lại một dự án bạn từng làm hoặc từng đọc. Có thành phần nào **không cần thiết**? Nếu bỏ đi thì mất gì?

6. **Nâng cao — saga.** Thiết kế luồng đặt hàng khi tồn kho và đơn hàng nằm ở hai service. Vẽ cả luồng **thành công** và luồng **bù trừ khi lỗi**. So sánh với transaction ở buổi 19.

---

## 6. Checklist kết thúc buổi

- [ ] Trong hệ thống của bạn, cái gì gãy trước khi traffic tăng 100 lần? Vì sao?
- [ ] Stateless và stateful — cái nào dễ scale? Kể 3 lần trong khoá học ta phải đẩy trạng thái ra ngoài.
- [ ] Ba câu hỏi trước khi thêm một thành phần mới?
- [ ] Khi nào **không** nên dùng cache? Cho ví dụ cụ thể.
- [ ] Nhất quán mạnh vs cuối cùng — đây là quyết định của ai?
- [ ] Microservices giải quyết vấn đề gì? Có phải vấn đề kỹ thuật không?
- [ ] Không có transaction xuyên service thì làm sao đảm bảo không bán quá hàng?
- [ ] Vì sao "bắt đầu từ monolith" gần như luôn đúng?

---

**Buổi trước:** [Buổi 44 — Performance & Load testing](./buoi-44-load-testing.md)
**Buổi tiếp theo:** Buổi 46 — Code review & API contract
