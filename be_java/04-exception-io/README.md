# Module 04 — Exception & I/O

> Mục tiêu: xử lý lỗi đúng cách (không nuốt lỗi, không lạm dụng try-catch), đọc/ghi file, làm việc với JSON.
> Thời lượng: 1 tuần.

---

## Phần 1 — Exception

### 1.1 Cây phân cấp

```
Throwable
├── Error                       ❌ KHÔNG bắt: lỗi JVM (OutOfMemoryError, StackOverflowError)
└── Exception
    ├── RuntimeException        → unchecked: lỗi lập trình
    │   ├── NullPointerException
    │   ├── IllegalArgumentException
    │   ├── IllegalStateException
    │   ├── ArithmeticException
    │   ├── IndexOutOfBoundsException
    │   └── ClassCastException
    └── IOException, SQLException…  → checked: compiler bắt buộc xử lý
```

**Checked** (`IOException`, `SQLException`): compiler ép bạn `try-catch` hoặc `throws`. Ý tưởng: đây là sự cố ngoài tầm kiểm soát (mất mạng, file không tồn tại) mà chương trình *nên* dự liệu.

**Unchecked** (`RuntimeException`): compiler không ép. Thường là **lỗi lập trình** — sửa code chứ không phải bắt lỗi.

> Xu hướng hiện đại (Spring cũng theo): **ưu tiên unchecked exception**. Checked exception làm bẩn chữ ký hàm và khiến người ta viết `catch (Exception e) {}` cho xong — tệ hơn nhiều.

### 1.2 Cú pháp

```java
try {
    int result = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("Chia cho 0: " + e.getMessage());
} catch (IllegalArgumentException | IllegalStateException e) {   // gộp nhiều loại
    System.out.println("Lỗi tham số hoặc trạng thái");
} catch (Exception e) {                     // luôn để cuối, từ cụ thể -> tổng quát
    System.out.println("Lỗi khác");
} finally {
    System.out.println("Luôn chạy: dọn dẹp tài nguyên");
}
```

`finally` chạy kể cả khi có `return` trong `try`. Chỉ không chạy khi JVM tắt (`System.exit`).

> **Cạm bẫy #1 — `return` trong `finally`**: nó *nuốt* mất exception và ghi đè giá trị trả về. Đừng bao giờ `return` trong `finally`.

### 1.3 try-with-resources (luôn dùng khi có tài nguyên)

```java
// ❌ Cũ, dài dòng, dễ quên đóng
BufferedReader br = null;
try { br = new BufferedReader(new FileReader("a.txt")); }
finally { if (br != null) br.close(); }

// ✅ Tự động đóng, đúng thứ tự ngược, kể cả khi có exception
try (BufferedReader br = new BufferedReader(new FileReader("a.txt"))) {
    System.out.println(br.readLine());
} catch (IOException e) {
    ...
}
```
Áp dụng cho mọi thứ implement `AutoCloseable`: file, socket, `Connection`/`Statement`/`ResultSet` của JDBC (module 08).

### 1.4 Ném và tự định nghĩa exception

```java
public void withdraw(long amount) {
    if (amount <= 0) throw new IllegalArgumentException("Số tiền phải > 0");
    if (amount > balance) throw new InsufficientFundsException(balance, amount);
}

// Exception nghiệp vụ của riêng bạn — nên kế thừa RuntimeException
public class InsufficientFundsException extends RuntimeException {
    private final long balance, requested;

    public InsufficientFundsException(long balance, long requested) {
        super("Không đủ số dư: có %d, cần %d".formatted(balance, requested));
        this.balance = balance;
        this.requested = requested;
    }
    public long getBalance() { return balance; }
    public long getRequested() { return requested; }
}
```
Mang theo **dữ liệu ngữ cảnh** (số dư, id, mã lỗi) chứ không chỉ một chuỗi — tầng trên sẽ dùng chúng để dựng response API (module 11).

### 1.5 Bọc lỗi, giữ nguyên nguyên nhân

```java
try {
    repository.save(user);
} catch (SQLException e) {
    throw new DataAccessException("Không lưu được user " + user.getId(), e);   // ✅ truyền e
}
```
Luôn truyền exception gốc vào constructor (`cause`) — nếu không bạn mất sạch stacktrace gốc và sẽ debug trong bóng tối.

### 1.6 Bảy điều nên/không nên

| ❌ Không nên | ✅ Nên |
|---|---|
| `catch (Exception e) { }` nuốt lỗi | Log kèm ngữ cảnh, hoặc ném tiếp |
| `e.printStackTrace()` trong production | Dùng logger: `log.error("msg", e)` |
| Bắt `Throwable`/`Error` | Để JVM xử lý |
| Dùng exception cho luồng chạy bình thường | Dùng `if` / `Optional` |
| Ném `Exception` chung chung | Ném loại cụ thể, có nghĩa |
| Nuốt `InterruptedException` | `Thread.currentThread().interrupt()` rồi ném tiếp |
| Bắt lỗi rồi trả `null` | Ném exception hoặc trả `Optional` |

```java
// ❌ Dùng exception làm luồng điều khiển — chậm và khó đọc
try { return Integer.parseInt(s); } catch (NumberFormatException e) { return 0; }

// ✅ Kiểm tra trước
if (s != null && s.matches("-?\\d+")) return Integer.parseInt(s);
return 0;
```

### 1.7 Đọc stacktrace
```
Exception in thread "main" java.lang.NullPointerException:
        Cannot invoke "String.length()" because "name" is null
    at com.learn.UserService.validate(UserService.java:25)   ← code của BẠN, sửa ở đây
    at com.learn.UserService.register(UserService.java:14)
    at com.learn.Main.main(Main.java:8)
Caused by: java.sql.SQLException: connection refused                ← nguyên nhân gốc
    at ...
```
Quy trình: (1) đọc loại lỗi + message, (2) tìm dòng `at` đầu tiên thuộc package của bạn, (3) nếu có `Caused by` thì **nguyên nhân thật nằm ở dưới cùng**.

Java 14+ có "Helpful NullPointerException" chỉ đích danh biến nào null — đọc kỹ message.

### 1.8 Optional — tránh NPE từ gốc

```java
public Optional<User> findByEmail(String email) { ... }

// Sử dụng
Optional<User> opt = repo.findByEmail("a@b.com");
opt.ifPresent(u -> System.out.println(u.getName()));
User u = opt.orElse(User.guest());
User u2 = opt.orElseGet(() -> createNewUser(email));    // chỉ chạy khi rỗng
User u3 = opt.orElseThrow(() -> new UserNotFoundException(email));
String name = opt.map(User::getName).orElse("Khách");
```

Quy tắc dùng `Optional`:
- ✅ Làm **kiểu trả về** của method có thể "không tìm thấy".
- ❌ Không dùng làm tham số, không làm field entity.
- ❌ Không bao giờ gọi `opt.get()` mà chưa kiểm tra — dùng `orElseThrow()`.

## Phần 2 — I/O

### 2.1 Đọc/ghi file với NIO (java.nio.file — cách hiện đại, ưu tiên dùng)

```java
Path path = Path.of("data", "users.txt");

// Đọc toàn bộ (file nhỏ)
String content = Files.readString(path);
List<String> lines = Files.readAllLines(path);

// Ghi
Files.writeString(path, "nội dung");
Files.write(path, lines);
Files.writeString(path, "thêm dòng\n", StandardOpenOption.CREATE, StandardOpenOption.APPEND);

// Thao tác file/thư mục
Files.exists(path);
Files.createDirectories(Path.of("data/backup"));
Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING);
Files.move(src, dest);
Files.delete(path);              // ném exception nếu không tồn tại
Files.deleteIfExists(path);
Files.size(path);
```

### 2.2 File lớn — đọc theo dòng, không nạp hết vào RAM

```java
// ✅ Stream: chỉ giữ 1 dòng trong bộ nhớ tại một thời điểm
try (Stream<String> lines = Files.lines(path)) {
    long errors = lines.filter(l -> l.contains("ERROR")).count();
}

// hoặc BufferedReader
try (BufferedReader br = Files.newBufferedReader(path)) {
    String line;
    while ((line = br.readLine()) != null) { process(line); }
}
```
> **Cạm bẫy #2**: `Files.readAllLines()` với file 2GB → `OutOfMemoryError`. File lớn thì luôn đọc theo dòng/stream.

### 2.3 Encoding — nguyên nhân lỗi tiếng Việt
Từ Java 18, UTF-8 là mặc định. Với Java cũ hơn hoặc để chắc chắn, hãy **luôn ghi rõ**:
```java
Files.readString(path, StandardCharsets.UTF_8);
Files.writeString(path, s, StandardCharsets.UTF_8);
new InputStreamReader(in, StandardCharsets.UTF_8);
```

### 2.4 Byte stream vs Character stream

| | Byte (nhị phân) | Character (văn bản) |
|---|---|---|
| Class | `InputStream` / `OutputStream` | `Reader` / `Writer` |
| Dùng cho | ảnh, pdf, zip | txt, csv, json |
| Ví dụ | `FileInputStream` | `FileReader`, `BufferedReader` |

Luôn bọc bằng `Buffered*` khi đọc nhiều lần — giảm số lần gọi hệ điều hành, nhanh hơn hàng chục lần.

### 2.5 Serialization
Java có `Serializable` tích hợp, nhưng **thực tế backend gần như không dùng** (khó tương thích ngược, có lỗ hổng bảo mật). Thay vào đó dùng **JSON**.

### 2.6 JSON với Jackson

Đây là thư viện chuẩn của Spring Boot, học luôn từ bây giờ.
```xml
<dependency>
  <groupId>com.fasterxml.jackson.core</groupId>
  <artifactId>jackson-databind</artifactId>
  <version>2.17.2</version>
</dependency>
```

```java
ObjectMapper mapper = new ObjectMapper();
mapper.registerModule(new JavaTimeModule());              // hỗ trợ LocalDate/LocalDateTime
mapper.enable(SerializationFeature.INDENT_OUTPUT);

// Object -> JSON
String json = mapper.writeValueAsString(user);
mapper.writeValue(new File("user.json"), user);

// JSON -> Object
User u = mapper.readValue(json, User.class);
List<User> users = mapper.readValue(json, new TypeReference<List<User>>() {});
```

Các annotation hay dùng:
```java
public class User {
    @JsonProperty("full_name") private String fullName;   // đổi tên field khi ra JSON
    @JsonIgnore private String password;                   // không xuất ra JSON
    @JsonFormat(pattern = "dd/MM/yyyy") private LocalDate birthday;
    @JsonInclude(JsonInclude.Include.NON_NULL) private String phone;   // null thì bỏ qua
}
```

### 2.7 Ngày giờ (java.time — Java 8+)

Quên `Date` và `Calendar` cũ đi, chúng mutable và thiết kế tệ.

```java
LocalDate today = LocalDate.now();                 // 2026-08-24 (không có giờ)
LocalTime time = LocalTime.of(14, 30);             // 14:30 (không có ngày)
LocalDateTime dt = LocalDateTime.now();            // cả hai, không timezone
Instant now = Instant.now();                       // mốc thời gian UTC — dùng lưu DB
ZonedDateTime z = ZonedDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));

today.plusDays(7); today.minusMonths(1);
today.isBefore(other); today.isAfter(other);
Period.between(birthday, today).getYears();        // tuổi
Duration.between(start, end).toMinutes();          // khoảng thời gian

DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
String s = dt.format(fmt);
LocalDateTime parsed = LocalDateTime.parse("24/08/2026 14:30", fmt);
```
Quy tắc backend: **lưu `Instant`/UTC trong DB, đổi sang giờ địa phương khi hiển thị.**

---

## Tổng kết
- Checked vs unchecked; nghiệp vụ → dùng `RuntimeException` tự định nghĩa mang theo ngữ cảnh.
- Không nuốt lỗi, luôn giữ `cause`.
- `try-with-resources` cho mọi tài nguyên.
- `Optional` cho kết quả "có thể không có".
- NIO (`Files`, `Path`) cho file; file lớn đọc theo stream; luôn UTF-8.
- Jackson cho JSON, `java.time` cho ngày giờ.

## Code trong module
- [src/io/ExceptionDemo.java](src/io/ExceptionDemo.java) — các kiểu lỗi, custom exception, wrap cause
- [src/io/OptionalDemo.java](src/io/OptionalDemo.java) — dùng Optional đúng cách
- [src/io/FileDemo.java](src/io/FileDemo.java) — đọc/ghi file, CSV, đọc file lớn
- [src/io/DateTimeDemo.java](src/io/DateTimeDemo.java) — java.time

👉 Làm [bai-tap.md](bai-tap.md) rồi sang [Module 05 — Functional & Stream](../05-functional-stream/).
