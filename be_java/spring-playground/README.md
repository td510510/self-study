# Spring Playground — code ví dụ chạy được cho Module 10–14

> Module 00–09 mỗi bài đều có `src/` chạy bằng `java File.java`. Từ Module 10 trở đi code cần
> Maven + dependency nên không chạy kiểu đó được — **đây là chỗ thay thế**: một ứng dụng Spring Boot
> duy nhất, chia package theo module, mỗi endpoint chứng minh **một** bài học bằng số liệu.

## Chạy

```bash
cd spring-playground
mvn spring-boot:run
```
Rồi mở **http://localhost:8080/** — trang chủ liệt kê toàn bộ endpoint demo.

- Không cần Docker, không cần cài database (dùng H2 in-memory).
- Chưa có Maven? `winget install Apache.Maven`, hoặc mở thư mục này bằng IntelliJ rồi bấm ▶.
- Xem dữ liệu: http://localhost:8080/h2-console (JDBC URL `jdbc:h2:mem:playground`, user `sa`, password rỗng)

```bash
mvn test          # 10 test kiểm chứng đúng các bài học bên dưới
```

> **Quan trọng: vừa gọi API vừa đọc console.** Một nửa bài học nằm ở log SQL và log của aspect,
> không nằm trong JSON trả về.

## Bản đồ: module → package → endpoint

### [Module 10 — Spring Core](../10-spring-core/) → `m10core/`

| Endpoint | Chứng minh điều gì |
|---|---|
| `GET /m10/di` | 3 kiểu tiêm phụ thuộc; `@Qualifier`; hai cách tiêm cùng trỏ về **một** bean singleton |
| `GET /m10/strategy?type=VNPAY` | Tiêm `Map<String, PaymentGateway>` — thêm cổng mới không sửa service (Open/Closed) |
| `GET /m10/singleton-bug` | 100 thread ghi vào field của `@Service` → **dữ liệu sai**. Lý do bean không được có state |
| `GET /m10/config` | `@ConfigurationProperties` + validate: cấu hình sai thì app **không khởi động** |
| `GET /m10/aop` | Aspect đo thời gian, không sửa một dòng nào trong service |
| `GET /m10/self-invocation` | **Bẫy proxy**: gọi nội bộ khiến `@Transactional`/`@Cacheable`/aspect im lặng vô hiệu |

### [Module 11 — REST API](../11-spring-boot-rest/) → `m11rest/`

| Endpoint | Chứng minh điều gì |
|---|---|
| `GET /api/v1/books?page=0&size=3` | Phân trang + `PageResponse` riêng thay vì trả `Page` của Spring |
| `POST /api/v1/books` (hợp lệ) | `201 Created` + header `Location` |
| `POST /api/v1/books` (thiếu field) | `400` + `fieldErrors` tiếng Việt |
| `POST /api/v1/books` (ISBN trùng) | `409 Conflict` |
| `GET /api/v1/books/99999` | `404` đúng định dạng `ErrorResponse` chung |
| `GET /api/v1/books/abc` | `400 TYPE_MISMATCH` — lỗi hay bị quên xử lý |
| `GET /api/v1/books/boom` | `500` nhưng **không lộ stacktrace**, chỉ trả `traceId` để tra log |

### [Module 12 — Spring Data JPA](../12-spring-data-jpa/) → `m12jpa/`

| Endpoint | Chứng minh điều gì |
|---|---|
| `GET /m12/n-plus-1/bad` | **Đếm số câu SQL** khi bị N+1 |
| `GET /m12/n-plus-1/good` | Cùng dữ liệu qua 4 cách: N+1 / JOIN FETCH / `@EntityGraph` / DTO projection |
| `GET /m12/dirty-checking` | Sửa entity trong transaction, **không gọi `save()`**, vẫn có `UPDATE` |
| `GET /m12/rollback` | Ném `RuntimeException` giữa chừng → dữ liệu quay về nguyên trạng |
| `GET /m12/atomic-stock?stock=10` | 100 luồng cùng mua: đọc-ghi trong Java **bán quá tồn kho**, `UPDATE` nguyên tử thì không |

Đây là module đáng bỏ thời gian nhất — mở console và **đếm số dòng SQL** cho từng endpoint.

### [Module 13 — Security & JWT](../13-security-jwt/) → `m13security/`

Thử theo đúng thứ tự:
```bash
curl -i localhost:8080/m13/me                       # 401 — chưa đăng nhập

curl -X POST localhost:8080/m13/login \
  -H "Content-Type: application/json" \
  -d '{"username":"an","password":"123456"}'        # lấy accessToken

TOKEN=<dán token vào đây>
curl localhost:8080/m13/me    -H "Authorization: Bearer $TOKEN"     # 200
curl -i localhost:8080/m13/admin -H "Authorization: Bearer $TOKEN"  # 403 — thiếu quyền
curl -i localhost:8080/m13/orders/2 -H "Authorization: Bearer $TOKEN"  # đơn của người khác
curl "localhost:8080/m13/decode?token=$TOKEN"       # đọc payload JWT KHÔNG cần secret
```
Tài khoản demo: `an`, `binh` (ROLE_USER) và `admin` (ROLE_ADMIN) — mật khẩu đều `123456`.

Bài học rút ra: **401 ≠ 403**, JWT payload không hề bí mật, và xác thực đúng người vẫn chưa đủ —
phải kiểm tra **quyền sở hữu từng bản ghi** (IDOR).

### [Module 14 — Cache & Events](../14-cache-redis-messaging/) → `m14cache/`

| Endpoint | Chứng minh điều gì |
|---|---|
| `GET /m14/cache/1` | Lần 1 mất ~1000ms, gọi lại còn ~0ms và `dbHits` **không tăng** |
| `GET /m14/cache/1/evict` | Xóa cache → lần đọc sau lại chậm |
| `GET /m14/cache/1/self-invocation` | Gọi nội bộ → `@Cacheable` vô hiệu (lại là bẫy proxy) |
| `GET /m14/stampede` | 20 luồng cùng đọc key vừa hết hạn → nhiều luồng cùng dựng lại cache |
| `GET /m14/event` | `@TransactionalEventListener(AFTER_COMMIT)` chặn email của đơn hàng bị rollback |

Sân tập dùng cache trong bộ nhớ để chạy được ngay. Ở hệ thống nhiều instance thì phải dùng
**Redis** — mỗi instance một bản cache riêng là nguồn gốc của bug "dữ liệu lúc mới lúc cũ".

## Sân tập này khác Dự án 2 chỗ nào?

| | Spring Playground | [Dự án 2 — Blog API](../projects/p2-blog-api/) |
|---|---|---|
| Mục đích | **Học từng khái niệm**, thấy tận mắt cạm bẫy | Xây **sản phẩm hoàn chỉnh** để đưa vào CV |
| Quy mô | 1 app, mỗi endpoint 1 bài học | Kiến trúc đầy đủ, nhiều tầng |
| Database | H2 in-memory | PostgreSQL + Flyway |
| Cách dùng | Gọi, quan sát, sửa code, gọi lại | Đọc, hiểu, rồi tự viết lại |

Học Module 10–14 thì chạy sân tập này; làm xong Module 13 thì bắt tay vào Dự án 2.

## Bài tập với sân tập (làm sau khi đã chạy hết endpoint)

1. Thêm cổng thanh toán `ZALOPAY` thứ hai tên khác — chứng minh `PaymentService` **không cần sửa**.
2. Sửa `CounterService` để `/m10/singleton-bug` luôn ra đúng số. Có mấy cách?
3. Đặt `app.shop.max-items-per-order: 0` trong `application.yml` → giải thích thông báo lỗi khi khởi động.
4. Thêm endpoint `PUT /api/v1/books/{id}` (thay thế toàn bộ) và giải thích nó khác `PATCH` chỗ nào.
5. Thêm 100 bài viết vào `SampleDataLoader`, gọi lại `/m12/n-plus-1/bad` — số query nhảy lên bao nhiêu?
6. Viết `findAllWithAuthorBatchSize` dùng `hibernate.default_batch_fetch_size` và so sánh với 3 cách còn lại.
7. Làm `/m12/atomic-stock` chạy đúng bằng **optimistic locking** (`@Version`) thay vì UPDATE nguyên tử. So sánh 2 cách.
8. Thêm refresh token cho `/m13/login` (gợi ý: xem `AuthService` của Dự án 2).
9. Chặn cache stampede ở `/m14/stampede` bằng khóa — kiểm chứng số lần method chạy về đúng 1.
10. Đổi cache in-memory sang Redis (`docker run -p 6379:6379 redis:7-alpine`) và chạy 2 instance để thấy khác biệt.
