# Saga đặt hàng — chi tiết cài đặt

> Đây là phần khó nhất và đáng học nhất của Dự án 3. Đọc kỹ trước khi code.

## Vì sao cần saga?

Trong monolith (Dự án 2), đặt hàng là **một transaction**:
```java
@Transactional
public Order placeOrder(...) {
    product.decreaseStock(qty);      // cùng DB
    Order order = orderRepository.save(order);
    return order;
}   // commit: hoặc cả hai thành công, hoặc cả hai bị hủy — database lo hết
```

Khi tách service, tồn kho nằm ở `product_db`, đơn hàng nằm ở `order_db`. **Không có transaction nào trải qua hai database.** Vì vậy phải tự dựng chuỗi bước có hành động bù trừ — đó là saga.

## Luồng đầy đủ

```
┌──────────┐                ┌───────────────┐              ┌──────────────────┐
│ Client   │                │ order-service │              │ product-service  │
└────┬─────┘                └───────┬───────┘              └────────┬─────────┘
     │ POST /orders                 │                               │
     ├─────────────────────────────►│                               │
     │                              │ 1. Lưu đơn PENDING            │
     │                              │    (order_db)                 │
     │                              │                               │
     │                              │ 2. POST /internal/products/reserve
     │                              ├──────────────────────────────►│
     │                              │                               │ UPDATE stock
     │                              │                               │ WHERE stock >= qty
     │                              │◄──────────────────────────────┤
     │                              │   200 OK / 409 hết hàng       │
     │                              │                               │
     │            ┌─────────────────┴──────────────────┐            │
     │            │ 200: đơn -> CONFIRMED              │            │
     │            │      + ghi outbox (cùng transaction)│           │
     │            │ 409: đơn -> REJECTED               │            │
     │            └─────────────────┬──────────────────┘            │
     │◄─────────────────────────────┤                               │
     │  201 Created / 409 Conflict  │                               │
                                    │ 3. Job đọc outbox -> Kafka
                                    ▼
                            orders.created ──► notification-service
```

## Các tình huống hỏng và cách xử lý

| Hỏng ở đâu | Hiện tượng | Xử lý |
|---|---|---|
| product-service không phản hồi | order-service treo chờ | **timeout 3s** + circuit breaker → đơn `REJECTED`, trả `503` |
| reserve thành công nhưng order-service chết ngay sau | tồn kho bị giữ mà không có đơn | job quét đơn `PENDING` quá 5 phút → gọi `release` (bù trừ) |
| Kafka chết | không gửi được sự kiện | **outbox** — sự kiện nằm trong DB, gửi lại khi Kafka sống |
| notification xử lý 2 lần | email gửi trùng | **idempotency** bằng `eventId` |
| khách hủy đơn | tồn kho chưa hoàn | gọi `release` + phát `orders.cancelled` |

## Code chính (order-service)

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderSagaService {

    private final OrderRepository orderRepository;
    private final OutboxRepository outboxRepository;
    private final ProductClient productClient;

    /**
     * Chú ý: transaction ở đây CHỈ bao phủ order_db.
     * Lời gọi HTTP sang product-service nằm NGOÀI transaction —
     * không bao giờ giữ transaction mở trong lúc chờ mạng (Module 12).
     */
    public OrderResponse placeOrder(Long userId, CreateOrderRequest request) {
        // Bước 1: tạo đơn PENDING (transaction ngắn)
        Order order = createPendingOrder(userId, request);

        // Bước 2: gọi product-service (ngoài transaction, có timeout + circuit breaker)
        ReserveResponse reserve;
        try {
            reserve = productClient.reserve(new ReserveRequest(order.getId(), request.items()));
        } catch (InsufficientStockException e) {
            markRejected(order.getId(), e.getMessage());
            throw e;                                  // -> 409 cho client
        } catch (ServiceUnavailableException e) {
            markRejected(order.getId(), "product-service không phản hồi");
            throw e;                                  // -> 503 cho client
        }

        // Bước 3: xác nhận đơn + ghi outbox trong CÙNG một transaction
        return confirmOrder(order.getId(), reserve);
    }

    @Transactional
    protected Order createPendingOrder(Long userId, CreateOrderRequest request) {
        Order order = new Order(userId, request.shippingAddress());
        request.items().forEach(i -> order.addItem(i.productId(), i.quantity()));
        return orderRepository.save(order);
    }

    @Transactional
    protected OrderResponse confirmOrder(Long orderId, ReserveResponse reserve) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.confirm(reserve.totalAmount(), reserve.items());

        // Cùng transaction với đơn hàng -> không bao giờ có đơn mà thiếu sự kiện
        outboxRepository.save(OutboxEvent.of("Order", orderId, "orders.created",
                OrderCreatedPayload.from(order)));

        return OrderResponse.from(order);
    }

    @Transactional
    protected void markRejected(Long orderId, String reason) {
        orderRepository.findById(orderId).ifPresent(o -> o.reject(reason));
    }
}
```

> ⚠ `protected` + gọi nội bộ = **bẫy proxy** (Module 10): `@Transactional` sẽ không có tác dụng!
> Trong code thật, hãy tách 3 method transaction sang một class riêng (ví dụ `OrderTransactionService`)
> và tiêm vào `OrderSagaService`. Đây là lỗi rất hay gặp — hãy tự kiểm chứng bằng cách bật log transaction.

## Client gọi product-service — bắt buộc có timeout + circuit breaker

```java
@Component
@RequiredArgsConstructor
public class ProductClient {

    private final RestClient restClient;     // đã cấu hình baseUrl + timeout 3s

    @CircuitBreaker(name = "productService", fallbackMethod = "reserveFallback")
    @Retry(name = "productService")          // chỉ retry lỗi mạng, KHÔNG retry lỗi 409
    public ReserveResponse reserve(ReserveRequest request) {
        return restClient.post()
                .uri("/internal/products/reserve")
                .body(request)
                .retrieve()
                .onStatus(status -> status.value() == 409, (req, res) -> {
                    throw new InsufficientStockException(readMessage(res));
                })
                .body(ReserveResponse.class);
    }

    private ReserveResponse reserveFallback(ReserveRequest request, Throwable t) {
        if (t instanceof InsufficientStockException e) throw e;   // lỗi nghiệp vụ: ném tiếp
        throw new ServiceUnavailableException("product-service tạm thời không khả dụng");
    }
}
```
```yaml
resilience4j:
  circuitbreaker:
    instances:
      productService:
        slidingWindowSize: 20
        failureRateThreshold: 50          # >50% lỗi thì mở mạch
        waitDurationInOpenState: 10s
        permittedNumberOfCallsInHalfOpenState: 3
  retry:
    instances:
      productService:
        maxAttempts: 3
        waitDuration: 500ms
        retryExceptions:
          - java.io.IOException
          - java.net.SocketTimeoutException
```

**Điểm cực kỳ quan trọng**: chỉ retry lỗi **hạ tầng** (timeout, mất mạng). Retry lỗi nghiệp vụ (409 hết hàng) là vô nghĩa và có hại. Và vì `reserve` là idempotent theo `orderId` nên retry an toàn — nếu không idempotent, retry sẽ trừ tồn kho nhiều lần.

## Job bù trừ — dọn đơn treo

```java
@Scheduled(fixedDelay = 60_000)
@SchedulerLock(name = "compensateStuckOrders")
@Transactional
public void compensateStuckOrders() {
    Instant threshold = Instant.now().minus(5, ChronoUnit.MINUTES);

    for (Order order : orderRepository.findByStatusAndCreatedAtBefore(OrderStatus.PENDING, threshold)) {
        log.warn("Đơn {} treo ở PENDING quá 5 phút, thực hiện bù trừ", order.getId());
        try {
            productClient.release(order.getId());     // idempotent -> gọi lại vô hại
            order.reject("Hết thời gian xử lý");
        } catch (Exception e) {
            log.error("Bù trừ thất bại cho đơn {}, sẽ thử lại lần sau", order.getId(), e);
        }
    }
}
```

## Kiểm thử saga (bài tập bắt buộc)

1. **Đường thành công**: đặt hàng → đơn `CONFIRMED`, tồn kho giảm đúng, `notification-service` nhận sự kiện.
2. **Hết hàng**: đặt số lượng lớn hơn tồn kho → `409`, đơn `REJECTED`, **tồn kho không đổi**.
3. **product-service chết**: `docker compose stop product-service` → đặt hàng trả `503` sau ≤ 3 giây (không treo), circuit breaker chuyển sang OPEN.
4. **Kafka chết**: `docker compose stop kafka` → đặt hàng vẫn thành công, sự kiện nằm trong outbox; bật Kafka lại → sự kiện được gửi.
5. **Tranh chấp tồn kho**: 100 request đồng thời mua sản phẩm còn đúng 10 cái → **chính xác 10 đơn** thành công, tồn kho về 0, không âm.
6. **Sự kiện trùng**: gửi lại thủ công một sự kiện `orders.created` → email chỉ gửi một lần.

Bài số 5 là bài quan trọng nhất. Nếu kết quả không đúng 10, hãy xem lại: bạn có đang đọc-kiểm tra-ghi trong Java thay vì UPDATE nguyên tử ở DB không?
