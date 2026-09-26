# Module 02 — Lập trình hướng đối tượng (OOP)

> Mục tiêu: thiết kế được class/interface hợp lý, hiểu 4 tính chất OOP không phải để trả bài mà để dùng.
> Thời lượng: 2 tuần. **Đây là module quan trọng nhất trước khi học Spring** — Spring chính là OOP + DI.

---

## 1. Class và Object

- **Class** = bản thiết kế (bản vẽ ngôi nhà).
- **Object** = thực thể được tạo ra từ bản thiết kế (ngôi nhà cụ thể).

```java
public class Student {
    // 1. Field (thuộc tính) — trạng thái
    private String name;
    private int age;
    private double gpa;

    // 2. Constructor — cách khởi tạo
    public Student(String name, int age) {
        this.name = name;      // this = object hiện tại, phân biệt với tham số cùng tên
        this.age = age;
    }

    // 3. Method (hành vi)
    public boolean isPassed() {
        return gpa >= 5.0;
    }

    // 4. Getter/Setter — cổng ra vào có kiểm soát
    public String getName() { return name; }
    public void setGpa(double gpa) {
        if (gpa < 0 || gpa > 10) throw new IllegalArgumentException("GPA phải 0..10");
        this.gpa = gpa;
    }
}

// Sử dụng
Student s = new Student("An", 20);
s.setGpa(8.5);
System.out.println(s.isPassed());
```

### `new` làm gì?
1. Cấp phát bộ nhớ trên **heap**.
2. Gán giá trị mặc định cho field (`0`, `null`, `false`).
3. Chạy constructor.
4. Trả về **tham chiếu** tới object đó, gán vào biến trên **stack**.

```
stack                heap
┌─────────┐        ┌──────────────────┐
│ s ──────┼───────►│ Student          │
└─────────┘        │  name = "An"     │
                   │  age  = 20       │
                   └──────────────────┘
```

### Constructor
```java
public class Product {
    private String name;
    private double price;
    private int qty;

    public Product() {                      // constructor mặc định
        this("Chưa đặt tên", 0, 0);         // gọi constructor khác — phải là dòng đầu tiên
    }
    public Product(String name, double price) {
        this(name, price, 0);
    }
    public Product(String name, double price, int qty) {
        this.name = name; this.price = price; this.qty = qty;
    }
}
```
> Nếu bạn **không viết** constructor nào, Java tự thêm constructor rỗng. Nhưng khi bạn đã viết một constructor có tham số, constructor rỗng **không còn tự sinh nữa** — đây là lỗi hay gặp khi dùng JPA/Jackson (chúng cần constructor rỗng).

## 2. Bốn tính chất OOP

### 2.1 Đóng gói (Encapsulation)
Che giấu dữ liệu bên trong, chỉ cho truy cập qua method có kiểm soát.

```java
// ❌ Xấu — ai cũng sửa được, không kiểm soát
public class Account { public double balance; }
acc.balance = -5000;    // vô lý nhưng không ai cản

// ✅ Tốt
public class Account {
    private long balance;

    public void deposit(long amount) {
        if (amount <= 0) throw new IllegalArgumentException("Số tiền phải > 0");
        balance += amount;
    }
    public void withdraw(long amount) {
        if (amount > balance) throw new IllegalStateException("Không đủ số dư");
        balance -= amount;
    }
    public long getBalance() { return balance; }
}
```
**Lợi ích thật sự**: bạn đổi cách lưu trữ bên trong (từ `long` sang `BigDecimal`, hay lưu xuống DB) mà code bên ngoài không phải sửa gì.

#### Phạm vi truy cập (access modifier)

| Modifier | Trong class | Cùng package | Class con khác package | Mọi nơi |
|---|:--:|:--:|:--:|:--:|
| `private` | ✅ | ❌ | ❌ | ❌ |
| (mặc định) | ✅ | ✅ | ❌ | ❌ |
| `protected` | ✅ | ✅ | ✅ | ❌ |
| `public` | ✅ | ✅ | ✅ | ✅ |

Quy tắc thực chiến: **field luôn `private`**, method `public` khi là API cho bên ngoài, còn lại `private`.

### 2.2 Kế thừa (Inheritance)
```java
public class Animal {
    protected String name;
    public Animal(String name) { this.name = name; }
    public void eat() { System.out.println(name + " đang ăn"); }
}

public class Dog extends Animal {
    public Dog(String name) {
        super(name);           // gọi constructor cha — phải là dòng đầu tiên
    }
    public void bark() { System.out.println(name + ": Gâu!"); }
}
```
- Java **chỉ cho kế thừa 1 class** (đơn kế thừa), nhưng implement được nhiều interface.
- Mọi class đều ngầm kế thừa `Object`.
- `final class` → không cho kế thừa (ví dụ `String`).

> **Nguyên tắc quan trọng: ưu tiên composition hơn inheritance.**
> Chỉ kế thừa khi quan hệ thật sự là "**là một**" (Dog *là một* Animal). Nếu là "**có một**" thì dùng thành phần:
> ```java
> // ❌ class Car extends Engine       — xe KHÔNG PHẢI là động cơ
> // ✅
> class Car { private Engine engine; }  // xe CÓ một động cơ
> ```
> Kế thừa sai gây ràng buộc chặt: sửa class cha làm vỡ hàng loạt class con.

### 2.3 Đa hình (Polymorphism)
Cùng một lời gọi, hành vi khác nhau tùy object thực tế.

```java
public class Animal { public void speak() { System.out.println("..."); } }
public class Dog extends Animal {
    @Override public void speak() { System.out.println("Gâu"); }
}
public class Cat extends Animal {
    @Override public void speak() { System.out.println("Meo"); }
}

List<Animal> animals = List.of(new Dog(), new Cat());
for (Animal a : animals) {
    a.speak();     // Gâu, Meo — JVM quyết định lúc chạy (dynamic dispatch)
}
```

**Overriding vs Overloading** (câu hỏi phỏng vấn ruột):

| | Overriding (ghi đè) | Overloading (nạp chồng) |
|---|---|---|
| Ở đâu | Class con ghi đè class cha | Cùng một class |
| Chữ ký | **Phải giống hệt** | Phải khác tham số |
| Quyết định lúc nào | Runtime | Compile time |
| Annotation | `@Override` | không có |

> Luôn viết `@Override`. Nó không bắt buộc, nhưng nếu bạn gõ sai tên method thì compiler báo lỗi ngay thay vì để bug âm thầm.

### 2.4 Trừu tượng (Abstraction)
Che giấu chi tiết cài đặt, chỉ lộ ra "làm được gì".

```java
public abstract class PaymentMethod {
    public abstract void pay(long amount);       // không có thân — con bắt buộc cài

    public void logTransaction(long amount) {    // có thân — con dùng chung
        System.out.println("Đã ghi log: " + amount);
    }
}

public class MomoPayment extends PaymentMethod {
    @Override public void pay(long amount) { System.out.println("Trả " + amount + " qua Momo"); }
}
```
`abstract class` không tạo object trực tiếp được: `new PaymentMethod()` → lỗi biên dịch.

## 3. Interface — xương sống của code Java hiện đại

```java
public interface Notifier {
    void send(String to, String message);        // mặc định public abstract

    default void sendBulk(List<String> tos, String msg) {   // Java 8+: có thân
        tos.forEach(to -> send(to, msg));
    }
    static Notifier noop() { return (to, msg) -> {}; }       // static method
}

public class EmailNotifier implements Notifier {
    @Override public void send(String to, String msg) { /* gửi email */ }
}
public class SmsNotifier implements Notifier {
    @Override public void send(String to, String msg) { /* gửi SMS */ }
}
```

### Vì sao interface quan trọng đến vậy?
Vì nó cho phép **code phụ thuộc vào abstraction thay vì implementation** — nền tảng của Dependency Injection trong Spring.

```java
public class OrderService {
    private final Notifier notifier;                 // phụ thuộc interface

    public OrderService(Notifier notifier) {         // tiêm từ ngoài vào
        this.notifier = notifier;
    }
    public void placeOrder(Order o) {
        // ... xử lý ...
        notifier.send(o.getCustomerEmail(), "Đơn hàng đã được tạo");
    }
}

// Production
new OrderService(new EmailNotifier());
// Test — không cần gửi email thật
new OrderService((to, msg) -> System.out.println("FAKE: " + msg));
```
Không có interface, `OrderService` sẽ `new EmailNotifier()` bên trong → không test được, không đổi được sang SMS. Toàn bộ Spring xoay quanh ý tưởng này.

### `interface` vs `abstract class`

| | interface | abstract class |
|---|---|---|
| Kế thừa nhiều | ✅ implements nhiều | ❌ chỉ 1 |
| Field | chỉ `public static final` | field bình thường |
| Constructor | ❌ | ✅ |
| Method có thân | `default`/`static`/`private` (Java 8+) | ✅ tự do |
| Ý nghĩa | "**có khả năng**" (Comparable, Runnable) | "**là một loại**" có code dùng chung |

Thực chiến: **mặc định chọn interface**, chỉ dùng abstract class khi cần chia sẻ state/code giữa các class con thật sự cùng loại.

## 4. Những thành viên đặc biệt của `Object`

Mọi class đều kế thừa `Object` với các method: `toString()`, `equals()`, `hashCode()`, `getClass()`.

```java
public class Point {
    private final int x, y;
    public Point(int x, int y) { this.x = x; this.y = y; }

    @Override
    public String toString() { return "Point(" + x + ", " + y + ")"; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Point p = (Point) o;
        return x == p.x && y == p.y;
    }

    @Override
    public int hashCode() { return Objects.hash(x, y); }
}
```

**Hợp đồng bắt buộc**: hai object `equals()` nhau thì **phải** có `hashCode()` giống nhau. Vi phạm điều này thì `HashMap`/`HashSet` sẽ hoạt động sai (chi tiết ở Module 03 — sẽ có demo mất dữ liệu trong `HashSet`).

Mẹo: IntelliJ `Alt+Insert` → `equals() and hashCode()` để sinh tự động. Nhưng phải hiểu nó sinh cái gì.

## 5. `static` — thuộc về class, không thuộc object

```java
public class Counter {
    private static int total = 0;       // dùng chung cho MỌI object
    private int id;                     // riêng của từng object

    public Counter() { total++; id = total; }

    public static int getTotal() { return total; }   // gọi: Counter.getTotal()
}
```
Quy tắc: method `static` **không truy cập được** field/method non-static (vì lúc đó chưa chắc có object nào).

Dùng `static` cho: hằng số, utility method (`Math.max`), factory method. **Tránh** dùng static để giữ state có thể thay đổi — gây khó test và không an toàn khi đa luồng.

Khối khởi tạo:
```java
static { /* chạy 1 lần khi class được nạp */ }
{ /* chạy mỗi lần tạo object, trước constructor */ }
```

## 6. Cú pháp hiện đại: record, enum, sealed

### 6.1 `record` (Java 16+) — class chỉ để chứa dữ liệu
```java
public record Money(String currency, BigDecimal amount) { }
```
Một dòng này tự sinh: constructor, getter (`money.amount()`), `equals`, `hashCode`, `toString`, và tất cả field đều `final`.

Thêm validate:
```java
public record Money(String currency, BigDecimal amount) {
    public Money {                                       // compact constructor
        if (amount.signum() < 0) throw new IllegalArgumentException("Số tiền âm");
    }
    public Money plus(Money other) {                     // vẫn thêm method được
        return new Money(currency, amount.add(other.amount));
    }
}
```
Dùng record cho: **DTO, request/response API, value object, kết quả trả về**. Không dùng cho JPA Entity (entity cần mutable + constructor rỗng).

### 6.2 `enum` — tập giá trị cố định
```java
public enum OrderStatus {
    PENDING("Chờ xử lý"),
    SHIPPED("Đang giao"),
    DELIVERED("Đã giao"),
    CANCELLED("Đã hủy");

    private final String label;
    OrderStatus(String label) { this.label = label; }
    public String getLabel() { return label; }

    public boolean canCancel() { return this == PENDING || this == SHIPPED; }
}

OrderStatus s = OrderStatus.PENDING;
switch (s) {
    case PENDING -> System.out.println("Chờ");
    case SHIPPED, DELIVERED -> System.out.println("Đã xử lý");
    case CANCELLED -> System.out.println("Hủy");
}
```
**Luôn dùng enum thay cho "magic string"** (`if (status.equals("PENDING"))`) — compiler bắt lỗi cho bạn, và IDE gợi ý được.

### 6.3 `sealed` (Java 17+) — giới hạn ai được kế thừa
```java
public sealed interface Shape permits Circle, Rectangle { }
public record Circle(double r) implements Shape { }
public record Rectangle(double w, double h) implements Shape { }

double area = switch (shape) {                 // không cần default!
    case Circle c -> Math.PI * c.r() * c.r();
    case Rectangle r -> r.w() * r.h();
};
```
Compiler biết chắc chỉ có 2 khả năng nên kiểm tra được tính đầy đủ. Rất hợp cho mô hình hóa trạng thái/kết quả.

## 7. Nguyên tắc thiết kế SOLID (mức nhập môn)

| Chữ | Nguyên tắc | Nghĩa thực dụng |
|---|---|---|
| **S** | Single Responsibility | Mỗi class một lý do để thay đổi. `UserService` đừng vừa lưu DB vừa gửi mail vừa xuất PDF. |
| **O** | Open/Closed | Mở để mở rộng, đóng để sửa. Thêm loại thanh toán mới = thêm class, không sửa `switch` cũ. |
| **L** | Liskov Substitution | Class con phải thay thế được class cha mà không gây bất ngờ. `Square extends Rectangle` là ví dụ vi phạm kinh điển. |
| **I** | Interface Segregation | Nhiều interface nhỏ hơn một interface khổng lồ. |
| **D** | Dependency Inversion | Phụ thuộc vào interface, không phụ thuộc class cụ thể. → chính là DI của Spring. |

Ví dụ áp dụng O + D:
```java
// ❌ Thêm phương thức thanh toán mới là phải sửa class này
class PaymentService {
    void pay(String type, long amount) {
        if (type.equals("MOMO")) { }
        else if (type.equals("VNPAY")) { }
    }
}

// ✅ Thêm loại mới = thêm 1 class, không đụng code cũ
interface PaymentGateway { void pay(long amount); }
class MomoGateway implements PaymentGateway { public void pay(long a) { } }
class VnPayGateway implements PaymentGateway { public void pay(long a) { } }

class PaymentService {
    private final Map<String, PaymentGateway> gateways;
    PaymentService(Map<String, PaymentGateway> gateways) { this.gateways = gateways; }
    void pay(String type, long amount) {
        PaymentGateway g = gateways.get(type);
        if (g == null) throw new IllegalArgumentException("Không hỗ trợ: " + type);
        g.pay(amount);
    }
}
```
Ghi nhớ đoạn code này — Spring sẽ tự tiêm cái `Map` đó cho bạn.

## 8. Phân tầng ứng dụng (chuẩn công nghiệp)

Ngay từ bài tập console, hãy tổ chức code theo tầng:

```
model/       Student, Order        — dữ liệu thuần
repository/  StudentRepository     — lưu/đọc dữ liệu (file, DB)
service/     StudentService        — nghiệp vụ, validate
controller/  StudentController     — nhận input (console hoặc HTTP)
```
Quy tắc phụ thuộc **một chiều**: controller → service → repository → model. Không được ngược lại.

Vì sao? Đổi từ lưu file sang lưu PostgreSQL chỉ cần viết `repository` mới; `service` không đổi một dòng. Dự án 1 sẽ áp dụng đúng cấu trúc này.

---

## Tổng kết
- Encapsulation: field `private` + method có kiểm soát.
- Inheritance chỉ khi "là một"; còn lại dùng composition.
- Polymorphism + interface = nền móng của Spring DI.
- `equals`/`hashCode` phải đi đôi.
- `record` cho DTO, `enum` thay magic string, `sealed` cho tập trạng thái đóng.
- Code luôn phân tầng.

## Code trong module
- [src/oop/BankAccount.java](src/oop/BankAccount.java) — đóng gói + validate
- [src/oop/Shapes.java](src/oop/Shapes.java) — abstract, đa hình, sealed + record
- [src/oop/PaymentDemo.java](src/oop/PaymentDemo.java) — interface + DI thủ công (mô phỏng Spring)
- [src/oop/EqualsDemo.java](src/oop/EqualsDemo.java) — equals/hashCode và hậu quả khi làm sai

```bash
javac -d out $(find 02-oop/src -name "*.java") && java -cp out oop.PaymentDemo
```

👉 Làm [bai-tap.md](bai-tap.md) và [luyen-tay.md](luyen-tay.md) rồi sang [Module 03 — Collections & Generics](../03-collections-generics/).
