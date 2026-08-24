# Sự kiện Kafka

## Quy ước

**Tên topic**: `<danh-từ-số-nhiều>.<động-từ-quá-khứ>` — `orders.created`, `orders.cancelled`, `payments.completed`.

**Message key**: dùng id của thực thể (`orderId`). Cùng key → cùng partition → **đảm bảo đúng thứ tự** cho thực thể đó. Không đặt key thì Kafka chia đều và bạn mất thứ tự.

**Mọi sự kiện bắt buộc có**:
```json
{
  "eventId": "b3d4e5f6-...",        // UUID — dùng để chống xử lý trùng
  "eventType": "orders.created",
  "occurredAt": "2026-08-25T10:15:30Z",
  "traceId": "8f14e45f",            // lần vết xuyên service
  "payload": { }
}
```

---

## orders.created

Phát khi đơn hàng chuyển sang `CONFIRMED`.

```json
{
  "eventId": "b3d4e5f6-1234-4abc-9def-0123456789ab",
  "eventType": "orders.created",
  "occurredAt": "2026-08-25T10:15:30Z",
  "traceId": "8f14e45f",
  "payload": {
    "orderId": 1001,
    "userId": 42,
    "userEmail": "a@shop.com",
    "totalAmount": 44000000,
    "items": [
      { "productId": 1, "productName": "Laptop Dell", "quantity": 2, "unitPrice": 22000000 }
    ]
  }
}
```

Consumer:
| Service | Việc làm |
|---|---|
| notification-service | gửi email xác nhận đơn hàng |
| (mở rộng) analytics | ghi nhận doanh thu |

> Vì sao payload có sẵn `userEmail` và `productName` thay vì chỉ có id?
> Để consumer **không phải gọi ngược** sang service khác. Sự kiện nên mang đủ dữ liệu cần thiết
> tại thời điểm xảy ra ("event-carried state transfer"). Đánh đổi: payload to hơn, và dữ liệu là
> ảnh chụp tại thời điểm đó (tên sản phẩm sau này đổi thì email cũ vẫn ghi tên cũ — thường là ĐÚNG
> về mặt nghiệp vụ).

---

## orders.cancelled

```json
{
  "eventId": "...",
  "eventType": "orders.cancelled",
  "occurredAt": "2026-08-25T11:00:00Z",
  "traceId": "...",
  "payload": {
    "orderId": 1001,
    "userId": 42,
    "userEmail": "a@shop.com",
    "reason": "CUSTOMER_REQUEST",
    "items": [ { "productId": 1, "quantity": 2 } ]
  }
}
```

---

## Dead Letter Topic

Mỗi topic có một DLT tương ứng: `orders.created.dlt`.

Cấu hình Spring Kafka:
```java
@Bean
public DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    var recoverer = new DeadLetterPublishingRecoverer(template,
            (record, ex) -> new TopicPartition(record.topic() + ".dlt", record.partition()));
    // Thử lại 3 lần, mỗi lần cách nhau tăng dần 1s → 2s → 4s
    var backOff = new ExponentialBackOffWithMaxRetries(3);
    backOff.setInitialInterval(1000L);
    backOff.setMultiplier(2.0);
    return new DefaultErrorHandler(recoverer, backOff);
}
```
Đừng để consumer thử lại vô hạn: một tin nhắn hỏng sẽ **chặn toàn bộ partition** và mọi tin sau nó không bao giờ được xử lý.

---

## Idempotency — bắt buộc cho mọi consumer

Kafka đảm bảo **at-least-once**: tin nhắn có thể tới hai lần (khi consumer chết trước lúc commit offset, khi rebalance, khi retry). Consumer phải chịu được:

```java
@Entity
@Table(name = "processed_events")
public class ProcessedEvent {
    @Id
    private String eventId;                  // khóa chính = eventId
    private String eventType;
    private Instant processedAt;
}

@KafkaListener(topics = "orders.created", groupId = "notification-service")
@Transactional
public void onOrderCreated(OrderCreatedEvent event) {
    if (processedEventRepository.existsById(event.eventId())) {
        log.debug("Bỏ qua sự kiện đã xử lý: {}", event.eventId());
        return;
    }

    emailService.send(event.payload().userEmail(), "Đơn hàng đã được xác nhận");

    processedEventRepository.save(new ProcessedEvent(event.eventId(), event.eventType(), Instant.now()));
}
```

Lưu ý: việc gửi email và việc ghi `processed_events` **không** nằm trong cùng một transaction thật sự (email là hệ thống ngoài). Vẫn có khe hở: gửi email xong rồi chết trước khi ghi DB → email gửi 2 lần. Với email thì chấp nhận được; với **trừ tiền** thì không — khi đó phải dùng khóa idempotency phía cổng thanh toán.

Nhớ có job dọn bảng `processed_events` (giữ 30 ngày là đủ), nếu không nó phình vô hạn.

---

## Outbox pattern — không mất sự kiện

Vấn đề hai nguồn ghi:
```java
// ❌ Lưu DB xong nhưng gửi Kafka lỗi -> đơn hàng có, sự kiện không có
@Transactional
public Order create(...) {
    Order order = orderRepository.save(order);
    kafkaTemplate.send("orders.created", event);     // lỗi ở đây thì sao?
    return order;
}
```

Giải pháp: ghi sự kiện vào bảng `outbox` **trong cùng transaction** với dữ liệu nghiệp vụ.

```sql
CREATE TABLE outbox_events (
    id             BIGSERIAL PRIMARY KEY,
    event_id       UUID        NOT NULL UNIQUE,
    aggregate_type VARCHAR(50) NOT NULL,      -- 'Order'
    aggregate_id   VARCHAR(50) NOT NULL,      -- '1001'
    event_type     VARCHAR(80) NOT NULL,      -- 'orders.created'
    payload        JSONB       NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at   TIMESTAMPTZ                -- NULL = chưa gửi
);
CREATE INDEX idx_outbox_unpublished ON outbox_events(created_at) WHERE published_at IS NULL;
```

```java
@Transactional
public OrderResponse create(...) {
    Order order = orderRepository.save(order);
    outboxRepository.save(OutboxEvent.of("Order", order.getId(), "orders.created", payload));
    return OrderResponse.from(order);      // hai bảng cùng một transaction -> không bao giờ lệch
}

@Scheduled(fixedDelay = 2000)
@SchedulerLock(name = "publishOutbox")     // ShedLock: nhiều instance chỉ 1 cái chạy
public void publishOutbox() {
    for (OutboxEvent e : outboxRepository.findTop100ByPublishedAtIsNullOrderByCreatedAt()) {
        kafkaTemplate.send(e.getEventType(), e.getAggregateId(), e.getPayload());
        e.markPublished();
    }
}
```

Kiểm chứng: dừng container Kafka, tạo vài đơn hàng, bật Kafka lại — **không sự kiện nào bị mất**. Đây là bài tập G4 của Module 14.
