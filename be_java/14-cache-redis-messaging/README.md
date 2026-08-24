# Module 14 — Cache (Redis) & Messaging (Kafka/RabbitMQ)

> Mục tiêu: giảm tải database bằng cache, và tách rời các phần hệ thống bằng hàng đợi tin nhắn.
> Thời lượng: 1 tuần.

---

## Phần 1 — Cache

### 1.1 Khi nào nên cache?

Cache đúng chỗ giảm 90% tải DB. Cache sai chỗ tạo ra bug "dữ liệu cũ" cực khó tìm.

Nên cache khi dữ liệu: **đọc nhiều, ghi ít, chấp nhận cũ vài giây/phút**.
Ví dụ: danh mục sản phẩm, cấu hình hệ thống, hồ sơ người dùng, kết quả tính toán nặng.

**Không** cache: số dư tài khoản, tồn kho lúc thanh toán, dữ liệu phải chính xác tuyệt đối tại thời điểm đọc.

> Câu nói kinh điển: *"Chỉ có hai vấn đề khó trong khoa học máy tính: vô hiệu hóa cache và đặt tên biến."*

### 1.2 Các tầng cache
```
Trình duyệt → CDN → Cache ứng dụng (Caffeine) → Cache phân tán (Redis) → Database
     nhanh nhất ────────────────────────────────────────────────► chậm nhất
```
- **Caffeine** (trong bộ nhớ JVM): nhanh nhất, nhưng mỗi instance một bản riêng → không nhất quán khi chạy nhiều instance.
- **Redis** (ngoài tiến trình): chậm hơn chút (~1ms) nhưng **dùng chung cho mọi instance** → đây là lựa chọn mặc định cho backend nhiều instance.

### 1.3 Redis

```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
docker exec -it redis redis-cli
```
```
SET user:1 "An"          GET user:1
SETEX session:abc 900 "..."      # tự hết hạn sau 900 giây
DEL user:1               EXISTS user:1        TTL user:1
INCR counter:views       HSET user:1 name An age 25
LPUSH queue:mail "..."   RPOP queue:mail
KEYS *                   # ⚠ KHÔNG dùng ở production (khóa server), dùng SCAN
```

Redis dùng để làm gì trong backend Java:
1. **Cache** kết quả truy vấn.
2. **Session/refresh token** dùng chung giữa các instance.
3. **Rate limiting** (đếm request theo IP).
4. **Distributed lock** — nhớ Module 06: khóa Java vô dụng khi chạy nhiều instance.
5. Hàng đợi đơn giản, bảng xếp hạng, đếm lượt xem.

### 1.4 Cache trong Spring Boot

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

```java
@EnableCaching
@Configuration
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))                 // LUÔN đặt TTL
                .disableCachingNullValues()
                .serializeValuesWith(SerializationPair.fromSerializer(
                        new GenericJackson2JsonRedisSerializer()));

        return RedisCacheManager.builder(factory)
                .cacheDefaults(config)
                .withCacheConfiguration("posts", config.entryTtl(Duration.ofMinutes(5)))
                .build();
    }
}
```

```java
@Service
@RequiredArgsConstructor
public class PostService {

    @Cacheable(value = "posts", key = "#slug")             // có trong cache thì không gọi method
    public PostResponse getBySlug(String slug) { ... }

    @CacheEvict(value = "posts", key = "#id")              // xóa 1 khóa khi cập nhật
    public PostResponse update(Long id, ...) { ... }

    @CacheEvict(value = "posts", allEntries = true)        // xóa toàn bộ cache
    public void deleteAll() { ... }

    @CachePut(value = "posts", key = "#result.slug")       // luôn chạy method VÀ cập nhật cache
    public PostResponse republish(Long id) { ... }
}
```

> ⚠ **Bẫy proxy lặp lại** (Module 10): gọi method có `@Cacheable` từ chính class đó thì cache **không hoạt động**.

> ⚠ **Đừng cache entity JPA** — nó có proxy lazy, serialize sẽ lỗi hoặc kéo cả cây dữ liệu. **Chỉ cache DTO.**

### 1.5 Các chiến lược cache

| Chiến lược | Cách làm | Dùng khi |
|---|---|---|
| **Cache-aside** (phổ biến nhất) | đọc cache → miss thì đọc DB → ghi lại cache | mặc định |
| Write-through | ghi DB và cache cùng lúc | cần đọc ngay sau ghi |
| Write-behind | ghi cache trước, DB sau | ghi rất nhiều, chấp nhận rủi ro |

Ba vấn đề kinh điển phải biết:

- **Cache penetration**: liên tục hỏi khóa không tồn tại → mọi request đều xuống DB.
  *Cách chặn*: cache cả giá trị rỗng (TTL ngắn), hoặc Bloom filter.
- **Cache avalanche**: nhiều khóa hết hạn cùng lúc → DB bị dội.
  *Cách chặn*: TTL cộng thêm một khoảng ngẫu nhiên.
- **Cache stampede**: một khóa nóng hết hạn, hàng nghìn request cùng tính lại.
  *Cách chặn*: khóa phân tán, hoặc làm mới cache trước khi hết hạn.

### 1.6 Distributed lock bằng Redis

```java
// SET key value NX EX 30 — chỉ đặt được nếu khóa chưa tồn tại
Boolean acquired = redisTemplate.opsForValue()
        .setIfAbsent("lock:order:" + orderId, requestId, Duration.ofSeconds(30));

if (Boolean.TRUE.equals(acquired)) {
    try {
        // phần việc chỉ 1 instance được làm
    } finally {
        // Chỉ xóa khóa nếu ĐÚNG là khóa của mình (dùng Lua script để nguyên tử)
        releaseLock("lock:order:" + orderId, requestId);
    }
}
```
Trong thực tế nên dùng thư viện **Redisson** thay vì tự viết — nó xử lý sẵn gia hạn khóa, tránh xóa nhầm khóa người khác.

## Phần 2 — Messaging

### 2.1 Vì sao cần hàng đợi?

```java
// ❌ Đồng bộ: API chờ hết mọi việc mới trả lời -> chậm và dễ hỏng dây chuyền
public OrderResponse createOrder(...) {
    Order order = save(...);          // 50ms
    emailService.send(...);           // 2000ms — SMTP chậm
    smsService.send(...);             // 1500ms
    analyticsService.track(...);      // 500ms
    return response;                  // tổng: 4 giây, và email lỗi thì đơn hàng cũng hỏng
}

// ✅ Bất đồng bộ: đẩy sự kiện rồi trả lời ngay
public OrderResponse createOrder(...) {
    Order order = save(...);                                    // 50ms
    eventPublisher.publish(new OrderCreatedEvent(order.getId()));  // 5ms
    return response;                                            // tổng: 55ms
}
// Các service khác tự lắng nghe và xử lý phần của mình
```

Lợi ích: **API nhanh hơn**, các thành phần **tách rời** (email lỗi không làm hỏng đơn hàng), **chịu tải đột biến** (hàng đợi làm bộ đệm), và **thử lại được**.

### 2.2 Kafka vs RabbitMQ

| | Kafka | RabbitMQ |
|---|---|---|
| Mô hình | log sự kiện, lưu lại | hàng đợi, xử lý xong là xóa |
| Thông lượng | rất cao (triệu msg/s) | cao (chục nghìn/s) |
| Đọc lại lịch sử | ✅ được | ❌ không |
| Định tuyến | đơn giản (topic/partition) | linh hoạt (exchange, routing key) |
| Dùng khi | luồng sự kiện, log, phân tích, event sourcing | tác vụ nền, RPC, định tuyến phức tạp |

Người mới: bắt đầu bằng **RabbitMQ** (dễ hiểu hơn), rồi học **Kafka** (được hỏi nhiều khi phỏng vấn).

### 2.3 Kafka với Spring Boot

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all                 # chờ mọi bản sao xác nhận -> an toàn nhất
    consumer:
      group-id: notification-service
      auto-offset-reset: earliest
      enable-auto-commit: false  # tự commit sau khi xử lý xong
```

```java
// Gửi
@Service
@RequiredArgsConstructor
public class OrderEventPublisher {
    private final KafkaTemplate<String, OrderCreatedEvent> kafkaTemplate;

    public void publish(OrderCreatedEvent event) {
        // key = orderId để mọi sự kiện của cùng một đơn vào cùng partition -> giữ đúng thứ tự
        kafkaTemplate.send("order-created", event.orderId().toString(), event);
    }
}

// Nhận
@Component
@Slf4j
public class OrderEventListener {

    @KafkaListener(topics = "order-created", groupId = "notification-service")
    public void onOrderCreated(OrderCreatedEvent event, Acknowledgment ack) {
        try {
            emailService.sendOrderConfirmation(event);
            ack.acknowledge();                       // chỉ commit khi xử lý XONG
        } catch (Exception e) {
            log.error("Xử lý sự kiện thất bại: {}", event, e);
            throw e;                                 // để cơ chế retry / DLQ xử lý
        }
    }
}
```

### 2.4 Ba nguyên tắc sống còn khi làm messaging

**1. Idempotency (xử lý lại không gây hại).**
Hệ thống tin nhắn đảm bảo "ít nhất một lần" → một tin **sẽ** có lúc được gửi 2 lần. Consumer phải chịu được điều đó:
```java
@KafkaListener(topics = "payment-completed")
public void onPaymentCompleted(PaymentEvent event) {
    if (processedEventRepository.existsByEventId(event.eventId())) {
        log.info("Sự kiện {} đã xử lý rồi, bỏ qua", event.eventId());
        return;
    }
    processPayment(event);
    processedEventRepository.save(new ProcessedEvent(event.eventId()));
}
```
Nếu không có bước này, khách hàng bị trừ tiền hai lần.

**2. Dead Letter Queue (DLQ).**
Tin xử lý lỗi mãi không được đưa vào hàng đợi riêng để người ta xem xét, thay vì chặn cả hàng đợi:
```java
@RetryableTopic(attempts = "3", backoff = @Backoff(delay = 1000, multiplier = 2.0),
                dltTopicSuffix = "-dlt")
@KafkaListener(topics = "order-created")
public void handle(OrderCreatedEvent event) { ... }
```

**3. Outbox pattern — vấn đề khó nhất.**
```java
@Transactional
public void createOrder(...) {
    orderRepository.save(order);        // ghi DB
    kafkaTemplate.send("order-created", event);   // ❌ gửi Kafka KHÔNG nằm trong transaction DB
}
```
Nếu DB commit xong mà Kafka lỗi (hoặc ngược lại) → dữ liệu và sự kiện lệch nhau. Giải pháp **outbox**:
1. Trong cùng transaction, ghi đơn hàng **và** một bản ghi vào bảng `outbox`.
2. Một tiến trình riêng đọc bảng `outbox` và đẩy lên Kafka, đánh dấu đã gửi.

Nhờ vậy hai thao tác nằm trong **một** transaction DB duy nhất.

### 2.5 Spring Events — bất đồng bộ trong cùng một ứng dụng

Chưa cần Kafka nếu chỉ muốn tách rời trong nội bộ một ứng dụng:
```java
// Phát
applicationEventPublisher.publishEvent(new PostPublishedEvent(post.getId()));

// Nhận — chạy SAU KHI transaction commit thành công
@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
@Async
public void onPostPublished(PostPublishedEvent event) {
    notificationService.notifyFollowers(event.postId());
}
```
`AFTER_COMMIT` rất quan trọng: đừng gửi email báo "đã tạo đơn" khi transaction còn có thể rollback.

### 2.6 Công việc theo lịch

```java
@Scheduled(cron = "0 0 2 * * *")            // 2 giờ sáng mỗi ngày
public void donRefreshTokenHetHan() {
    int deleted = refreshTokenRepository.deleteExpired(Instant.now());
    log.info("Đã xóa {} refresh token hết hạn", deleted);
}

@Scheduled(fixedDelay = 60_000)              // 60 giây sau khi lần trước KẾT THÚC
public void guiOutbox() { ... }
```
> Chạy nhiều instance thì job sẽ chạy nhiều lần. Cần khóa phân tán (ShedLock) hoặc chỉ định một instance làm scheduler.

---

## Tổng kết
- Cache dữ liệu đọc nhiều/ghi ít; **luôn đặt TTL**; chỉ cache DTO.
- Redis: cache, session, rate limit, distributed lock.
- Biết 3 vấn đề: penetration, avalanche, stampede.
- Messaging để tách rời và tăng tốc API; Kafka cho luồng sự kiện, RabbitMQ cho tác vụ nền.
- **Idempotency + DLQ + Outbox** là ba thứ bắt buộc trong hệ thống thật.
- Trong một ứng dụng: `@TransactionalEventListener(AFTER_COMMIT)` + `@Async`.

## Bài tập
👉 [bai-tap.md](bai-tap.md), sau đó sang [Module 15 — Docker, Microservices & CI/CD](../15-docker-microservices-cicd/).
