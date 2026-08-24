# Demo project — Maven + JUnit 5 + Mockito + AssertJ

Dự án Maven nhỏ để bạn chạy thử bộ công cụ test trước khi làm Dự án 1.

## Chạy

```bash
cd 09-maven-git-testing/demo-project
mvn test                     # chạy toàn bộ test
mvn test -Dtest=CalculatorTest       # chạy 1 class
mvn test jacoco:report               # sinh báo cáo độ phủ
# mở target/site/jacoco/index.html
```

> Máy chưa có Maven? Tải tại https://maven.apache.org/download.cgi, hoặc mở thư mục này bằng IntelliJ —
> IDE có sẵn Maven và chạy test bằng nút ▶ bên cạnh mỗi method.

## Nội dung

| File | Minh họa |
|---|---|
| `Calculator` + `CalculatorTest` | `@Test`, `@BeforeEach`, `@ParameterizedTest`, `@Nested`, test ca biên |
| `OrderService` + `OrderServiceTest` | `@Mock`, `@InjectMocks`, `given/willReturn`, `verify`, `ArgumentCaptor` |
| `pom.xml` | dependency scope `test`, surefire, jacoco |

## Điểm cần chú ý khi đọc code

1. `OrderService` nhận `OrderRepository` và `PaymentGateway` **qua constructor** — nhờ vậy test thay được bằng mock. Nếu service tự `new` chúng bên trong thì không test được.
2. Mỗi test theo cấu trúc **Given – When – Then**.
3. Tên test đọc như một câu: `placeOrder_thanhToanThatBai_nemException`.
4. Có test cho cả **luồng lỗi** và **ca biên**, không chỉ luồng thành công.
5. `verify(repository, never()).save(any())` — kiểm chứng điều **không được xảy ra** cũng quan trọng như điều xảy ra.
