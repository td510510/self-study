# Module 10 — Spring Core: IoC, DI, Bean, AOP

> Mục tiêu: hiểu Spring làm gì cho bạn và **vì sao**, thay vì học thuộc annotation.
> Thời lượng: 1 tuần.

---

## 1. Vấn đề Spring giải quyết

Nhớ lại `LibraryApplication` ở Dự án 1:
```java
BookRepository bookRepo = new InMemoryBookRepository();
MemberRepository memberRepo = new InMemoryMemberRepository();
LoanRepository loanRepo = new InMemoryLoanRepository();
LibraryService service = new LibraryService(bookRepo, memberRepo, loanRepo);
new ConsoleUI(service).run();
```
Với 5 class thì ổn. Nhưng dự án thật có 300 class, mỗi class 3–5 phụ thuộc, lại còn transaction, cache, security, logging quấn quanh mỗi lời gọi. Tự lắp tay là bất khả thi.

**Spring làm hộ đúng việc đó**: bạn khai báo "tôi cần cái gì", Spring tự tạo, tự lắp, tự quản lý vòng đời.

### IoC — Đảo ngược điều khiển
- Bình thường: **code của bạn** gọi `new` để tạo phụ thuộc.
- IoC: **framework** tạo object và đưa cho bạn. Quyền điều khiển bị "đảo ngược".

### DI — Tiêm phụ thuộc
Cách hiện thực IoC: Spring tiêm object đã tạo vào nơi cần.

```java
@Service
public class LibraryService {
    private final BookRepository bookRepo;

    // Spring tự tìm bean kiểu BookRepository và truyền vào
    public LibraryService(BookRepository bookRepo) {
        this.bookRepo = bookRepo;
    }
}
```
Đúng cấu trúc bạn đã viết ở Dự án 1 — chỉ khác là **giờ không ai gọi `new` nữa**.

## 2. Bean & ApplicationContext

**Bean** = object do Spring tạo và quản lý. **ApplicationContext** = cái "kho" chứa mọi bean.

### Cách khai báo bean

```java
// 1. Quét annotation (dùng nhiều nhất)
@Component        // bean chung chung
@Service          // tầng nghiệp vụ
@Repository       // tầng dữ liệu (thêm: tự dịch exception của DB)
@Controller       // tầng web
@RestController   // web trả JSON

// 2. Khai báo tường minh — khi tạo bean từ thư viện bên thứ ba
@Configuration
public class AppConfig {
    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper m = new ObjectMapper();
        m.registerModule(new JavaTimeModule());
        return m;
    }
}
```
`@Service`, `@Repository`, `@Controller` **về kỹ thuật đều là `@Component`** — khác nhau ở ý nghĩa (đọc code biết class thuộc tầng nào) và vài xử lý riêng.

## 3. Ba kiểu tiêm phụ thuộc

```java
// ✅ 1. Constructor injection — LUÔN DÙNG CÁCH NÀY
@Service
public class OrderService {
    private final OrderRepository repo;          // final: không thể null, không đổi được
    public OrderService(OrderRepository repo) {  // 1 constructor -> không cần @Autowired
        this.repo = repo;
    }
}

// ⚠ 2. Setter injection — chỉ khi phụ thuộc là tùy chọn
@Autowired public void setRepo(OrderRepository repo) { this.repo = repo; }

// ❌ 3. Field injection — tiện nhưng đừng dùng
@Autowired private OrderRepository repo;
```

Vì sao **constructor injection** là chuẩn?
1. Field `final` → bất biến, an toàn đa luồng.
2. Thiếu phụ thuộc → **lỗi ngay lúc khởi động**, không phải NPE lúc chạy.
3. **Test được** bằng `new OrderService(mockRepo)` mà không cần Spring.
4. Constructor có 6 tham số là tín hiệu class đang làm quá nhiều việc — field injection giấu mất tín hiệu đó.

> Dùng Lombok `@RequiredArgsConstructor` để khỏi viết constructor tay:
> ```java
> @Service
> @RequiredArgsConstructor
> public class OrderService {
>     private final OrderRepository repo;      // Lombok tự sinh constructor
> }
> ```

## 4. Khi có nhiều bean cùng kiểu

```java
public interface PaymentGateway { }

@Component("momo")   class MomoGateway implements PaymentGateway { }
@Component("vnpay")  class VnPayGateway implements PaymentGateway { }
```
Spring sẽ báo lỗi "expected single matching bean but found 2". Ba cách xử lý:

```java
// 1. @Qualifier — chỉ đích danh
public PaymentService(@Qualifier("momo") PaymentGateway gateway) { }

// 2. @Primary — bean mặc định khi không nói rõ
@Component @Primary class MomoGateway implements PaymentGateway { }

// 3. Tiêm TẤT CẢ — cách hay nhất cho mô hình strategy
@Service
public class PaymentService {
    private final Map<String, PaymentGateway> gateways;   // key = tên bean
    public PaymentService(Map<String, PaymentGateway> gateways) { this.gateways = gateways; }
}
```
Cách 3 chính là đoạn code bạn đã viết tay ở [Module 02 — PaymentDemo](../02-oop/src/oop/PaymentDemo.java). Giờ Spring dựng cái `Map` đó tự động: thêm cổng thanh toán mới = thêm một class, không sửa gì khác.

## 5. Scope của bean

| Scope | Ý nghĩa |
|---|---|
| `singleton` (mặc định) | **một** instance dùng chung cho cả ứng dụng |
| `prototype` | tạo mới mỗi lần lấy |
| `request` | một instance mỗi HTTP request |
| `session` | một instance mỗi phiên người dùng |

⚠ **Cực kỳ quan trọng**: bean singleton dùng chung cho **mọi request**, tức là nhiều thread cùng chạy trên cùng một object.

```java
@Service
public class OrderService {
    private List<Order> cache = new ArrayList<>();   // ❌ BUG đa luồng (Module 06)
    private int counter = 0;                         // ❌ race condition

    private final OrderRepository repo;              // ✅ bất biến, an toàn
}
```
Quy tắc: **bean phải không có state thay đổi được**. Cần state chia sẻ thì dùng `ConcurrentHashMap` hoặc đẩy xuống DB/Redis.

## 6. Vòng đời bean

```
Tạo object → tiêm phụ thuộc → @PostConstruct → SỬ DỤNG → @PreDestroy → hủy
```
```java
@Component
public class CacheWarmer {
    @PostConstruct
    public void init() { /* nạp dữ liệu lúc khởi động */ }

    @PreDestroy
    public void cleanup() { /* đóng tài nguyên khi tắt ứng dụng */ }
}
```

## 7. Cấu hình & Profile

```yaml
# application.yml
spring:
  application:
    name: my-app
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: ${DB_USER:postgres}        # lấy từ biến môi trường, mặc định postgres
    password: ${DB_PASSWORD}

app:
  jwt:
    secret: ${JWT_SECRET}
    expiration-minutes: 60
  upload:
    max-size-mb: 10
```

Đọc cấu hình vào code:
```java
// Cách 1: @Value cho một giá trị lẻ
@Value("${app.jwt.expiration-minutes}")
private int expirationMinutes;

// Cách 2: @ConfigurationProperties — gọn và type-safe, ƯU TIÊN
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, int expirationMinutes) { }
```

**Profile** — cấu hình khác nhau theo môi trường:
```
application.yml           # chung
application-dev.yml       # môi trường dev
application-prod.yml      # môi trường production
```
```bash
java -jar app.jar --spring.profiles.active=prod
```
```java
@Bean @Profile("dev")  DataSource h2DataSource() { }
@Bean @Profile("prod") DataSource pgDataSource() { }
```

> **Không bao giờ commit mật khẩu vào `application.yml`.** Dùng biến môi trường (`${DB_PASSWORD}`) hoặc secret manager.

## 8. AOP — lập trình hướng khía cạnh

Vấn đề: logging, đo thời gian, kiểm tra quyền, transaction... rải rác khắp mọi method — gọi là **cross-cutting concern**.

```java
// Không có AOP: lặp lại ở mọi method
public Order createOrder(...) {
    log.info("Bắt đầu createOrder");
    long start = System.currentTimeMillis();
    try {
        // ... logic thật, chỉ 3 dòng ...
    } finally {
        log.info("Xong sau {}ms", System.currentTimeMillis() - start);
    }
}
```

```java
// Có AOP: viết một lần, áp cho mọi service
@Aspect
@Component
public class LoggingAspect {

    @Around("execution(* com.learn..service..*(..))")
    public Object logExecutionTime(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            return pjp.proceed();                       // gọi method gốc
        } finally {
            log.info("{} chạy hết {}ms", pjp.getSignature(), System.currentTimeMillis() - start);
        }
    }
}
```

Các loại advice: `@Before`, `@After`, `@AfterReturning`, `@AfterThrowing`, `@Around`.

**Spring cài AOP bằng proxy**: khi bạn lấy một bean có aspect, thứ bạn nhận được là một object "vỏ bọc". Hệ quả rất quan trọng cần nhớ:

```java
@Service
public class OrderService {
    @Transactional
    public void a() { }

    public void b() {
        a();          // ❌ gọi nội bộ -> KHÔNG đi qua proxy -> @Transactional VÔ HIỆU
    }
}
```
Đây là bẫy kinh điển. `@Transactional`, `@Cacheable`, `@Async` đều **không hoạt động khi gọi method của chính class đó**. Cách xử lý: tách sang class khác, hoặc tự tiêm chính mình (xấu), hoặc dùng `TransactionTemplate`.

## 9. Spring Boot làm gì thêm?

Spring "trần" cần cấu hình rất nhiều XML/Java config. Spring Boot thêm:
1. **Auto-configuration**: thấy `spring-boot-starter-data-jpa` trong classpath → tự cấu hình DataSource, EntityManager, TransactionManager.
2. **Starter dependencies**: một dependency kéo theo cả bộ tương thích nhau.
3. **Server nhúng**: Tomcat nằm ngay trong jar, chạy `java -jar` là xong.
4. **Actuator**: endpoint health/metrics sẵn có.

```java
@SpringBootApplication      // = @Configuration + @EnableAutoConfiguration + @ComponentScan
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```
`@ComponentScan` quét package chứa class này **và mọi package con** — nên `Application` phải nằm ở package gốc.

## 10. Tạo dự án Spring Boot đầu tiên

Vào https://start.spring.io:
- Project: **Maven**, Language: **Java**, Spring Boot: **3.3.x**
- Java: **21**
- Dependencies: `Spring Web`, `Spring Boot DevTools`, `Lombok`

```bash
./mvnw spring-boot:run          # chạy
curl http://localhost:8080/hello
```

```java
@RestController
public class HelloController {
    @GetMapping("/hello")
    public String hello(@RequestParam(defaultValue = "bạn") String name) {
        return "Xin chào " + name + "!";
    }
}
```
Ba dòng thay cho toàn bộ cấu hình servlet, JSON converter, HTTP server — đó là giá trị của Spring Boot.

---

## Tổng kết
- IoC/DI: bạn khai báo, Spring lắp ráp.
- **Luôn dùng constructor injection**, field `final`.
- Nhiều bean cùng kiểu: `@Qualifier` / `@Primary` / tiêm cả `Map`.
- Bean singleton → **không được có state thay đổi được**.
- Cấu hình bằng `@ConfigurationProperties` + profile; secret nằm ở biến môi trường.
- AOP dùng proxy → gọi method nội bộ thì annotation vô hiệu.


## 💻 Code ví dụ chạy được

Module này có code chạy thật trong [../spring-playground/](../spring-playground/) — package `m10core`:

```bash
cd spring-playground && mvn spring-boot:run     # rồi mở http://localhost:8080/
```
Nội dung: DI, @Qualifier, Map strategy, bean singleton có state, @ConfigurationProperties, AOP, bẫy proxy.
Endpoint: `/m10/di, /m10/strategy, /m10/singleton-bug, /m10/config, /m10/aop, /m10/self-invocation`.

> Vừa gọi API vừa **đọc console** — một nửa bài học nằm ở log SQL và log aspect.

## Bài tập
👉 [bai-tap.md](bai-tap.md), sau đó sang [Module 11 — Spring Boot REST API](../11-spring-boot-rest/).
