# product-service — service MẪU

> Đây là service **duy nhất** của Dự án 3 có sẵn mã nguồn. Nó là **mẫu tham chiếu**: đọc kỹ, chạy thử, rồi tự viết
> `auth-service`, `order-service`, `notification-service`, `api-gateway` theo cùng cấu trúc và tiêu chuẩn.
> Đừng copy nguyên xi rồi đổi tên — phần lớn giá trị của dự án nằm ở việc tự viết các service còn lại.

## Chạy

```bash
# Cách 1 — trong Docker cùng hạ tầng (từ thư mục p3-shop-microservices)
cp .env.example .env
docker compose up -d --build postgres redis product-service
curl localhost:8082/api/v1/products

# Cách 2 — chạy bằng Maven/IntelliJ, hạ tầng trong Docker
docker compose up -d postgres redis
cd product-service && mvn spring-boot:run

# Test (cần Docker Desktop đang chạy)
mvn verify            # 17 integration test trên PostgreSQL + Redis thật (Testcontainers)
```

Đã kiểm chứng: `mvn verify` xanh, image Docker build và chạy được, health `UP`, log JSON có `traceId`.

## Thử nhanh luồng saga từ phía product-service

```bash
# Giữ kho cho đơn 1001
curl -X POST localhost:8082/internal/products/reserve -H 'Content-Type: application/json' \
     -d '{"orderId":1001,"items":[{"productId":1,"quantity":2},{"productId":5,"quantity":1}]}'

# Gọi lại y hệt (giả lập order-service retry vì timeout) -> CÙNG kết quả, tồn kho KHÔNG giảm thêm
curl localhost:8082/api/v1/products/1          # stock: 10 (ban đầu 12)

# Không đủ hàng -> 409 INSUFFICIENT_STOCK kèm details
curl -X POST localhost:8082/internal/products/reserve -H 'Content-Type: application/json' \
     -d '{"orderId":1002,"items":[{"productId":9,"quantity":2}]}'

# Hoàn kho (hành động bù trừ) — gọi bao nhiêu lần cũng chỉ hoàn một lần
curl -X POST localhost:8082/internal/products/release -H 'Content-Type: application/json' -d '{"orderId":1001}'

# Tạo sản phẩm cần quyền ADMIN (bình thường gateway gắn header này sau khi kiểm JWT)
curl -X POST localhost:8082/api/v1/products -H 'Content-Type: application/json' -H 'X-User-Roles: ROLE_ADMIN' \
     -d '{"sku":"NEW-01","name":"Sản phẩm mới","category":"Phụ kiện","price":99000,"stock":3}'
```

## Đọc code theo thứ tự này

| # | File | Học được gì |
|---|---|---|
| 1 | [`service/StockService.java`](src/main/java/com/learn/shop/product/service/StockService.java) | reserve/release **idempotent**; rollback cả đơn khi một sản phẩm thiếu hàng; **chống deadlock** bằng cách khóa theo thứ tự productId |
| 2 | [`repository/ProductRepository.java`](src/main/java/com/learn/shop/product/repository/ProductRepository.java) | trừ kho bằng **UPDATE nguyên tử** `WHERE stock >= :qty` |
| 3 | [`repository/StockReservationRepository.java`](src/main/java/com/learn/shop/product/repository/StockReservationRepository.java) | `SELECT ... FOR UPDATE` để release không hoàn kho hai lần |
| 4 | [`db/migration/V1__init.sql`](src/main/resources/db/migration/V1__init.sql) | `UNIQUE (order_id, product_id)` và `CHECK (stock >= 0)` — DB là lưới an toàn cuối cùng |
| 5 | [`config/CacheConfig.java`](src/main/java/com/learn/shop/product/config/CacheConfig.java) | TTL riêng từng cache, xóa cache **sau khi commit**, Redis chết thì bỏ qua cache |
| 6 | [`repository/ProductSpecifications.java`](src/main/java/com/learn/shop/product/repository/ProductSpecifications.java) | lọc động bằng Specification thay cho `(:x IS NULL OR ...)` |
| 7 | [`web/GatewayHeaders.java`](src/main/java/com/learn/shop/product/web/GatewayHeaders.java), [`web/TraceIdFilter.java`](src/main/java/com/learn/shop/product/web/TraceIdFilter.java) | service phía sau gateway nhận danh tính và traceId qua header — và điều kiện để việc đó an toàn |
| 8 | [`src/test/.../StockServiceIT.java`](src/test/java/com/learn/shop/product/StockServiceIT.java) | kiểm chứng bằng số liệu: 100 đơn tranh 10 sản phẩm, 20 retry cùng lúc, đơn {A,B} và {B,A} song song |

## Những quyết định thiết kế — và câu hỏi để bạn tự trả lời

1. **Vì sao ghi `stock_reservations` TRƯỚC khi trừ kho?** Thử đảo thứ tự rồi chạy lại `retryDongThoiCungOrderId` — điều gì thay đổi?
2. **Vì sao cache danh sách chỉ sống 1 phút còn chi tiết 10 phút?** Nếu bỏ hẳn cache danh sách thì mất gì, được gì?
3. **Vì sao `release` trả `200` kể cả khi không có gì để hoàn**, thay vì `404`?
4. **Vì sao `productName` có trong response reserve** dù `api-contracts.md` không có? Thêm như vậy có phá hợp đồng không?
5. **`GatewayHeaders.requireAdmin` tin header `X-User-Roles`.** Liệt kê mọi điều kiện hạ tầng cần có để điều này an toàn.
6. Hai request reserve **cùng orderId** tới đồng thời: request thua nhận `409 DUPLICATE_REQUEST`. order-service nên xử lý mã này thế nào?

## Việc còn lại cho bạn (mở rộng service mẫu)

- [ ] Endpoint admin `GET /api/v1/admin/reservations?status=RESERVED&olderThan=PT10M` — để job bù trừ của order-service tìm đơn "treo".
- [ ] Tự động hoàn kho các reservation `RESERVED` quá 30 phút mà order-service không xác nhận (`@Scheduled` + ShedLock nếu chạy nhiều instance).
- [ ] Unit test cho `ProductController.sanitize` bằng `@WebMvcTest` (hiện chỉ có integration test).
- [ ] Đo: bật/tắt cache, dùng `hey` hoặc `k6` bắn 200 request/giây vào `GET /api/v1/products`, so sánh p95 latency trên Grafana.
