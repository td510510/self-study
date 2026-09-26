# Bài tập Module 05b — Design Patterns

> Với mỗi bài, ngoài code hãy viết 2–3 câu trả lời: **vấn đề gì khiến cần pattern này?** và **nếu không dùng thì code sẽ ra sao?** Trả lời được câu đó quan trọng hơn thuộc tên pattern.

## Nhóm A — Nhận diện

**A1.** Với mỗi thứ sau, cho biết đó là pattern gì và giải thích ngắn:
`List.of(...)`, `StringBuilder`, `Collections.unmodifiableList(list)`, `BufferedReader(new FileReader(...))`, `Comparator.comparing(...)`, `JdbcTemplate`, `@Transactional`, `@EventListener`, `jakarta.servlet.Filter`, `InputStreamReader`, `Runtime.getRuntime()`, `ResponseEntity.ok().body(x)`.

**A2.** Mở code Dự án 1 (hoặc bài tập bạn đã làm). Tìm **2 chỗ** có thể áp dụng pattern và **1 chỗ** đang "over-engineering" (trừu tượng hóa không cần thiết). Ghi lại lý do.

## Nhóm B — Khởi tạo

**B1. Builder.** Viết `HttpRequestSpec` với builder: `method` (mặc định GET), `url` (bắt buộc, phải bắt đầu bằng `http`), `headers` (Map, thêm từng cái), `body` (chỉ cho phép khi method là POST/PUT/PATCH), `timeout` (mặc định 5 giây, tối đa 60).
*Đạt khi*: object tạo ra bất biến; mọi vi phạm ném exception ở `build()` với thông báo rõ ràng; có test cho từng luật.

**B2. Static factory.** Viết value object `Email` với `Email.of(String)` — chuẩn hóa (trim, chữ thường), kiểm tra định dạng, ném exception nếu sai. Constructor private. Override `equals/hashCode` (hoặc dùng record có compact constructor).
*Đạt khi*: `Email.of(" An@Shop.VN ").equals(Email.of("an@shop.vn"))` là `true`.

**B3. Factory.** Viết `ReportExporter` với 3 cài đặt: CSV, JSON, HTML. `ReportExporterFactory.forFormat("csv")` trả đúng loại, định dạng không hỗ trợ ném exception liệt kê các định dạng hợp lệ.

## Nhóm C — Cấu trúc

**C1. Adapter.** Hệ thống của bạn có `interface SmsSender { void send(PhoneNumber to, String text); }`. Có 2 "thư viện" nhà mạng (tự giả lập) với API khác nhau:
- `ViettelSmsApi.push(String msisdn, String content, int type)` trả về mã số `int` (0 = OK).
- `VnptClient.sendMessage(SmsPayload payload)` ném `VnptException` khi lỗi.
Viết 2 adapter; lỗi của nhà mạng phải được chuyển thành `SmsDeliveryException` **của bạn**.
*Đạt khi*: code nghiệp vụ không import bất kỳ class nào của nhà mạng.

**C2. Decorator.** Cho `interface WeatherClient { Weather current(String city); }`. Viết 3 decorator và ghép tùy ý:
- `RetryingWeatherClient` — thử lại tối đa 3 lần khi lỗi, chờ 100ms, 200ms, 400ms.
- `CachingWeatherClient` — cache 10 phút theo thành phố (dùng `Clock` tiêm vào để test được thời gian).
- `LoggingWeatherClient` — log thời gian gọi.
*Đạt khi*: có test chứng minh: lỗi 2 lần rồi thành công → trả kết quả; gọi lại trong 10 phút không gọi client thật.

**C3. Proxy.** Dựa vào `StructuralDemo.java`, dùng `java.lang.reflect.Proxy` viết `timingProxy(target, type)` in thời gian chạy của **mọi** method có annotation `@Timed` tự định nghĩa. Sau đó giải thích bằng lời: vì sao một method `private` hoặc `final` không thể được Spring proxy (gợi ý: CGLIB tạo class con).

**C4. Facade.** Viết `UserOnboardingFacade.register(RegisterRequest)` điều phối: kiểm tra email trùng → tạo user → tạo ví với số dư 0 → gửi email chào mừng → cấp voucher tân thủ. Nếu tạo ví lỗi thì phải "hoàn tác" việc tạo user.

## Nhóm D — Hành vi

**D1. Strategy.** Viết hệ thống tính phí phạt trả sách trễ cho Dự án 1: sinh viên (2.000đ/ngày, tối đa 50.000đ), giảng viên (miễn 3 ngày đầu, sau đó 1.000đ/ngày), khách (5.000đ/ngày). Không dùng `if/else` theo loại thành viên trong service.
*Đạt khi*: thêm loại "cựu sinh viên" chỉ cần thêm code, không sửa class cũ nào.

**D2. Template Method.** Viết `abstract class ScheduledJob` với khung: ghi log bắt đầu → kiểm tra có được chạy không (hook, mặc định `true`) → `execute()` → ghi log kết thúc kèm thời gian → nếu lỗi thì log lỗi và **không** ném ra ngoài. Viết 2 job con: `CleanupExpiredTokensJob`, `SendDailyReportJob` (chỉ chạy ngày thường).
Sau đó viết lại bằng **callback** (`JobRunner.run(String name, Runnable task)`) và so sánh hai cách.

**D3. Observer.** Viết `EventBus` generic: `<E> void subscribe(Class<E> type, Consumer<E> listener)` và `publish(Object event)` — chỉ gọi listener đăng ký đúng kiểu sự kiện. Thêm chế độ bất đồng bộ dùng `ExecutorService`.
*Đạt khi*: listener lỗi không ảnh hưởng listener khác; có test cho cả đồng bộ và bất đồng bộ.

**D4. Chain of Responsibility.** Viết chuỗi kiểm tra đơn hàng trước khi đặt: giỏ không rỗng → tồn kho đủ → voucher hợp lệ → tổng tiền không vượt hạn mức → không phải khách trong danh sách đen. Mỗi kiểm tra là một class; trả về **tất cả** lỗi (không dừng ở lỗi đầu tiên) dạng `List<String>`.

**D5. State.** Mở rộng máy trạng thái đơn hàng trong `BehavioralDemo.java`: thêm `RETURN_REQUESTED`, `RETURNED` (chỉ được yêu cầu trả hàng trong 7 ngày sau `DELIVERED`). Lưu lịch sử chuyển trạng thái (từ, đến, thời điểm, người thực hiện).
*Đạt khi*: có test cho mọi cặp chuyển hợp lệ và ít nhất 5 cặp không hợp lệ.

## Nhóm E — Tổng hợp

**E1. Refactor.** Cho hàm sau, tái cấu trúc sao cho thêm kênh thông báo mới hoặc loại sự kiện mới không phải sửa code cũ. **Viết test chốt hành vi trước khi sửa.**
```java
void notify(String event, User user, Map<String, Object> data) {
    if (event.equals("ORDER_PLACED")) {
        String msg = "Đơn " + data.get("orderId") + " đã đặt";
        if (user.prefersEmail()) emailClient.send(user.email(), msg);
        if (user.prefersSms()) smsClient.send(user.phone(), msg);
    } else if (event.equals("ORDER_SHIPPED")) {
        String msg = "Đơn " + data.get("orderId") + " đang giao, mã " + data.get("tracking");
        if (user.prefersEmail()) emailClient.send(user.email(), msg);
        if (user.prefersSms()) smsClient.send(user.phone(), msg);
        if (user.hasApp()) pushClient.push(user.deviceId(), msg);
    } else if (event.equals("PASSWORD_RESET")) {
        emailClient.send(user.email(), "Mã đặt lại mật khẩu: " + data.get("code"));  // luôn gửi email
    }
}
```

**E2. Đọc hiểu.** Mở source của Spring (Ctrl+Click trong IntelliJ) và tìm: `JdbcTemplate.execute`, `TransactionTemplate.execute`, `OncePerRequestFilter.doFilter`. Viết mỗi cái 3–4 câu: pattern gì, phần nào cố định, phần nào bạn đưa vào.

---

## Câu hỏi phỏng vấn tự trả lời
1. Singleton là gì? Viết một Singleton an toàn đa luồng. Vì sao nó hay bị coi là anti-pattern?
2. Bean trong Spring mặc định có phải singleton không? Khác gì Singleton pattern tự viết?
3. Builder giải quyết vấn đề gì? Khi nào không nên dùng?
4. Strategy khác State ở điểm nào?
5. Decorator và Proxy giống và khác nhau thế nào?
6. `@Transactional` hoạt động thế nào? Vì sao gọi method nội bộ thì nó không có tác dụng?
7. Spring Security dùng pattern gì để xử lý request?
8. Kể 3 pattern có trong JDK và 3 pattern có trong Spring.
9. Composition khác inheritance thế nào? Vì sao "ưu tiên composition"?
