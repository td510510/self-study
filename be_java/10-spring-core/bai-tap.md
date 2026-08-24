# Bài tập Module 10 — Spring Core

## Nhóm A — Dự án đầu tiên

**A1.** Tạo project trên https://start.spring.io (Maven, Java 21, Spring Boot 3.3.x, dependencies: Web, DevTools, Lombok, Validation). Chạy `./mvnw spring-boot:run`, mở `http://localhost:8080`.

**A2.** Viết `HelloController` với 3 endpoint: `/hello`, `/hello?name=An`, `/hello/{name}`.

**A3.** Đọc log khởi động: tìm dòng "Tomcat started on port", "Started Application in X seconds". Đổi port sang 8081 bằng `application.yml`.

**A4.** Bật DevTools và sửa code → quan sát ứng dụng tự khởi động lại.

## Nhóm B — Bean & DI

**B1.** Chuyển **Dự án 1 (thư viện)** sang Spring:
- `@Repository` cho các `InMemory*Repository`
- `@Service` cho `LibraryService`
- Xóa toàn bộ phần lắp ráp thủ công trong `LibraryApplication`
- Dùng `CommandLineRunner` để nạp `SampleData` khi khởi động

*Đạt khi*: chương trình chạy y hệt cũ mà không còn dòng `new` nào cho repository/service.

**B2.** Viết interface `Notifier` với 3 bean `EmailNotifier`, `SmsNotifier`, `SlackNotifier`. Tiêm cả 3 vào `NotificationService` bằng `List<Notifier>` và gửi qua tất cả.

**B3.** Với 3 bean trên, thử lần lượt: `@Qualifier`, `@Primary`, và tiêm `Map<String, Notifier>`. Ghi lại khác biệt.

**B4.** Cố tình tạo lỗi "expected single matching bean" rồi đọc thông báo và sửa.

**B5.** Tạo **circular dependency** (A cần B, B cần A) bằng constructor injection, đọc lỗi Spring báo, rồi sửa bằng cách thiết kế lại (tách phần chung ra class thứ ba).

**B6.** So sánh constructor injection và field injection: viết unit test **không dùng Spring** cho cả hai cách, chỉ ra cách nào test được.

## Nhóm C — Scope & vòng đời

**C1.** Tạo bean singleton có biến đếm `int counter`, gọi từ 100 thread đồng thời — chứng minh dữ liệu sai. Sửa bằng `AtomicInteger`.

**C2.** So sánh `@Scope("singleton")` và `@Scope("prototype")`: in `hashCode()` của bean khi lấy 3 lần.

**C3.** Dùng `@PostConstruct` nạp danh mục sách vào cache lúc khởi động, `@PreDestroy` in thông báo khi tắt.

**C4.** Viết `CommandLineRunner` và `ApplicationRunner`, so sánh thứ tự chạy.

## Nhóm D — Cấu hình

**D1.** Khai báo trong `application.yml`:
```yaml
app:
  library:
    max-books-per-member: 3
    loan-days: 14
    fee-per-late-day: 5000
```
Đọc bằng `@ConfigurationProperties` và dùng trong `LibraryService` thay cho hằng số hardcode.

**D2.** Tạo `application-dev.yml` và `application-prod.yml` với cấu hình khác nhau; chạy thử từng profile.

**D3.** Dùng `@Profile` để có 2 bean `Notifier` khác nhau cho dev (in ra console) và prod (gửi thật).

**D4.** Đọc mật khẩu DB từ biến môi trường với giá trị mặc định: `${DB_PASSWORD:postgres}`. Chứng minh ứng dụng không chứa mật khẩu trong mã nguồn.

**D5.** Thêm validation cho properties (`@Validated`, `@Min`, `@NotBlank`) và chứng minh ứng dụng **không khởi động được** khi cấu hình sai.

## Nhóm E — AOP

**E1.** Viết `LoggingAspect` ghi log thời gian chạy của mọi method trong package `service`.

**E2.** Viết annotation riêng `@LogExecutionTime` và aspect chỉ áp dụng cho method có annotation đó.

**E3.** Viết aspect `@AfterThrowing` ghi log mọi exception ném ra từ tầng service, kèm tham số đầu vào.

**E4.** Chứng minh bẫy self-invocation: tạo method `a()` có `@Transactional`, gọi từ `b()` trong cùng class, chứng minh transaction không được áp dụng. Sau đó sửa bằng cách tách class.

**E5.** Viết aspect kiểm tra quyền đơn giản: method có `@RequireRole("ADMIN")` thì kiểm tra người dùng hiện tại, không đủ quyền thì ném exception.

## Nhóm F — Tổng hợp (bắt buộc)

**F1. Chuyển toàn bộ Dự án 1 sang Spring Boot** (nhưng vẫn là ứng dụng console, chưa có REST):
- Mọi thành phần là bean, không còn lắp ráp tay.
- Cấu hình nghiệp vụ (hạn mức, số ngày mượn, phí trễ) nằm trong `application.yml`.
- Có aspect ghi log thời gian chạy các method service.
- Có profile `dev` (nạp dữ liệu mẫu) và `prod` (không nạp).
- Test cũ vẫn chạy được **không cần Spring** (nhờ constructor injection).

*Đạt khi*: `mvn test` xanh, ứng dụng chạy được với cả 2 profile, và bạn giải thích được từng annotation mình dùng.

---

## Câu hỏi phỏng vấn
1. IoC là gì? DI là gì? Quan hệ giữa chúng?
2. Vì sao constructor injection tốt hơn field injection?
3. `@Component`, `@Service`, `@Repository`, `@Controller` khác nhau chỗ nào?
4. Bean scope mặc định là gì? Rủi ro của singleton?
5. Xử lý thế nào khi có nhiều bean cùng kiểu?
6. Circular dependency là gì, xử lý ra sao?
7. `@Bean` khác `@Component` thế nào?
8. AOP là gì? Spring cài đặt bằng cách nào?
9. Vì sao `@Transactional` không hoạt động khi gọi method trong cùng class?
10. Spring Boot khác Spring thường ở đâu? Auto-configuration hoạt động thế nào?
