# Bài tập Module 11 — Spring Boot REST API

## Nhóm A — Thiết kế API

**A1.** Cho các yêu cầu sau, hãy thiết kế URL + HTTP method + status code:
- Lấy danh sách sách có phân trang, lọc theo thể loại
- Xem chi tiết một cuốn
- Thêm sách mới
- Sửa toàn bộ / sửa một phần thông tin sách
- Xóa sách
- Lấy danh sách lượt mượn của một thành viên
- Trả sách (không phải CRUD)
- Đăng nhập

**A2.** Chỉ ra lỗi trong các URL sau và sửa lại:
```
POST /api/getBooks
GET  /api/book/delete/5
POST /api/updateUserProfile?id=3
GET  /api/Books/GetByCategory/IT
```

**A3.** Với mỗi tình huống, chọn status code đúng: email đã tồn tại khi đăng ký; token hết hạn; user thường gọi API admin; xóa thành công; tạo thành công; thiếu trường bắt buộc; lỗi kết nối DB.

## Nhóm B — Controller & DTO

**B1.** Chuyển **Dự án 1 (thư viện)** thành REST API. Tạo `BookController` với đủ 5 endpoint CRUD.

**B2.** Tách DTO: `CreateBookRequest`, `UpdateBookRequest`, `BookResponse`, `BookSummaryResponse` (bản rút gọn cho danh sách).
*Đạt khi*: `Book` (entity/model) **không xuất hiện** trong chữ ký của bất kỳ method controller nào.

**B3.** Viết `MemberController` và `LoanController`:
```
POST /api/v1/loans           mượn sách (body: memberCode, isbn)
POST /api/v1/loans/{id}/return   trả sách
GET  /api/v1/members/{code}/loans
GET  /api/v1/loans/overdue
```

**B4.** Trả `201 Created` kèm header `Location` khi tạo mới; `204 No Content` khi xóa.

**B5.** Chứng minh vì sao không được nhận thẳng entity `User` từ `@RequestBody`: gửi JSON có `"role": "ADMIN"` và xem điều gì xảy ra.

## Nhóm C — Validation

**C1.** Thêm validation đầy đủ cho `CreateBookRequest`: ISBN đúng định dạng, tên sách 1–200 ký tự, số bản ≥ 1, tác giả không rỗng. Thông báo lỗi **bằng tiếng Việt**.

**C2.** Validate `CreateMemberRequest`: email hợp lệ, số điện thoại Việt Nam (`^(0|\+84)[0-9]{9}$`), tên ≥ 2 ký tự.

**C3.** Viết annotation `@UniqueIsbn` kiểm tra ISBN chưa tồn tại trong DB.

**C4.** Validate lồng nhau: `CreateOrderRequest` chứa `List<OrderItemRequest>`, mỗi item cần `@Valid`.

**C5.** Validate tham số truy vấn: `@Min(0) int page`, `@Max(100) int size` với `@Validated` trên controller.

**C6.** Cố tình gửi request thiếu trường và xác nhận trả về `400` kèm danh sách `fieldErrors`.

## Nhóm D — Xử lý lỗi

**D1.** Viết `GlobalExceptionHandler` xử lý: `NotFoundException` → 404, `BusinessRuleException` → 409, `MethodArgumentNotValidException` → 400, `Exception` → 500.

**D2.** Thiết kế `ErrorResponse` thống nhất có: timestamp, status, error, message, path, fieldErrors, và **traceId** (dùng `UUID` để tra log).

**D3.** Thêm `errorCode` dạng chuỗi (`BOOK_NOT_FOUND`, `LOAN_LIMIT_EXCEEDED`) để frontend hiển thị thông báo đa ngôn ngữ.

**D4.** Xử lý `HttpMessageNotReadableException` (JSON sai cú pháp) và `MethodArgumentTypeMismatchException` (`/books/abc` khi id là số).

**D5.** Chứng minh stacktrace **không** bị lộ ra client, nhưng **có** trong log server.

## Nhóm E — Phân trang, lọc, sắp xếp

**E1.** `GET /api/v1/books?page=0&size=20&sort=title,asc` trả về `Page<BookResponse>`.

**E2.** Bọc thành `PageResponse<T>` riêng của bạn, không phụ thuộc `Page` của Spring.

**E3.** Lọc động nhiều tiêu chí: `?keyword=&category=&available=true&minCopies=`. Tiêu chí null thì bỏ qua.

**E4.** Giới hạn `size` tối đa 100 để tránh client yêu cầu 1 triệu bản ghi.

## Nhóm F — Tài liệu & test

**F1.** Thêm springdoc, mở Swagger UI, gọi thử toàn bộ API trên trình duyệt.

**F2.** Thêm `@Tag`, `@Operation`, `@ApiResponses`, ví dụ request/response cho mỗi endpoint.

**F3.** Viết `@WebMvcTest` cho `BookController`: 200 khi tồn tại, 404 khi không, 400 khi validate hỏng, 201 khi tạo mới.

**F4.** Test `GlobalExceptionHandler` trả đúng định dạng `ErrorResponse`.

**F5.** Dùng Postman (hoặc file `.http` trong IntelliJ) tạo bộ collection gọi toàn bộ API, lưu vào repo.

## Nhóm H — HTTP, logging & gọi API ngoài

**H1.** Làm hết bài tập W1–W5 trong [http-va-web.md](http-va-web.md).

**H2. Logging.** Trong Library API:
- Thay mọi `System.out` bằng SLF4J. Mỗi thao tác nghiệp vụ (mượn, trả, tạo sách) có đúng **một** dòng `INFO`.
- Thêm `RequestIdFilter` (MDC). `ErrorResponse.traceId` phải trùng header `X-Request-Id`.
- Ghi log ra file `logs/library.log`, xoay vòng 10MB.
*Đạt khi*: gọi một request lỗi, lấy `traceId` trong response, tìm được **mọi** dòng log của đúng request đó bằng một lệnh `grep`.

**H3. Review log.** Tìm và sửa mọi chỗ sai trong đoạn sau (có ít nhất 5 lỗi):
```java
try {
    log.info("Đăng nhập: email=" + email + ", password=" + password);
    User u = userRepository.findByEmail(email).orElseThrow();
    log.error("Không tìm thấy user " + email);
    return jwtService.generate(u);
} catch (Exception e) {
    log.error("Lỗi đăng nhập: " + e.getMessage());
    throw e;
}
```

**H4. Gọi API ngoài.** Viết `ExchangeRateClient` gọi API tỷ giá công khai (ví dụ `https://open.er-api.com/v6/latest/USD`) bằng `RestClient`:
- Connect timeout 2s, read timeout 3s; lỗi mạng → `503 EXCHANGE_RATE_UNAVAILABLE`.
- Cache kết quả 10 phút (tạm dùng `ConcurrentHashMap` + thời điểm lấy; Module 14 sẽ thay bằng `@Cacheable`).
- Endpoint `GET /api/v1/books/{id}/price?currency=USD` trả giá sách đã quy đổi.
- Test bằng `MockRestServiceServer`: thành công, đối tác trả 500, đối tác trả JSON thiếu trường.

**H5.** Chạy spring-playground, gọi `/m11/external/rates?delayMs=5000` từ 3 terminal **cùng lúc**, rồi đổi read timeout thành 30 giây và gọi lại. Giải thích điều gì xảy ra với thread của Tomcat trong trường hợp thứ hai nếu có 500 người cùng gọi.

## Nhóm G — Tổng hợp (bắt buộc)

**G1. Library REST API hoàn chỉnh.** Nâng Dự án 1 lên thành API thật:
- CRUD sách, thành viên; mượn/trả sách; báo cáo quá hạn; thống kê.
- DTO tách bạch, validation đầy đủ, lỗi thống nhất.
- Phân trang + lọc + sắp xếp cho danh sách.
- Swagger UI đầy đủ mô tả.
- CORS cho `http://localhost:3000`.
- Actuator `/actuator/health`.
- Ít nhất 15 test controller.

*Đạt khi*: người khác chỉ cần mở Swagger UI là dùng được toàn bộ API mà không cần hỏi bạn câu nào.

---

## Câu hỏi phỏng vấn
1. REST là gì? Stateless nghĩa là gì và vì sao quan trọng?
2. PUT khác PATCH thế nào? Idempotent là gì?
3. 401 khác 403 ra sao?
4. Vì sao phải tách DTO khỏi Entity?
5. `@Valid` hoạt động thế nào? Nếu quên thì sao?
6. `@RestControllerAdvice` dùng để làm gì?
7. `@Controller` khác `@RestController`?
8. Làm sao để API hỗ trợ phân trang hiệu quả với bảng 10 triệu dòng?
9. Versioning API có những cách nào?
10. CORS là gì? Vì sao trình duyệt chặn?
11. Các mức log khác nhau thế nào? Lỗi "không tìm thấy sản phẩm" nên log ở mức nào?
12. MDC là gì? Vì sao phải `MDC.remove()` trong `finally`?
13. Gọi API bên ngoài cần chú ý những gì? Vì sao thiếu timeout có thể làm sập cả ứng dụng?
14. Khi nào nên retry, khi nào không? Idempotency key dùng để làm gì?
