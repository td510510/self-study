# Module 05b — Design Patterns thực dụng

> Mục tiêu: nhận ra các mẫu thiết kế **đang có sẵn** trong JDK và Spring, biết dùng đúng chỗ, và biết khi nào **không** nên dùng.
> Thời lượng: 4–5 ngày. Học sau Module 05 (cần lambda) và trước Module 10 (Spring dùng các mẫu này khắp nơi).

Design pattern là **lời giải đã được đặt tên** cho những vấn đề lặp đi lặp lại. Giá trị lớn nhất của nó không phải là code, mà là **từ vựng chung**: nói "chỗ này dùng Strategy" thì cả team hiểu ngay cấu trúc mà không cần giải thích.

Nguyên tắc số 1: **pattern là thuốc, không phải vitamin**. Chỉ dùng khi có đúng "bệnh". Một `if/else` 3 nhánh không bao giờ đổi thì không cần Strategy; một class có 2 field thì không cần Builder. Code "nhiều pattern" không phải code tốt — code **dễ đổi** mới là code tốt.

Có 23 pattern kinh điển (sách "Gang of Four"). Module này chỉ dạy **12 cái** mà một backend developer Java gặp thật sự, chia 3 nhóm.

| Nhóm | Giải quyết | Pattern trong module |
|---|---|---|
| Khởi tạo (Creational) | tạo object thế nào | Singleton, Factory, Builder |
| Cấu trúc (Structural) | ghép object thế nào | Adapter, Decorator, Proxy, Facade |
| Hành vi (Behavioral) | object phối hợp thế nào | Strategy, Template Method, Observer, Chain of Responsibility, State |

---

## Phần 1 — Nhóm khởi tạo

### 1.1 Singleton — cả ứng dụng chỉ một đối tượng

**Vấn đề**: một số thứ chỉ nên có một bản: connection pool, cấu hình, cache.

```java
// Cách an toàn và gọn nhất: enum (JVM đảm bảo chỉ tạo 1 lần, an toàn đa luồng, chống cả reflection)
public enum AppConfig {
    INSTANCE;
    private final Properties props = load();
    public String get(String key) { return props.getProperty(key); }
}

AppConfig.INSTANCE.get("db.url");
```
Các cách khác (eager, double-checked locking với `volatile`) bạn đã làm ở bài tập Module 06.

**Trong thực tế**: bạn **gần như không tự viết Singleton** nữa. Mọi bean Spring mặc định là singleton (một bean cho mỗi `ApplicationContext`), và Spring quản lý nó thay bạn.

**Vì sao Singleton tự viết bị coi là "anti-pattern"?** `AppConfig.INSTANCE` là biến toàn cục trá hình: class nào dùng nó thì phụ thuộc ngầm, **không thay được khi test**. DI giải quyết đúng vấn đề đó: cần một bản duy nhất thì để container tạo một bản rồi tiêm vào.

> ⚠ Bean singleton dùng chung cho mọi request → **không được giữ state thay đổi theo request** trong field (Module 06, mục 9).

### 1.2 Factory — giấu việc chọn class cụ thể

**Vấn đề**: code gọi cần một object nhưng không nên biết (hoặc không thể biết lúc viết code) class cụ thể nào.

**Static factory method** — dạng bạn dùng hằng ngày:
```java
List.of(1, 2, 3);                  // trả về class nội bộ, bạn không cần biết tên
Optional.ofNullable(x);
LocalDate.of(2026, 9, 26);
Integer.valueOf(127);              // có cache -127..127, `new Integer` thì không
```
Ưu điểm so với constructor: **có tên** (`Money.ofVnd(1000)` rõ hơn `new Money(1000, "VND")`), có thể trả về object có sẵn (cache), có thể trả về class con.

**Factory chọn theo tham số**:
```java
interface Notifier { void send(String to, String msg); }

class NotifierFactory {
    static Notifier create(Channel channel) {
        return switch (channel) {
            case EMAIL -> new EmailNotifier();
            case SMS   -> new SmsNotifier();
            case PUSH  -> new PushNotifier();
        };
    }
}
```
Trong Spring, bạn thay factory tự viết bằng `Map<String, Notifier>` được tiêm tự động (Module 02 mục 7, Module 10). Chính `ApplicationContext` là một factory khổng lồ: `context.getBean(Notifier.class)`.

### 1.3 Builder — tạo object nhiều tham số

**Vấn đề**: constructor 8 tham số, nửa là tùy chọn → `new Order(1L, null, null, "HN", 0, true, null, 5)` không ai đọc nổi, truyền nhầm vị trí cũng không biết.

```java
Order order = Order.builder()
        .customerId(42L)
        .shippingAddress("123 Đường ABC, Hà Nội")
        .note("Giao giờ hành chính")
        .build();                   // build() là chỗ kiểm tra hợp lệ
```
Cài đặt đầy đủ trong `CreationalDemo.java`. Thực tế thường sinh bằng Lombok `@Builder`.

Bạn gặp Builder ở khắp nơi: `StringBuilder`, `HttpRequest.newBuilder()`, `ResponseEntity.status(201).body(x)`, `Jwts.builder()`, `MockMvcRequestBuilders.post(...)`, `RestClient.builder()`.

**Khi nào không cần**: record/class ít field, đều bắt buộc → constructor là đủ.

---

## Phần 2 — Nhóm cấu trúc

### 2.1 Adapter — cắm đồ "khác chuẩn" vào hệ thống của mình

**Vấn đề**: hệ thống của bạn dùng interface `PaymentGateway { PaymentResult pay(long amountVnd) }`. Thư viện của đối tác lại có `MomoClient.createTransaction(MomoRequest req)` trả về `MomoResponse` với mã lỗi riêng.

```java
class MomoAdapter implements PaymentGateway {
    private final MomoClient client;                // thư viện bên ngoài, không sửa được

    public PaymentResult pay(long amountVnd) {
        MomoResponse res = client.createTransaction(new MomoRequest(amountVnd, "VND"));
        return res.resultCode() == 0
                ? PaymentResult.success(res.transId())
                : PaymentResult.failed("MOMO_" + res.resultCode());
    }
}
```
Lợi ích: **chỉ một class biết về Momo**. Đổi đối tác chỉ phải viết adapter mới, phần còn lại không đổi. Đây cũng là cách chống "lây" model của bên ngoài vào lõi nghiệp vụ.

Trong JDK/Spring: `Arrays.asList` (mảng → List), `InputStreamReader` (byte stream → char stream), `HandlerAdapter` trong Spring MVC.

### 2.2 Decorator — bọc thêm tính năng mà không sửa class gốc

**Vấn đề**: muốn thêm log, đo thời gian, cache, retry cho một service mà không sửa code của nó, và muốn **kết hợp tùy ý**.

```java
interface PriceService { long priceOf(String sku); }

class CachingPriceService implements PriceService {
    private final PriceService inner;               // bọc một PriceService khác
    private final Map<String, Long> cache = new ConcurrentHashMap<>();

    public long priceOf(String sku) {
        return cache.computeIfAbsent(sku, inner::priceOf);
    }
}

PriceService service = new LoggingPriceService(new CachingPriceService(new DbPriceService()));
```
Decorator **cùng interface** với thứ nó bọc → bọc bao nhiêu lớp cũng được, thứ tự tùy ý.

Ví dụ kinh điển nhất — Java I/O:
```java
new BufferedReader(new InputStreamReader(new FileInputStream("a.txt"), UTF_8));
//   thêm bộ đệm      byte -> ký tự (adapter)     đọc byte từ file
```

### 2.3 Proxy — đứng thay để kiểm soát truy cập

Cấu trúc giống Decorator (cùng interface, bọc object thật), khác ở **mục đích**: Decorator *thêm tính năng*, Proxy *kiểm soát việc truy cập* — trì hoãn khởi tạo, kiểm tra quyền, mở/đóng transaction, gọi qua mạng.

**Đây là pattern quan trọng nhất để hiểu Spring.** Mọi thứ "tự động" trong Spring đều là proxy:

| Annotation | Proxy làm gì trước/sau khi gọi method thật |
|---|---|
| `@Transactional` | mở transaction → gọi → commit / rollback |
| `@Cacheable` | tra cache → có thì trả luôn, không thì gọi rồi lưu |
| `@PreAuthorize` | kiểm tra quyền → không đủ thì ném `AccessDeniedException` |
| `@Async` | đẩy lời gọi sang thread pool khác |
| Spring Data `interface UserRepository` | bạn không viết class nào — Spring tạo proxy cài đặt hết |
| JPA lazy loading | `post.getAuthor()` trả về proxy, chạm vào mới query |

Và vì là proxy nên có **bẫy gọi nội bộ**: method trong cùng class gọi nhau bằng `this.x()` không đi qua proxy → annotation vô hiệu (Module 10 mục 8, Module 14). `StructuralDemo.java` tự dựng một proxy bằng `java.lang.reflect.Proxy` để bạn thấy tận mắt vì sao.

### 2.4 Facade — một cửa cho hệ thống phức tạp

**Vấn đề**: đặt hàng cần gọi kho, thanh toán, vận chuyển, email, điểm thưởng. Controller mà gọi thẳng 5 service thì nó biết quá nhiều.

```java
class CheckoutFacade {
    OrderResult checkout(Cart cart) {
        inventory.reserve(cart);
        Payment p = payment.charge(cart.total());
        Shipment s = shipping.schedule(cart);
        mail.sendConfirmation(cart, s);
        return new OrderResult(p.id(), s.trackingCode());
    }
}
```
Thực ra **tầng service của bạn chính là một facade** trên repository và các client. `JdbcTemplate` là facade trên JDBC thô (khỏi tự mở/đóng connection, statement, result set). `RestClient` là facade trên HTTP client.

---

## Phần 3 — Nhóm hành vi

### 3.1 Strategy — thay thuật toán lúc chạy

**Vấn đề**: nhiều cách làm cùng một việc (tính phí ship, giảm giá, thanh toán), chọn theo điều kiện, và danh sách cách làm còn tăng thêm.

```java
interface DiscountStrategy { long apply(long amount); }

DiscountStrategy none    = amount -> amount;
DiscountStrategy percent = amount -> amount * 90 / 100;
DiscountStrategy fixed   = amount -> Math.max(0, amount - 50_000);
```
Từ Java 8, Strategy chỉ cần một **functional interface + lambda**. `Comparator` chính là Strategy bạn dùng hằng ngày: `list.sort(comparator)` — thuật toán sắp xếp cố định, "cách so sánh" thay được.

Trong Spring: tiêm `List<DiscountStrategy>` hoặc `Map<String, DiscountStrategy>` rồi chọn theo key — thêm cách mới chỉ cần thêm một `@Component`, không sửa `switch` (nguyên tắc Open/Closed).

### 3.2 Template Method — khung cố định, chi tiết thay được

**Vấn đề**: nhiều quy trình giống nhau về các bước, chỉ khác chi tiết một vài bước. Ví dụ import dữ liệu: đọc file → kiểm tra từng dòng → lưu → báo cáo; chỉ khác cách đọc CSV hay Excel.

```java
abstract class DataImporter<T> {
    public final ImportReport run(Path file) {       // final: khung không được sửa
        List<String> rows = readRows(file);          // bước thay được
        List<T> valid = rows.stream().map(this::parse).filter(this::validate).toList();
        save(valid);
        return new ImportReport(rows.size(), valid.size());
    }
    protected abstract List<String> readRows(Path file);
    protected abstract T parse(String row);
    protected boolean validate(T item) { return true; }   // "hook": có mặc định, ghi đè nếu cần
    protected abstract void save(List<T> items);
}
```
Spring dùng tên `*Template` cho ý tưởng này nhưng thường thay kế thừa bằng **callback** (lambda): `JdbcTemplate.query(sql, rowMapper)` — Spring lo mở connection, chạy, đóng, dịch exception; bạn chỉ đưa vào "cách biến một dòng thành object". `TransactionTemplate`, `RestTemplate`, `KafkaTemplate`, `RedisTemplate` cùng một kiểu.

**Ưu tiên composition hơn kế thừa**: nếu làm được bằng Strategy (truyền lambda) thì thường linh hoạt hơn Template Method (kế thừa).

### 3.3 Observer — "có chuyện gì thì báo cho tôi"

**Vấn đề**: đặt hàng xong phải gửi email, cộng điểm, ghi log thống kê, báo kho. Nhét hết vào `OrderService.placeOrder()` thì mỗi lần thêm tác vụ phụ lại sửa lõi, và lỗi gửi email làm hỏng việc đặt hàng.

```java
// Bên phát không biết ai nghe
eventPublisher.publishEvent(new OrderPlacedEvent(order.getId()));

// Bên nghe tự đăng ký
@EventListener
void onOrderPlaced(OrderPlacedEvent e) { mailService.sendConfirmation(e.orderId()); }
```
Đây chính là Spring Events (Module 14, mục 2.5). Đưa lên mức hệ thống phân tán thì thành **Kafka/RabbitMQ** — publish/subscribe là Observer qua mạng.

### 3.4 Chain of Responsibility — đưa request qua một chuỗi xử lý

**Vấn đề**: mỗi request phải qua nhiều bước kiểm tra độc lập (log, xác thực, rate limit, CORS); mỗi bước có thể cho đi tiếp hoặc chặn lại.

```java
interface Handler { void handle(Request req, Chain chain); }
// mỗi handler: làm việc của mình rồi chain.next(req), hoặc không gọi để dừng chuỗi
```
Bạn dùng nó mỗi ngày: **Servlet Filter** và **Spring Security filter chain** (Module 13) — `JwtAuthenticationFilter` của bạn là một mắt xích, gọi `filterChain.doFilter(request, response)` để đi tiếp. `HandlerInterceptor` của Spring MVC cũng vậy. Code tự dựng trong `BehavioralDemo.java`.

### 3.5 State — hành vi phụ thuộc trạng thái

**Vấn đề**: đơn hàng `PENDING` thì hủy được, `SHIPPED` thì không; mỗi thao tác lại có một chuỗi `if (status == ...)` rải khắp nơi, thêm trạng thái mới là sửa mười chỗ.

Mức thực dụng nhất cho backend là **enum + bảng chuyển trạng thái**:
```java
enum OrderStatus {
    PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED;

    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED = Map.of(
            PENDING,   Set.of(CONFIRMED, CANCELLED),
            CONFIRMED, Set.of(SHIPPED, CANCELLED),
            SHIPPED,   Set.of(DELIVERED),
            DELIVERED, Set.of(),
            CANCELLED, Set.of());

    public OrderStatus transitionTo(OrderStatus next) {
        if (!ALLOWED.get(this).contains(next))
            throw new IllegalStateException(this + " -> " + next + " không hợp lệ");
        return next;
    }
}
```
Toàn bộ luật chuyển trạng thái nằm **một chỗ**, đọc là hiểu, test dễ. Dự án 3 dùng đúng sơ đồ trạng thái đơn hàng này.

---

## Phần 4 — Nhận diện nhanh

| Bạn thấy trong code... | Đó là |
|---|---|
| `if/else` hoặc `switch` theo "loại" lặp lại ở nhiều nơi | cần **Strategy** (hoặc State nếu theo trạng thái) |
| Constructor quá nhiều tham số, nhiều tham số tùy chọn | **Builder** |
| Phải dùng thư viện bên ngoài có API "lệch" với hệ thống | **Adapter** |
| Muốn thêm log/cache/retry mà không sửa class | **Decorator** (Spring: AOP proxy) |
| Controller gọi 5–6 service để làm một việc | **Facade** (một service điều phối) |
| Tác vụ phụ (email, thống kê) chen vào luồng chính | **Observer** (event) |
| Nhiều bước kiểm tra lần lượt trên request | **Chain of Responsibility** (filter) |
| Nhiều quy trình cùng khung, khác vài bước | **Template Method** / callback |

## Phần 5 — Anti-pattern: những thứ nên tránh

- **God class**: `UserService` 3.000 dòng làm mọi thứ. Tách theo trách nhiệm.
- **Pattern cho có**: `AbstractUserServiceFactoryProvider` cho một class duy nhất. Hãy đợi tới khi có **cái thứ hai** rồi mới trừu tượng hóa ("quy tắc ba lần": lần thứ ba lặp lại mới tách chung).
- **Singleton tự viết** thay vì DI → khó test.
- **Anemic domain model quá mức**: entity chỉ có getter/setter, mọi luật nghiệp vụ nằm rải rác trong service. Luật thuộc về dữ liệu nào thì đặt trong class đó (ví dụ `order.cancel()` tự kiểm tra trạng thái).
- **Magic string/number**: `if (status == 3)` → dùng enum.

---

## Tổng kết
- Pattern = từ vựng chung + lời giải đã kiểm chứng. Dùng khi có đúng vấn đề.
- Java hiện đại: Strategy = lambda, Builder = Lombok `@Builder`, Singleton = bean Spring.
- **Proxy** là chìa khóa hiểu Spring: `@Transactional`, `@Cacheable`, `@PreAuthorize`, repository đều là proxy → bẫy gọi nội bộ.
- Filter chain (Chain of Responsibility), event (Observer), `*Template` (Template Method) — bạn sẽ gặp lại ở Module 10–14.

## Code trong module
```bash
java 05b-design-patterns/src/patterns/CreationalDemo.java
java 05b-design-patterns/src/patterns/StructuralDemo.java
java 05b-design-patterns/src/patterns/BehavioralDemo.java
java 05b-design-patterns/src/patterns/RefactoringDemo.java
```
- [src/patterns/CreationalDemo.java](src/patterns/CreationalDemo.java) — Singleton (enum), static factory, factory theo tham số, Builder có kiểm tra hợp lệ
- [src/patterns/StructuralDemo.java](src/patterns/StructuralDemo.java) — Adapter, Decorator xếp chồng, **tự dựng proxy như Spring** và bẫy gọi nội bộ, Facade
- [src/patterns/BehavioralDemo.java](src/patterns/BehavioralDemo.java) — Strategy bằng lambda, Template Method, Observer, filter chain, máy trạng thái đơn hàng
- [src/patterns/RefactoringDemo.java](src/patterns/RefactoringDemo.java) — một hàm "if/else" 60 dòng được tái cấu trúc từng bước bằng pattern

👉 Làm [bai-tap.md](bai-tap.md) rồi sang [Module 06 — Concurrency](../06-concurrency/).
