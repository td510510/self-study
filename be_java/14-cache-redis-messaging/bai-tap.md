# Bài tập Module 14 — Cache & Messaging

> Chuẩn bị:
> ```bash
> docker run -d --name redis -p 6379:6379 redis:7-alpine
> ```
> Kafka (dùng bản KRaft, không cần Zookeeper):
> ```bash
> docker run -d --name kafka -p 9092:9092 apache/kafka:3.8.0
> ```

## Nhóm A — Redis cơ bản

**A1.** Dùng `redis-cli` thực hành: `SET/GET/DEL/EXISTS/TTL/EXPIRE`, `INCR`, `HSET/HGETALL`, `LPUSH/RPOP`.

**A2.** Giải thích vì sao **không được** dùng `KEYS *` trên production và thay bằng gì.

**A3.** Kết nối Redis từ Spring Boot bằng `RedisTemplate`, lưu và đọc một object DTO dạng JSON.

**A4.** Đặt TTL 60 giây cho một khóa, quan sát nó tự biến mất.

## Nhóm B — Cache trong Blog API (Dự án 2)

**B1.** Bật `@EnableCaching`, cấu hình `RedisCacheManager` với TTL mặc định 10 phút và serializer JSON.

**B2.** Cache `getBySlug` bằng `@Cacheable`. Bật `show-sql`, gọi API 2 lần và chứng minh lần 2 **không** sinh câu SQL nào.

**B3.** Thêm `@CacheEvict` khi cập nhật/xóa bài viết. Chứng minh sau khi sửa, API trả về dữ liệu mới chứ không phải dữ liệu cũ.

**B4.** Đo thời gian phản hồi có cache và không cache (dùng `curl -w "%{time_total}"` hoặc Postman).

**B5.** Thử cache thẳng entity `Post` (không phải DTO) và ghi lại lỗi gặp phải. Giải thích vì sao chỉ nên cache DTO.

**B6.** Tái hiện bẫy proxy: gọi method có `@Cacheable` từ một method khác **trong cùng class**, chứng minh cache không hoạt động, rồi sửa.

**B7.** Cache penetration: gọi liên tục `/posts/khong-ton-tai`, quan sát mọi request đều xuống DB. Sửa bằng cách cache giá trị rỗng với TTL ngắn.

**B8.** Cache avalanche: đặt cùng TTL cho 1000 khóa, cho hết hạn cùng lúc, quan sát DB. Sửa bằng TTL ngẫu nhiên hóa.

## Nhóm C — Redis nâng cao

**C1. Rate limiting**: giới hạn 100 request/phút/IP bằng `INCR` + `EXPIRE`. Trả `429 Too Many Requests` kèm header `Retry-After`.

**C2.** Chuyển bộ đếm đăng nhập sai (`AuthService` trong Dự án 2) từ `ConcurrentHashMap` sang Redis. Giải thích vì sao điều này bắt buộc khi chạy nhiều instance.

**C3.** Lưu refresh token trong Redis với TTL thay vì bảng DB. So sánh ưu/nhược điểm hai cách.

**C4. Distributed lock**: viết `tryLock(key, ttl)` bằng `SET NX EX`, giải phóng khóa an toàn bằng Lua script (chỉ xóa nếu đúng chủ khóa).

**C5.** Mô phỏng 100 luồng cùng trừ tồn kho sản phẩm cuối cùng, dùng distributed lock để đảm bảo chỉ 1 luồng thành công.

**C6.** Đếm lượt xem bài viết bằng Redis `INCR`, mỗi 5 phút ghi gộp xuống DB một lần (thay vì UPDATE mỗi lượt xem).

## Nhóm D — Spring Events (chưa cần Kafka)

**D1.** Khi bài viết được xuất bản, phát `PostPublishedEvent`; một listener ghi log, một listener khác "gửi email" (giả lập).

**D2.** Dùng `@TransactionalEventListener(AFTER_COMMIT)`. Chứng minh khi transaction rollback thì listener **không** chạy.

**D3.** Thêm `@Async` và cấu hình `TaskExecutor` riêng; chứng minh API trả về ngay không chờ listener.

**D4.** Gây exception trong listener và quan sát: nó có làm hỏng transaction chính không?

## Nhóm E — Kafka / RabbitMQ

**E1.** Chạy Kafka bằng Docker, tạo topic `order-created`, gửi/nhận tin bằng CLI.

**E2.** Viết producer Spring gửi `OrderCreatedEvent` (JSON) và consumer nhận, in ra log.

**E3.** Chạy **2 instance** consumer cùng `group-id`, gửi 10 tin, quan sát tin được chia đều. Sau đó đổi `group-id` khác nhau, quan sát cả 2 đều nhận đủ 10 tin. Giải thích.

**E4. Idempotency**: gửi cùng một sự kiện 3 lần, đảm bảo chỉ xử lý 1 lần (lưu `eventId` đã xử lý).

**E5. Retry + DLQ**: dùng `@RetryableTopic`, cho consumer ném exception, quan sát 3 lần thử rồi vào topic `-dlt`.

**E6. Outbox pattern**: tạo bảng `outbox`, ghi sự kiện trong cùng transaction với dữ liệu nghiệp vụ, viết job `@Scheduled` đọc và đẩy lên Kafka.
*Đạt khi*: giết ứng dụng ngay sau khi commit DB, khởi động lại vẫn gửi được sự kiện — không mất dữ liệu.

**E7.** So sánh Kafka và RabbitMQ qua một bảng do bạn tự viết, kèm 2 tình huống nên dùng mỗi loại.

## Nhóm F — Job theo lịch

**F1.** `@Scheduled(cron = ...)` dọn refresh token hết hạn lúc 2h sáng.

**F2.** Chạy 2 instance ứng dụng, chứng minh job chạy **2 lần**. Sửa bằng ShedLock (khóa qua DB hoặc Redis).

**F3.** Phân biệt `fixedRate` và `fixedDelay` bằng một job có `sleep(5s)`.

## Nhóm G — Tổng hợp (bắt buộc)

**G1. Nâng cấp Blog API:**
- Cache danh sách + chi tiết bài viết bằng Redis, có TTL và evict đúng chỗ.
- Rate limit theo IP.
- Bộ đếm đăng nhập sai chuyển sang Redis.
- Khi xuất bản bài viết: phát sự kiện, một consumer riêng "gửi email" cho người theo dõi (dùng Spring Events hoặc Kafka).
- Consumer idempotent + có DLQ.
- Job dọn dẹp chạy hằng đêm, an toàn khi nhiều instance.

*Đạt khi*: đo được thời gian phản hồi giảm rõ rệt, và khi tắt Redis thì ứng dụng vẫn chạy (cache lỗi không được làm sập API — hãy kiểm chứng điều này).

---

## Câu hỏi phỏng vấn
1. Khi nào nên và không nên cache?
2. Cache-aside hoạt động thế nào?
3. Cache penetration / avalanche / stampede là gì, chống ra sao?
4. Vì sao không cache entity JPA?
5. Redis là gì? Kể 5 tình huống dùng Redis trong backend.
6. Vì sao khóa `synchronized` của Java vô dụng khi chạy nhiều instance?
7. Kafka khác RabbitMQ thế nào?
8. Vì sao consumer phải idempotent?
9. DLQ dùng để làm gì?
10. Outbox pattern giải quyết vấn đề gì?
11. `@TransactionalEventListener(AFTER_COMMIT)` khác `@EventListener` ở đâu?
