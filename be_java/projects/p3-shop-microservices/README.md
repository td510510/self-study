# Dự án 3 — Shop Microservices

> Làm sau Module 15. Dự án cuối: hệ thống thương mại điện tử rút gọn gồm 4 service + gateway.
> Thư mục này cung cấp **kiến trúc, hợp đồng API, hạ tầng, checklist** và **một service mẫu hoàn chỉnh** ([product-service](product-service/)).
> Bốn service còn lại là phần bạn tự viết theo mẫu đó.

Đây là dự án để **học các vấn đề của hệ phân tán**, không phải để chứng minh microservices tốt hơn monolith. Trong lúc làm, hãy liên tục tự hỏi: *"Nếu để nguyên monolith thì việc này đơn giản hơn bao nhiêu?"* — trả lời được câu đó chính là thứ nhà tuyển dụng muốn nghe.

## Kiến trúc

```
                          ┌──────────────┐
        Client ──────────►│ API Gateway  │  :8080
                          │ (định tuyến, │
                          │  xác thực JWT)│
                          └──────┬───────┘
             ┌───────────────────┼───────────────────┐
             ▼                   ▼                   ▼
     ┌───────────────┐   ┌───────────────┐   ┌──────────────────┐
     │ auth-service  │   │product-service│   │  order-service   │
     │    :8081      │   │    :8082      │   │      :8083       │
     └───────┬───────┘   └───────┬───────┘   └────────┬─────────┘
             │                   │                    │
         auth_db             product_db            order_db
                                 ▲                    │
                                 └──── HTTP (kiểm tra ┘
                                       & trừ tồn kho)
                                          │
                                          ▼ sự kiện
                                   ┌─────────────┐
                                   │    Kafka    │
                                   └──────┬──────┘
                                          ▼
                                ┌────────────────────┐
                                │notification-service│  :8084
                                └────────────────────┘
```

Hạ tầng đi kèm: PostgreSQL (mỗi service một database riêng), Redis (cache + khóa phân tán), Kafka, Prometheus + Grafana.

## Nguyên tắc thiết kế bắt buộc tuân thủ

1. **Mỗi service một database.** Không service nào được truy vấn thẳng DB của service khác. Vi phạm điều này thì hệ thống chỉ là monolith bị chia nhỏ, khó hơn mà không được lợi gì.
2. **Đồng bộ khi cần câu trả lời ngay** (order → product để kiểm tra tồn kho), **bất đồng bộ cho phần còn lại** (order → notification qua Kafka).
3. **Mọi lời gọi liên service phải có timeout + circuit breaker.** Không có = một service chậm kéo sập cả hệ thống.
4. **Consumer phải idempotent**, mọi sự kiện có `eventId`.
5. **Outbox pattern** khi vừa ghi DB vừa phát sự kiện.
6. **Xác thực tại gateway**, service phía sau nhận `X-User-Id` (và ở môi trường thật phải chặn truy cập trực tiếp bằng network policy).

## Các service

### auth-service (:8081)
Tái sử dụng gần như nguyên vẹn phần auth của Dự án 2.
```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/users/{id}          (nội bộ, cho service khác gọi)
```

### product-service (:8082)
```
GET   /api/v1/products?keyword=&category=&page=&size=
GET   /api/v1/products/{id}
POST  /api/v1/products                    (ADMIN)
PATCH /api/v1/products/{id}               (ADMIN)
POST  /api/v1/products/{id}/reserve       (nội bộ) giữ tồn kho
POST  /api/v1/products/{id}/release       (nội bộ) hoàn tồn kho
```
Điểm kỹ thuật: trừ tồn kho bằng `UPDATE ... WHERE stock >= :qty` **nguyên tử** (Module 12), cache danh sách sản phẩm bằng Redis (Module 14).

### order-service (:8083)
```
POST /api/v1/orders                { items: [{productId, qty}] }
GET  /api/v1/orders                đơn của tôi
GET  /api/v1/orders/{id}
POST /api/v1/orders/{id}/cancel
```
Điểm kỹ thuật: **Saga** cho luồng đặt hàng, **outbox** để phát sự kiện, circuit breaker khi gọi product-service.

### notification-service (:8084)
Không có API công khai. Lắng nghe Kafka:
```
orders.created    → gửi email xác nhận (giả lập, ghi log + lưu DB)
orders.cancelled  → gửi email hủy đơn
```
Điểm kỹ thuật: idempotency bằng bảng `processed_events`, có Dead Letter Topic.

### api-gateway (:8080)
Spring Cloud Gateway: định tuyến, xác thực JWT, rate limit bằng Redis, gắn `X-Trace-Id`.

## Luồng đặt hàng (Saga) — phần đáng học nhất

```
1. Client  POST /api/v1/orders
2. Gateway xác thực JWT, chuyển tiếp kèm X-User-Id
3. order-service tạo đơn trạng thái PENDING
4. order-service gọi product-service: reserve tồn kho
      ├─ thành công → đơn chuyển CONFIRMED
      └─ thất bại   → đơn chuyển REJECTED, trả lỗi cho client
5. order-service ghi sự kiện vào bảng outbox (CÙNG transaction với đơn hàng)
6. Job đọc outbox → publish "orders.created" lên Kafka
7. notification-service nhận sự kiện → gửi email (idempotent)

Nếu bước 5 lỗi sau khi bước 4 thành công:
   → job bù trừ gọi product-service release tồn kho (hành động bù trừ)
```

So sánh thẳng thắn: trong monolith, toàn bộ luồng này là **một transaction ACID 10 dòng code**. Ở đây nó thành 7 bước, cần outbox, cần bù trừ, cần idempotency. Đó chính là cái giá của microservices.

## Chạy hệ thống

> ⚠ **Đọc trước**: chỉ `product-service` có sẵn mã nguồn (service mẫu, đã kiểm chứng chạy được).
> 4 thư mục còn lại chỉ có `Dockerfile` + đặc tả — đó là bài tập của bạn (xem "Ghi chú về mã nguồn" ở cuối).
> Vì vậy `docker compose up` **toàn bộ** chưa chạy được cho tới khi bạn viết xong các service kia;
> trong lúc đó hãy chạy từng phần như Bước 1.

**Bước 1 — chạy riêng hạ tầng** (làm được ngay từ hôm nay):
```bash
cd projects/p3-shop-microservices
cp .env.example .env
docker compose up -d postgres redis kafka prometheus grafana
docker compose ps                  # kiểm tra 5 container đều healthy

# Service mẫu chạy được ngay
docker compose up -d --build product-service
curl localhost:8082/api/v1/products
```

**Bước 2 — sau khi đã viết service**, chạy toàn bộ:
```bash
docker compose up --build          # lần đầu mất vài phút
```

| Địa chỉ | Nội dung |
|---|---|
| http://localhost:8080 | API Gateway (điểm vào duy nhất) |
| http://localhost:8080/swagger-ui.html | tài liệu API tổng hợp |
| http://localhost:9090 | Prometheus |
| http://localhost:3000 | Grafana (admin/admin) |
| http://localhost:8080/actuator/health | trạng thái hệ thống |

Thử nhanh:
```bash
# Đăng ký + đăng nhập
curl -X POST localhost:8080/api/v1/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"a@shop.com","password":"MatKhau123","fullName":"Khách Hàng"}'

TOKEN=<accessToken>

# Xem sản phẩm
curl localhost:8080/api/v1/products

# Đặt hàng
curl -X POST localhost:8080/api/v1/orders -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":1,"quantity":2}]}'

# Xem log notification-service để thấy sự kiện đã tới
docker compose logs -f notification-service
```

## Lộ trình làm (đừng làm cùng lúc tất cả)

**Tuần 1 — dựng nền**
1. Đọc và chạy [product-service](product-service/) (service mẫu), trả lời 6 câu hỏi trong README của nó.
2. Tách `auth-service` từ Dự án 2, chạy độc lập với DB riêng — theo cấu trúc của product-service.
3. Dựng API Gateway định tuyến tới 2 service.
4. `docker compose up` chạy được cả 3.

**Tuần 2 — hệ phân tán**
5. Viết `order-service`, gọi product-service qua HTTP (có timeout).
6. Thêm circuit breaker; **tắt product-service** và kiểm chứng order-service không treo.
7. Thêm Kafka + `notification-service` + outbox + idempotency.
8. Thêm Prometheus/Grafana, log JSON có traceId, distributed tracing.
9. Viết CI GitHub Actions.

## Danh sách kiểm tra (dùng để tự chấm)

**Kiến trúc**
- [ ] Mỗi service có DB riêng, không truy cập chéo
- [ ] Gateway là điểm vào duy nhất, xác thực tập trung
- [ ] Đồng bộ/bất đồng bộ dùng đúng chỗ, giải thích được lý do

**Chịu lỗi**
- [ ] Mọi lời gọi liên service có timeout
- [ ] Circuit breaker hoạt động — tắt một service, hệ thống không sập
- [ ] Consumer idempotent (gửi lặp sự kiện không gây hậu quả)
- [ ] Có Dead Letter Topic cho tin nhắn hỏng
- [ ] Outbox đảm bảo không mất sự kiện khi Kafka chết

**Dữ liệu**
- [ ] Trừ tồn kho an toàn khi 100 request đồng thời mua sản phẩm cuối cùng
- [ ] Không N+1 ở bất kỳ endpoint nào
- [ ] Có hành động bù trừ khi saga thất bại giữa chừng

**Vận hành**
- [ ] `docker compose up` là chạy được toàn bộ
- [ ] Log JSON có traceId xuyên suốt 4 service
- [ ] Grafana hiển thị RPS, p95, tỷ lệ lỗi
- [ ] CI xanh, image được build tự động
- [ ] Graceful shutdown, health probe đúng

## Câu hỏi để tự trả lời khi làm xong

Viết câu trả lời vào `docs/reflection.md` — đây chính là nội dung bạn sẽ nói khi phỏng vấn:

1. Việc gì trong dự án này **khó hơn hẳn** so với monolith ở Dự án 2? Kể 3 việc cụ thể.
2. Nếu được làm lại, bạn có tách microservices không? Tách mấy service?
3. Chuyện gì xảy ra khi product-service chết trong lúc order-service đang gọi? Bạn xử lý thế nào?
4. Làm sao đảm bảo không bán quá số lượng tồn kho khi có 1000 người cùng mua?
5. Một sự kiện Kafka bị xử lý 2 lần thì hậu quả là gì và bạn chặn bằng cách nào?
6. Debug một request đi qua 4 service như thế nào?
7. Nếu phải sửa schema của product-service mà order-service đang phụ thuộc, quy trình an toàn là gì?

---

## Ghi chú về mã nguồn

Thư mục này cố ý chỉ cung cấp **một** service hoàn chỉnh — [product-service](product-service/) — làm mẫu tham chiếu, cùng kiến trúc, hợp đồng API, hạ tầng và checklist cho phần còn lại. Service mẫu cho bạn thấy "một service đạt chuẩn trông như thế nào": cấu trúc package, Flyway, cache Redis, idempotency, xử lý đồng thời, log JSON có traceId, health probe, test trên PostgreSQL/Redis thật. Bốn service còn lại về bản chất là Spring Boot API giống Dự án 2 nhưng nhỏ hơn; giá trị học tập nằm ở việc **bạn tự viết và tự nối chúng lại**, và tự vấp phải các vấn đề phân tán.

Tài liệu hỗ trợ trong [docs/](docs/):
- [docs/api-contracts.md](docs/api-contracts.md) — hợp đồng API giữa các service
- [docs/events.md](docs/events.md) — định nghĩa sự kiện Kafka
- [docs/saga-order-flow.md](docs/saga-order-flow.md) — chi tiết saga đặt hàng + mã bù trừ
- [docker-compose.yml](docker-compose.yml) — toàn bộ hạ tầng đã cấu hình sẵn

👉 Xong dự án này, sang [interview/](../../interview/) để chuẩn bị đi phỏng vấn.
