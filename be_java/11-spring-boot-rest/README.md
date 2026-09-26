# Module 11 — Spring Boot REST API

> Mục tiêu: xây REST API đúng chuẩn công nghiệp — thiết kế endpoint, DTO, validation, xử lý lỗi thống nhất, phân trang, tài liệu OpenAPI.
> Thời lượng: 2 tuần. Đây là công việc hằng ngày của một backend developer.

> 📖 **Đọc trước:** [http-va-web.md](http-va-web.md) — DNS, TCP, HTTP, HTTPS, cookie/token, CORS. Chưa nắm phần này thì
> khi API lỗi bạn sẽ không biết lỗi nằm ở tầng nào.

---

## 1. REST là gì (mức cần dùng)

REST là kiểu kiến trúc, không phải chuẩn bắt buộc. Bốn điều cần nhớ:
1. **Tài nguyên là danh từ**, thao tác nằm ở HTTP method.
2. **Stateless**: server không nhớ trạng thái giữa các request (nên mới scale được nhiều instance).
3. Dùng đúng **status code**.
4. Biểu diễn dữ liệu bằng **JSON**.

### Thiết kế URL

```
✅ ĐÚNG                          ❌ SAI
GET    /api/v1/books             GET  /api/getAllBooks
GET    /api/v1/books/123         GET  /api/getBookById?id=123
POST   /api/v1/books             POST /api/createBook
PUT    /api/v1/books/123         POST /api/updateBook
PATCH  /api/v1/books/123
DELETE /api/v1/books/123         POST /api/deleteBook

GET    /api/v1/members/5/loans   -- tài nguyên lồng nhau
GET    /api/v1/books?category=IT&page=0&size=20&sort=title,asc
```
Quy tắc: **danh từ số nhiều, chữ thường, gạch nối**, có phiên bản (`/v1`). Động từ nằm ở HTTP method, không nằm trong URL.

Hành động không phải CRUD thì dùng sub-resource:
```
POST /api/v1/orders/123/cancel
POST /api/v1/loans/456/return
```

### HTTP method

| Method | Ý nghĩa | Idempotent? | Body |
|---|---|:--:|:--:|
| GET | đọc | ✅ | ❌ |
| POST | tạo mới | ❌ | ✅ |
| PUT | thay thế toàn bộ | ✅ | ✅ |
| PATCH | sửa một phần | ❌ | ✅ |
| DELETE | xóa | ✅ | ❌ |

**Idempotent** = gọi 1 lần hay 10 lần cho cùng kết quả. Quan trọng vì client hay retry khi mạng lỗi.

### Status code — dùng cho đúng

| Code | Khi nào |
|---|---|
| **200** OK | GET/PUT/PATCH thành công |
| **201** Created | POST tạo mới thành công (kèm header `Location`) |
| **204** No Content | DELETE thành công, không trả body |
| **400** Bad Request | dữ liệu gửi lên sai/thiếu |
| **401** Unauthorized | **chưa đăng nhập** hoặc token sai |
| **403** Forbidden | đã đăng nhập nhưng **không đủ quyền** |
| **404** Not Found | không có tài nguyên |
| **409** Conflict | xung đột (email đã tồn tại, trạng thái không hợp lệ) |
| **422** Unprocessable | đúng cú pháp nhưng sai nghiệp vụ |
| **429** Too Many Requests | bị giới hạn tần suất |
| **500** Internal Server Error | lỗi của server (bug) |

> Lỗi kinh điển của người mới: trả `200 OK` kèm `{"success": false}` cho mọi thứ. Client không phân biệt được, monitoring không đếm được lỗi. **Hãy dùng đúng status code.**

## 2. Controller

```java
@RestController
@RequestMapping("/api/v1/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public Page<BookResponse> list(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 20, sort = "title") Pageable pageable) {
        return bookService.search(keyword, pageable);
    }

    @GetMapping("/{id}")
    public BookResponse getOne(@PathVariable Long id) {
        return bookService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookResponse create(@Valid @RequestBody CreateBookRequest request) {
        return bookService.create(request);
    }

    @PutMapping("/{id}")
    public BookResponse update(@PathVariable Long id, @Valid @RequestBody UpdateBookRequest request) {
        return bookService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        bookService.delete(id);
    }
}
```

Nếu cần điều khiển header/status linh hoạt hơn thì trả `ResponseEntity`:
```java
@PostMapping
public ResponseEntity<BookResponse> create(@Valid @RequestBody CreateBookRequest req) {
    BookResponse created = bookService.create(req);
    return ResponseEntity
            .created(URI.create("/api/v1/books/" + created.id()))   // header Location
            .body(created);
}
```

### Lấy dữ liệu từ request
```java
@PathVariable Long id                       // /books/123
@RequestParam String keyword                // ?keyword=java
@RequestParam(defaultValue = "0") int page
@RequestBody CreateBookRequest body         // JSON body
@RequestHeader("X-Request-Id") String reqId
@CookieValue("session") String session
```

## 3. DTO — không bao giờ lộ Entity ra ngoài

```java
// Request: dữ liệu client gửi lên
public record CreateBookRequest(
        @NotBlank(message = "ISBN không được để trống")
        @Pattern(regexp = "\\d{3}-\\d{10}", message = "ISBN sai định dạng")
        String isbn,

        @NotBlank @Size(max = 200) String title,
        @NotBlank String author,
        @Min(value = 1, message = "Số bản phải >= 1") int totalCopies
) { }

// Response: dữ liệu trả về client
public record BookResponse(Long id, String isbn, String title, String author,
                           int availableCopies, Instant createdAt) {
    public static BookResponse from(Book b) {
        return new BookResponse(b.getId(), b.getIsbn(), b.getTitle(),
                b.getAuthor(), b.getAvailableCopies(), b.getCreatedAt());
    }
}
```

Vì sao **bắt buộc** tách DTO khỏi Entity?
1. **Bảo mật**: entity `User` có `password`, `role` — trả thẳng ra là lộ dữ liệu; nhận thẳng vào là để client tự set `role = ADMIN`.
2. **Tách rời**: đổi cột trong DB không làm vỡ API của client.
3. **Rõ ràng**: API tạo và API cập nhật cần các trường khác nhau.
4. **Tránh lỗi vòng lặp vô hạn** khi serialize quan hệ hai chiều của JPA.

## 4. Validation

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

Các annotation hay dùng:
```java
@NotNull            // khác null
@NotBlank           // chuỗi: khác null, không rỗng, không toàn khoảng trắng
@NotEmpty           // collection/chuỗi không rỗng
@Size(min=2, max=50)
@Min / @Max
@Positive / @PositiveOrZero
@Email
@Pattern(regexp = "...")
@Past / @Future
@Valid              // validate lồng nhau
```

**Nhớ `@Valid` ở controller**, nếu không annotation trong DTO sẽ không có tác dụng gì cả:
```java
public BookResponse create(@Valid @RequestBody CreateBookRequest request)
```

Validator tự viết cho quy tắc riêng:
```java
@Target(ElementType.FIELD) @Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = UniqueEmailValidator.class)
public @interface UniqueEmail {
    String message() default "Email đã được sử dụng";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

@RequiredArgsConstructor
public class UniqueEmailValidator implements ConstraintValidator<UniqueEmail, String> {
    private final UserRepository repo;
    @Override public boolean isValid(String email, ConstraintValidatorContext ctx) {
        return email == null || !repo.existsByEmail(email);
    }
}
```

## 5. Xử lý lỗi thống nhất (`@RestControllerAdvice`)

Đây là thứ phân biệt API nghiệp dư và API chuyên nghiệp: **mọi lỗi đều trả về cùng một định dạng**.

```java
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fieldErrors) { }

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFoundException e, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, e.getMessage(), req, null);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessRuleException e, HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, e.getMessage(), req, null);
    }

    /** Lỗi validate của @Valid — gom thành map field -> thông báo */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e,
                                                          HttpServletRequest req) {
        Map<String, String> errors = e.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(FieldError::getField,
                        f -> f.getDefaultMessage() == null ? "không hợp lệ" : f.getDefaultMessage(),
                        (a, b) -> a));
        return build(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ", req, errors);
    }

    /** Lưới an toàn cuối cùng — KHÔNG để lộ stacktrace ra ngoài */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAll(Exception e, HttpServletRequest req) {
        log.error("Lỗi không mong đợi tại {}", req.getRequestURI(), e);   // log đầy đủ ở server
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Có lỗi xảy ra, vui lòng thử lại", req, null);
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String msg,
                                                HttpServletRequest req, Map<String, String> fields) {
        return ResponseEntity.status(status).body(new ErrorResponse(
                Instant.now(), status.value(), status.getReasonPhrase(), msg, req.getRequestURI(), fields));
    }
}
```

Kết quả client nhận được:
```json
{
  "timestamp": "2026-08-24T10:15:30Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Dữ liệu không hợp lệ",
  "path": "/api/v1/books",
  "fieldErrors": {
    "isbn": "ISBN không được để trống",
    "totalCopies": "Số bản phải >= 1"
  }
}
```

> **Nguyên tắc bảo mật**: thông báo lỗi trả cho client phải *hữu ích nhưng không tiết lộ nội bộ*. Không bao giờ trả stacktrace, tên bảng, câu SQL. Ghi chi tiết vào log ở server.

## 6. Phân trang & sắp xếp

```java
@GetMapping
public Page<BookResponse> list(@PageableDefault(size = 20, sort = "createdAt",
                                                direction = Sort.Direction.DESC) Pageable pageable) {
    return bookService.findAll(pageable);
}
```
```
GET /api/v1/books?page=0&size=20&sort=title,asc&sort=createdAt,desc
```

`Page<T>` trả về sẵn: `content`, `totalElements`, `totalPages`, `number`, `size`, `first`, `last`.

Thực tế nên bọc lại thành DTO riêng để không phụ thuộc cấu trúc `Page` của Spring:
```java
public record PageResponse<T>(List<T> items, int page, int size, long totalElements, int totalPages) {
    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }
}
```

## 7. Tài liệu API — OpenAPI/Swagger

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.6.0</version>
</dependency>
```
Chạy ứng dụng rồi mở: **http://localhost:8080/swagger-ui.html**

```java
@Tag(name = "Sách", description = "Quản lý đầu sách")
@RestController
public class BookController {

    @Operation(summary = "Lấy chi tiết sách theo id")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Thành công"),
        @ApiResponse(responseCode = "404", description = "Không tìm thấy sách")
    })
    @GetMapping("/{id}")
    public BookResponse getOne(@PathVariable Long id) { ... }
}
```
Swagger UI cho phép **gọi thử API ngay trên trình duyệt** — cực tiện khi làm việc với frontend.

## 8. Test controller

```java
@WebMvcTest(BookController.class)          // chỉ nạp tầng web, nhanh
class BookControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean BookService bookService;      // service được mock

    @Test
    void getBook_tonTai_tra200() throws Exception {
        given(bookService.getById(1L))
                .willReturn(new BookResponse(1L, "978", "Clean Code", "Martin", 2, Instant.now()));

        mockMvc.perform(get("/api/v1/books/1"))
               .andExpect(status().isOk())
               .andExpect(jsonPath("$.title").value("Clean Code"))
               .andExpect(jsonPath("$.availableCopies").value(2));
    }

    @Test
    void createBook_thieuTruong_tra400() throws Exception {
        mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"isbn": "", "title": "", "totalCopies": 0}"""))
               .andExpect(status().isBadRequest())
               .andExpect(jsonPath("$.fieldErrors.isbn").exists());
    }

    @Test
    void getBook_khongTonTai_tra404() throws Exception {
        given(bookService.getById(99L)).willThrow(new NotFoundException("sách", "99"));

        mockMvc.perform(get("/api/v1/books/99"))
               .andExpect(status().isNotFound());
    }
}
```

## 9. Vài thứ production cần có

```java
// CORS — cho frontend ở domain khác gọi được
@Bean
public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
        @Override public void addCorsMappings(CorsRegistry registry) {
            registry.addMapping("/api/**")
                    .allowedOrigins("http://localhost:3000")   // KHÔNG dùng "*" ở production
                    .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE");
        }
    };
}
```

```yaml
# application.yml
server:
  port: 8080
  error:
    include-stacktrace: never       # không lộ stacktrace
spring:
  jackson:
    default-property-inclusion: non_null
    serialization:
      write-dates-as-timestamps: false     # ngày giờ dạng ISO-8601
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics       # Actuator
```

Ghi log request bằng filter, kèm **request id** để lần vết — xem mục 10.4.

---

## 10. Logging — thứ duy nhất bạn có khi production gặp sự cố

Trên production không có debugger, không có `System.out` nào được nhìn thấy. Khi khách báo "em bấm đặt hàng bị lỗi lúc 10 giờ", thứ duy nhất bạn có là **log**. Log tốt thì tìm ra lỗi trong 5 phút; log tệ thì đoán mò cả ngày.

### 10.1 SLF4J + Logback — bộ đôi mặc định

- **SLF4J** là *interface* (API) để ghi log. Code của bạn chỉ phụ thuộc vào nó.
- **Logback** là *cài đặt* thật sự, Spring Boot đã kèm sẵn. Muốn đổi sang Log4j2 thì chỉ đổi dependency, code không sửa (lại là nguyên tắc Dependency Inversion).

```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);
    // hoặc dùng Lombok: @Slf4j trên class là có sẵn biến `log`

    public Order place(PlaceOrderRequest req, long userId) {
        log.info("Đặt hàng: userId={}, số sản phẩm={}", userId, req.items().size());
        ...
    }
}
```

**Không bao giờ dùng `System.out.println` trong code ứng dụng**: không có thời gian, không có mức độ, không tắt được, không gom được về hệ thống log tập trung.

### 10.2 Năm mức log — chọn cho đúng

| Mức | Dùng khi | Ví dụ |
|---|---|---|
| `ERROR` | lỗi cần người xử lý, **có kèm exception** | không kết nối được DB, bug không lường trước |
| `WARN` | bất thường nhưng hệ thống tự xoay xở được | gọi đối tác lỗi, đang thử lại; cấu hình thiếu, dùng mặc định |
| `INFO` | sự kiện nghiệp vụ quan trọng, **ít và có ý nghĩa** | đơn hàng được tạo, người dùng đăng nhập, job chạy xong |
| `DEBUG` | chi tiết để dev điều tra | giá trị tham số, nhánh if nào được chọn |
| `TRACE` | cực chi tiết | từng vòng lặp, giá trị bind SQL |

Production thường bật `INFO` trở lên, và bật `DEBUG` cho riêng một package khi cần điều tra:
```yaml
logging:
  level:
    root: INFO
    com.learn.shop.order: DEBUG     # chỉ package này
    org.hibernate.SQL: DEBUG        # xem SQL Hibernate sinh ra
```
Có Actuator thì đổi mức log lúc đang chạy, không cần deploy lại: `POST /actuator/loggers/com.learn.shop.order` với body `{"configuredLevel":"DEBUG"}` (endpoint này phải được bảo vệ).

Lỗi nghiệp vụ bình thường (sai mật khẩu, không đủ hàng, 404) là `DEBUG` hoặc `INFO`, **không phải `ERROR`**. Nếu mọi thứ đều là ERROR thì chẳng ai để ý khi có ERROR thật.

### 10.3 Viết log đúng cách

```java
// ✅ Placeholder {}: chuỗi chỉ được dựng khi mức log đang bật -> không tốn CPU khi tắt DEBUG
log.debug("Tính giá cho đơn {} với {} sản phẩm", orderId, items.size());

// ❌ Nối chuỗi: luôn dựng chuỗi, kể cả khi DEBUG đang tắt
log.debug("Tính giá cho đơn " + orderId + " với " + items.size() + " sản phẩm");

// ✅ Exception luôn là tham số CUỐI và KHÔNG có {} tương ứng -> in đầy đủ stacktrace
log.error("Không tạo được đơn cho user {}", userId, e);

// ❌ Mất stacktrace — chỉ còn một dòng message, không biết lỗi từ đâu ra
log.error("Lỗi: " + e.getMessage());

// ❌ Log rồi ném lại: cùng một lỗi xuất hiện 3–4 lần trong log, mỗi tầng một lần
catch (Exception e) { log.error("Lỗi", e); throw e; }
// ✅ Hoặc xử lý (và log), hoặc ném lên — không làm cả hai. Để GlobalExceptionHandler log một lần.
```

**Log cái gì?** Đủ để trả lời *ai, làm gì, với cái gì, kết quả ra sao*: id người dùng, id đơn hàng, số lượng, thời gian xử lý.

**KHÔNG BAO GIỜ log**: mật khẩu, token/JWT, số thẻ, OTP, toàn bộ body request (có thể chứa những thứ trên). Log thường được nhiều người đọc hơn database và lưu lâu hơn.

### 10.4 Request ID — nối các dòng log của cùng một request

Server xử lý 50 request cùng lúc, log của chúng xen kẽ nhau. Giải pháp: gắn một mã cho mỗi request và in nó trên **mọi dòng log** bằng **MDC** (Mapped Diagnostic Context — một Map gắn với thread hiện tại).

```java
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)          // chạy trước mọi filter khác, kể cả Spring Security
public class RequestIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String id = Optional.ofNullable(req.getHeader("X-Request-Id")).orElse(UUID.randomUUID().toString());
        MDC.put("requestId", id);
        res.setHeader("X-Request-Id", id);          // trả về để người dùng báo lỗi kèm mã
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.remove("requestId");                // BẮT BUỘC: thread Tomcat được tái sử dụng
        }
    }
}
```
```yaml
logging:
  pattern:
    level: "%5p [%X{requestId:-}]"
```
Kết quả:
```
INFO [a1b2c3d4] RequestIdFilter : GET /api/v1/orders/9 -> 404 (12 ms)
INFO [e5f6a7b8] OrderService    : Đặt hàng: userId=42, số sản phẩm=3
WARN [e5f6a7b8] ProductClient   : Gọi product-service lỗi, thử lại lần 2
```
Trả chính mã đó làm `traceId` trong `ErrorResponse` → khách báo mã, bạn tìm log ra ngay toàn bộ câu chuyện. Ở microservices, gateway sinh mã và **chuyển tiếp qua header** cho mọi service phía sau (Module 15 dùng OpenTelemetry làm việc này tự động).

Bản đầy đủ (kiểm tra header client gửi để chống log injection, ghi một dòng access log cho mỗi request) ở `spring-playground/.../m11rest/RequestIdFilter.java`.

> ⚠ MDC gắn với **thread**. Code chạy ở thread khác (`@Async`, `CompletableFuture`) sẽ mất MDC — phải copy sang (Spring có `TaskDecorator` cho việc này).

### 10.5 Log ra file và log dạng JSON

Mặc định Spring Boot log ra console — đúng với Docker/Kubernetes (hệ thống tự gom stdout). Chạy trên máy chủ thường thì ghi thêm file có xoay vòng:
```yaml
logging:
  file:
    name: logs/app.log
  logback:
    rollingpolicy:
      max-file-size: 10MB
      max-history: 14          # giữ 14 file
```
Production thường log **JSON** (mỗi dòng một object) để Loki/ELK tìm kiếm theo trường. Spring Boot 3.4+ có sẵn: `logging.structured.format.console: ecs`. Chi tiết ở Module 15.

---

## 11. Gọi API bên ngoài

Backend thật luôn gọi hệ thống khác: cổng thanh toán, gửi SMS, tra tỷ giá, service khác trong công ty. Đây là chỗ **hệ thống của bạn hay sập vì lỗi của người khác** nhất.

### 11.1 Chọn công cụ

| Công cụ | Dùng khi |
|---|---|
| **`RestClient`** (Spring 6.1+) | **mặc định cho code mới**: API gọn, đồng bộ, hợp với virtual threads |
| `RestTemplate` | code cũ; vẫn chạy nhưng không được phát triển thêm |
| `WebClient` | ứng dụng reactive (WebFlux) |
| `@HttpExchange` / OpenFeign | khai báo interface, framework tự cài đặt — gọn khi gọi nhiều endpoint của cùng một service |

```java
@Configuration
class PaymentClientConfig {
    @Bean
    RestClient paymentClient(RestClient.Builder builder, @Value("${app.payment.base-url}") String baseUrl) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(2));
        factory.setReadTimeout(Duration.ofSeconds(5));
        return builder.baseUrl(baseUrl).requestFactory(factory).build();
    }
}

@Component
class PaymentClient {
    private final RestClient client;

    PaymentClient(RestClient paymentClient) { this.client = paymentClient; }

    ChargeResponse charge(ChargeRequest req) {
        return client.post()
                .uri("/v1/charges")
                .contentType(MediaType.APPLICATION_JSON)
                .body(req)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, (request, response) -> {
                    throw new PaymentRejectedException(response.getStatusCode().value());
                })
                .body(ChargeResponse.class);
    }
}
```

### 11.2 Năm quy tắc sống còn

1. **Luôn đặt timeout.** Mặc định của HTTP client trong JDK là *chờ vô hạn*. Đối tác treo → thread của bạn treo theo → hết 200 thread của Tomcat → **toàn bộ ứng dụng ngừng phản hồi**, kể cả những API không liên quan. Connect timeout 1–3 giây, read timeout theo cam kết (SLA) của đối tác.
2. **Dịch lỗi của họ thành lỗi của mình.** `ResourceAccessException` (timeout, không kết nối được) và `HttpServerErrorException` phải được bắt và đổi thành exception nghiệp vụ → `503` với thông báo dễ hiểu. Đừng để chúng thành `500 INTERNAL_ERROR`.
3. **Chỉ retry lỗi tạm thời, có giới hạn, có chờ tăng dần.** Retry: timeout, `503`, `429`. Không retry: `400`, `401`, `404` (gọi lại vẫn sai). Chờ 100ms → 200ms → 400ms (*exponential backoff*) để không dội thêm tải vào hệ thống đang quá tải.
4. **Cẩn thận retry với thao tác không idempotent.** Gọi "trừ tiền" bị timeout — tiền đã trừ hay chưa? Retry mù quáng có thể trừ hai lần. Giải pháp: gửi kèm **idempotency key** (mã duy nhất cho mỗi giao dịch) để phía đối tác bỏ qua lần trùng (Module 14).
5. **Mỗi đối tác một client riêng** (một class, một cấu hình timeout), log thời gian gọi, và chuyển tiếp `X-Request-Id`.

Khi số lời gọi lớn và đối tác hay chết, bạn cần thêm **circuit breaker** (ngừng gọi một thời gian khi tỷ lệ lỗi cao) — Resilience4j ở Module 15.

### 11.3 Test code gọi API ngoài

Không gọi API thật trong test (chậm, tốn tiền, không kiểm soát được lỗi). Dùng:
- `@RestClientTest` + `MockRestServiceServer` của Spring: giả lập response cho từng URL.
- **WireMock**: dựng một HTTP server giả, giả lập cả độ trễ (`withFixedDelay(5000)`) để test timeout.

---

## Tổng kết
- URL là danh từ số nhiều, thao tác ở HTTP method, có version.
- Dùng đúng status code — đừng trả 200 cho mọi thứ.
- **Luôn tách DTO khỏi Entity.**
- `@Valid` + `@RestControllerAdvice` = mọi lỗi có một định dạng thống nhất.
- Phân trang bằng `Pageable`, tài liệu bằng springdoc.
- Test controller bằng `@WebMvcTest` + `MockMvc`.
- Log bằng SLF4J với placeholder `{}`, đúng mức, có request id; không log dữ liệu nhạy cảm.
- Gọi API ngoài: **luôn có timeout**, dịch lỗi của đối tác thành lỗi của mình, chỉ retry lỗi tạm thời.


## 💻 Code ví dụ chạy được

Module này có code chạy thật trong [../spring-playground/](../spring-playground/) — package `m11rest`:

```bash
cd spring-playground && mvn spring-boot:run     # rồi mở http://localhost:8080/
```
Nội dung: CRUD + DTO + validation + GlobalExceptionHandler + PageResponse; request id trong log (MDC);
gọi API "đối tác" bằng RestClient có timeout và retry.
Endpoint: `/api/v1/books` (201/400/404/409/500), `/m11/external/rates`, `/m11/external/rates?delayMs=5000`, `/m11/external/flaky`.

> Vừa gọi API vừa **đọc console** — một nửa bài học nằm ở log SQL và log aspect.

## Bài tập
👉 [bai-tap.md](bai-tap.md), sau đó sang [Module 12 — Spring Data JPA](../12-spring-data-jpa/).
