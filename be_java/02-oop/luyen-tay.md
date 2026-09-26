# Luyện tay Module 02 — 30 bài nhỏ về OOP

> Bài nhỏ 10–20 phút, bổ sung cho [bai-tap.md](bai-tap.md). Mục tiêu: thiết kế class **đúng phản xạ** — field private, validate trong constructor, đúng quan hệ giữa các class.
> ⭐ dễ · ⭐⭐ vừa · ⭐⭐⭐ khó.

## Phần 1 — Đọc code, đoán kết quả

```java
// 1.1
class A { String name() { return "A"; } void hi() { System.out.println("Hi " + name()); } }
class B extends A { @Override String name() { return "B"; } }
A obj = new B();
obj.hi();

// 1.2
class P { static String who() { return "P"; } }
class C extends P { static String who() { return "C"; } }
P p = new C();
System.out.println(p.who());

// 1.3
class Counter { static int total = 0; int mine = 0; Counter() { total++; mine++; } }
Counter c1 = new Counter(), c2 = new Counter(), c3 = new Counter();
System.out.println(Counter.total + " " + c3.mine);

// 1.4
class Parent { Parent() { System.out.print("P "); init(); } void init() { System.out.print("Pinit "); } }
class Child extends Parent {
    String value = "set";
    Child() { System.out.print("C "); }
    @Override void init() { System.out.print("Cinit(" + value + ") "); }
}
new Child();

// 1.5
record Point(int x, int y) { }
Point a = new Point(1, 2), b = new Point(1, 2);
System.out.println((a == b) + " " + a.equals(b) + " " + a);

// 1.6
class Box { int v; Box(int v) { this.v = v; } }
void change(Box box) { box.v = 10; box = new Box(20); box.v = 30; }
Box bx = new Box(1);
change(bx);
System.out.println(bx.v);

// 1.7
enum Level { LOW, MEDIUM, HIGH }
System.out.println(Level.valueOf("HIGH").ordinal() + " " + Level.values().length + " " + Level.MEDIUM.compareTo(Level.HIGH));

// 1.8
interface Greeter { default String greet() { return "Hello"; } }
class Vn implements Greeter { public String greet() { return "Xin chào, " + Greeter.super.greet(); } }
System.out.println(new Vn().greet());
```

## Phần 2 — Đóng gói

**2.1** ⭐ `Temperature` lưu độ C (private); có `getFahrenheit()`, `setFahrenheit(double)`; không cho nhiệt độ dưới -273.15.

**2.2** ⭐ `Product(sku, name, price)` bất biến: mọi field `final`, không có setter, `withPrice(long)` trả về **object mới**.

**2.3** ⭐⭐ `Password` bọc chuỗi mật khẩu: `toString()` trả `"******"`, có `matches(String raw)`. Vì sao không có `getValue()`?

**2.4** ⭐⭐ `Cart` giữ `List<CartItem>` private. `getItems()` phải trả về bản **không sửa được** — chứng minh bằng code rằng người gọi không thể `add` thêm vào giỏ qua getter.

**2.5** ⭐⭐ `DateRange(start, end)`: constructor ném exception nếu `end` trước `start`; có `contains(LocalDate)`, `overlaps(DateRange)`, `days()`. Dùng để kiểm tra đặt phòng khách sạn có trùng lịch không.

**2.6** ⭐⭐ `Money(long amount, String currency)`: `plus`, `minus` (không cho âm), `multiply(int)`, `equals/hashCode`. Cộng hai loại tiền khác nhau thì ném exception.

## Phần 3 — Kế thừa và đa hình

**3.1** ⭐ `Animal` → `Dog`, `Cat`, `Duck` với `sound()`. Duyệt `List<Animal>` gọi `sound()`. Thêm `Cow` mà không sửa vòng lặp.

**3.2** ⭐ `Vehicle(plate, brand)` → `Car(seats)`, `Truck(maxLoadKg)`. Dùng `super(...)` trong constructor, override `toString()` gọi `super.toString()`.

**3.3** ⭐⭐ Tính lương: `Employee` abstract với `abstract long salary()`; `FullTime(baseSalary)`, `PartTime(hours, rate)`, `Intern(allowance)`, `Manager extends FullTime` (thêm phụ cấp 20%). In bảng lương và tổng quỹ lương.

**3.4** ⭐⭐ Ví dụ vi phạm Liskov: `Square extends Rectangle`. Viết code cho thấy `setWidth` làm hỏng giả định của người dùng `Rectangle`. Đề xuất thiết kế đúng.

**3.5** ⭐⭐ Viết lại bài 3.3 **không dùng kế thừa**: `Employee` có một field `SalaryPolicy` (interface). So sánh hai cách khi cần đổi một thực tập sinh thành nhân viên chính thức.

## Phần 4 — Interface

**4.1** ⭐ `Comparable<Student>` sắp theo GPA giảm dần; `Arrays.sort` một mảng học sinh.

**4.2** ⭐⭐ `interface Discount { long apply(long amount); }` với `PercentDiscount`, `FixedDiscount`, `NoDiscount`, và `CompositeDiscount` (áp nhiều mã lần lượt). Giá cuối không bao giờ âm.

**4.3** ⭐⭐ `interface Storage { void save(String key, String value); Optional<String> load(String key); }` — cài `InMemoryStorage` và `FileStorage` (mỗi key một file). `UserSettings` chỉ phụ thuộc `Storage`, đổi cách lưu không sửa `UserSettings`.

**4.4** ⭐⭐ Interface Segregation: tách `interface Worker { work(); eat(); sleep(); }` thành các interface nhỏ để `Robot` không phải cài `eat()`.

**4.5** ⭐⭐⭐ `interface Shape` + `default` method `compareArea(Shape other)`; `static` method `Shape.largest(List<Shape>)`. Giải thích khi nào dùng `default`, khi nào dùng `static` trong interface.

## Phần 5 — record, enum, sealed

**5.1** ⭐ `record Email(String value)` với compact constructor: chuẩn hóa chữ thường, kiểm tra có `@`.

**5.2** ⭐ `enum Weekday` có `isWeekend()`, `next()` (Chủ nhật → Thứ hai).

**5.3** ⭐⭐ `enum Planet` với khối lượng, bán kính, method `surfaceGravity()`, `weightOn(double earthWeight)`.

**5.4** ⭐⭐ `enum Operation { PLUS("+"), MINUS("-"), TIMES("*"), DIVIDE("/") }` mỗi hằng tự cài `apply(double, double)` (abstract method trong enum). `Operation.fromSymbol("*")`.

**5.5** ⭐⭐ `sealed interface Shape permits Circle, Square, Triangle` (các nhánh là record). Tính diện tích bằng `switch` pattern matching **không có `default`** — thêm `Hexagon` vào `permits` và quan sát compiler báo lỗi ở đâu.

**5.6** ⭐⭐⭐ `sealed interface Json permits JNull, JBool, JNumber, JString, JArray, JObject`. Viết `String render(Json j)` in ra chuỗi JSON đúng cú pháp (có escape dấu `"`).

## Phần 6 — Thiết kế nhỏ

**6.1** ⭐⭐ Vẽ (trên giấy hoặc ASCII) sơ đồ class cho hệ thống **đặt vé xem phim**: Phim, Suất chiếu, Phòng, Ghế, Vé, Khách hàng. Chỉ rõ quan hệ nào là kế thừa, nào là chứa (composition), số lượng (1-n, n-n).

**6.2** ⭐⭐⭐ Cài đặt phần lõi của 6.1: đặt ghế cho một suất chiếu, không cho đặt trùng ghế, hủy vé trước giờ chiếu 2 tiếng. Service chỉ phụ thuộc interface repository.

---

## Đáp án Phần 1

<details>
<summary>Bấm để xem</summary>

| Câu | Kết quả | Vì sao |
|---|---|---|
| 1.1 | `Hi B` | method instance được chọn theo kiểu **thật** của object lúc chạy (đa hình) |
| 1.2 | `P` | method `static` **không** đa hình — chọn theo kiểu khai báo của biến (và IDE sẽ cảnh báo gọi static qua biến) |
| 1.3 | `3 1` | `static` dùng chung cho cả class; field thường riêng từng object |
| 1.4 | `P Cinit(null) C ` | constructor cha chạy trước khi field của con được gán → **không gọi method có thể bị override trong constructor** |
| 1.5 | `false true Point[x=1, y=2]` | record tự sinh `equals/hashCode/toString` theo các thành phần |
| 1.6 | `10` | Java truyền **bản sao tham chiếu**: sửa object qua tham chiếu thì thấy, gán tham chiếu mới thì không |
| 1.7 | `2 3 -1` | `ordinal` bắt đầu từ 0; `compareTo` theo thứ tự khai báo |
| 1.8 | `Xin chào, Hello` | gọi default method của interface bằng `Interface.super.method()` |

</details>
