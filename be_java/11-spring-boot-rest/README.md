# Module 11 — Spring Boot REST API

> Mục tiêu: xây REST API đúng chuẩn công nghiệp — thiết kế endpoint, DTO, validation, xử lý lỗi thống nhất, phân trang, tài liệu OpenAPI.
> Thời lượng: 2 tuần. Đây là công việc hằng ngày của một backend developer.

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

Ghi log request bằng filter, kèm **correlation id** để lần vết một request qua nhiều service (chi tiết ở Module 15).

---

## Tổng kết
- URL là danh từ số nhiều, thao tác ở HTTP method, có version.
- Dùng đúng status code — đừng trả 200 cho mọi thứ.
- **Luôn tách DTO khỏi Entity.**
- `@Valid` + `@RestControllerAdvice` = mọi lỗi có một định dạng thống nhất.
- Phân trang bằng `Pageable`, tài liệu bằng springdoc.
- Test controller bằng `@WebMvcTest` + `MockMvc`.


## 💻 Code ví dụ chạy được

Module này có code chạy thật trong [../spring-playground/](../spring-playground/) — package `m11rest`:

```bash
cd spring-playground && mvn spring-boot:run     # rồi mở http://localhost:8080/
```
Nội dung: CRUD + DTO + validation + GlobalExceptionHandler + PageResponse.
Endpoint: `/api/v1/books (201/400/404/409/500)`.

> Vừa gọi API vừa **đọc console** — một nửa bài học nằm ở log SQL và log aspect.

## Bài tập
👉 [bai-tap.md](bai-tap.md), sau đó sang [Module 12 — Spring Data JPA](../12-spring-data-jpa/).
