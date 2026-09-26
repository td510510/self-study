# Luyện tay Module 05 — 35 bài nhỏ về Lambda & Stream

> Bổ sung cho [bai-tap.md](bai-tap.md). Mỗi bài 5–10 phút — mục tiêu là viết stream **trôi chảy**. Làm mỗi bài **hai lần**: một lần bằng vòng lặp `for`, một lần bằng stream, rồi tự hỏi cách nào dễ đọc hơn.
> ⭐ dễ · ⭐⭐ vừa · ⭐⭐⭐ khó.

Dữ liệu dùng chung cho Phần 3–4 (copy vào file của bạn):
```java
enum Status { NEW, PAID, SHIPPED, CANCELLED }
record Customer(long id, String name, String city, int age) { }
record Item(String product, String category, int qty, long unitPrice) { long total() { return qty * unitPrice; } }
record Order(long id, Customer customer, List<Item> items, Status status, LocalDate date) {
    long total() { return items.stream().mapToLong(Item::total).sum(); }
}

var an   = new Customer(1, "An", "Hà Nội", 25);
var binh = new Customer(2, "Bình", "HCM", 17);
var chi  = new Customer(3, "Chi", "Hà Nội", 32);
var dung = new Customer(4, "Dũng", "Đà Nẵng", 41);

List<Order> orders = List.of(
    new Order(1, an,   List.of(new Item("Laptop", "Máy tính", 1, 22_000_000), new Item("Chuột", "Phụ kiện", 2, 300_000)), Status.PAID,      LocalDate.of(2026, 1, 15)),
    new Order(2, binh, List.of(new Item("Tai nghe", "Phụ kiện", 1, 1_500_000)),                                             Status.CANCELLED, LocalDate.of(2026, 1, 20)),
    new Order(3, an,   List.of(new Item("Bàn phím", "Phụ kiện", 1, 1_200_000), new Item("Chuột", "Phụ kiện", 1, 300_000)), Status.SHIPPED,   LocalDate.of(2026, 2, 3)),
    new Order(4, chi,  List.of(new Item("Màn hình", "Máy tính", 2, 5_000_000)),                                             Status.PAID,      LocalDate.of(2026, 2, 14)),
    new Order(5, dung, List.of(new Item("Laptop", "Máy tính", 1, 25_000_000)),                                              Status.NEW,       LocalDate.of(2026, 3, 1)),
    new Order(6, chi,  List.of(new Item("Chuột", "Phụ kiện", 5, 300_000), new Item("Lót chuột", "Phụ kiện", 5, 100_000)),   Status.PAID,      LocalDate.of(2026, 3, 8)));
```

## Phần 1 — Lambda và functional interface

**1.1** ⭐ Viết `Predicate<String>` kiểm tra chuỗi không rỗng sau khi trim; kết hợp với predicate "độ dài ≤ 50" bằng `and`.

**1.2** ⭐ `Function<String, Integer>` đếm nguyên âm; nối với `Function<Integer, String>` bằng `andThen` để ra `"3 nguyên âm"`.

**1.3** ⭐ `Supplier<LocalDate>` trả ngày hôm nay — vì sao code nghiệp vụ nên nhận `Supplier`/`Clock` thay vì gọi thẳng `LocalDate.now()`? (Gợi ý: test.)

**1.4** ⭐ `BiFunction<Long, Integer, Long>` tính tiền sau giảm giá phần trăm. `UnaryOperator<String>` bỏ dấu cách thừa.

**1.5** ⭐⭐ `static <T> Predicate<T> not(Predicate<T> p)` tự viết (không dùng `Predicate.not`).

**1.6** ⭐⭐ `Map<String, BinaryOperator<Integer>>` làm máy tính: `"+"`, `"-"`, `"*"`, `"/"`. Đọc biểu thức `"12 * 3"` và tính.

**1.7** ⭐⭐ `static <T> Consumer<T> timed(String name, Consumer<T> action)`: trả về consumer mới in thời gian chạy của `action` (một decorator viết bằng lambda).

## Phần 2 — Stream cơ bản trên số và chuỗi

**2.1** ⭐ Tổng bình phương các số lẻ trong `[1..20]` bằng `IntStream.rangeClosed`.

**2.2** ⭐ Từ `List<String>` tên, lấy tên **không trùng**, viết hoa, sắp A-Z, nối bằng `", "`.

**2.3** ⭐ Số lớn nhất trong `List<Integer>` — trả `Optional`; list rỗng thì in `"Không có dữ liệu"`.

**2.4** ⭐ Kiểm tra: có số âm nào không (`anyMatch`), tất cả đều chẵn (`allMatch`), không có số 0 (`noneMatch`).

**2.5** ⭐ Đếm số từ có độ dài > 4 trong một câu.

**2.6** ⭐⭐ `List<List<Integer>>` → `List<Integer>` phẳng, bỏ trùng, sắp giảm dần (`flatMap`).

**2.7** ⭐⭐ Đếm tần suất ký tự của `"mississippi"` → `Map<Character, Long>` (`groupingBy` + `counting`), sắp theo tần suất giảm dần khi in.

**2.8** ⭐⭐ 10 số chính phương đầu tiên lớn hơn 1000 (`Stream.iterate` + `filter` + `limit`).

**2.9** ⭐⭐ Tách `"a=1;b=2;c=3"` thành `Map<String, Integer>` bằng stream.

**2.10** ⭐⭐ `List<String>` câu → tập hợp từ khác nhau (chữ thường, bỏ dấu câu).

## Phần 3 — Stream trên dữ liệu đơn hàng (dữ liệu ở đầu file)

**3.1** ⭐ Id các đơn **không bị hủy**.

**3.2** ⭐ Tổng doanh thu các đơn `PAID` và `SHIPPED`.

**3.3** ⭐ Tên khách hàng (không trùng) từng có đơn, sắp A-Z.

**3.4** ⭐ Đơn hàng có giá trị lớn nhất (`max` + `Comparator.comparingLong`).

**3.5** ⭐⭐ `Map<Status, Long>`: số đơn theo trạng thái.

**3.6** ⭐⭐ `Map<String, Long>`: tổng tiền theo **thành phố** của khách (bỏ đơn hủy).

**3.7** ⭐⭐ Sản phẩm bán được nhiều **số lượng** nhất (bỏ đơn hủy) — cần `flatMap` sang `Item`.

**3.8** ⭐⭐ `Map<String, Long>` doanh thu theo **danh mục**, sắp giảm dần khi in.

**3.9** ⭐⭐ `Map<YearMonth, Long>` doanh thu theo tháng, giữ đúng thứ tự thời gian (`TreeMap::new` trong `groupingBy`).

**3.10** ⭐⭐ `Map<Boolean, List<String>>` tên khách chia theo đã/chưa đủ 18 tuổi (`partitioningBy`).

**3.11** ⭐⭐ Khách hàng chi tiêu nhiều nhất và số tiền (bỏ đơn hủy).

**3.12** ⭐⭐⭐ `Map<String, Optional<Order>>` đơn lớn nhất của mỗi khách — rồi chuyển thành `Map<String, Long>` không còn `Optional` (`collectingAndThen`).

**3.13** ⭐⭐⭐ Báo cáo: mỗi khách một dòng `tên | số đơn | tổng chi | giá trị trung bình`, sắp theo tổng chi giảm dần. Dùng một record `CustomerStats` và **một** lần `groupingBy`.

## Phần 4 — Viết lại cho đúng

**4.1** ⭐⭐ Sửa lỗi:
```java
List<String> result = new ArrayList<>();
names.stream().filter(n -> n.length() > 3).forEach(n -> result.add(n));   // chạy được nhưng sai phong cách — vì sao?
names.parallelStream().filter(n -> n.startsWith("A")).forEach(result::add); // có thể sai kết quả — vì sao?
```

**4.2** ⭐⭐ Đoạn sau ném exception khi nào? Sửa bằng hai cách.
```java
Map<String, Customer> byCity = customers.stream().collect(Collectors.toMap(Customer::city, c -> c));
```

**4.3** ⭐⭐ Viết lại cho dễ đọc (tách biến có tên, hoặc tách method):
```java
orders.stream().filter(o -> o.status() != Status.CANCELLED && o.date().getYear() == 2026).flatMap(o -> o.items().stream().map(i -> Map.entry(o.customer().city(), i.total()))).collect(Collectors.groupingBy(Map.Entry::getKey, Collectors.summingLong(Map.Entry::getValue))).entrySet().stream().sorted(Map.Entry.<String, Long>comparingByValue().reversed()).limit(3).forEach(e -> System.out.println(e.getKey() + ": " + e.getValue()));
```

**4.4** ⭐⭐ Khi nào **không** nên dùng stream? Viết một ví dụ mà vòng lặp `for` rõ ràng hơn hẳn (gợi ý: cần thoát sớm với nhiều điều kiện, cần chỉ số, cần sửa nhiều biến cùng lúc).

---

## Gợi ý kiểm tra kết quả Phần 3

<details>
<summary>Bấm để xem</summary>

- 3.2: `22.600.000 + 1.500.000 + 10.000.000 + 2.000.000` = **36.100.000**
- 3.5: `{NEW=1, PAID=3, SHIPPED=1, CANCELLED=1}`
- 3.6: Hà Nội = 22.600.000 + 1.500.000 + 10.000.000 + 2.000.000 = **36.100.000**; Đà Nẵng = **25.000.000**
- 3.7: **Chuột** — 2 + 1 + 5 = 8
- 3.8: Máy tính = 22.000.000 + 10.000.000 + 25.000.000 = **57.000.000**; Phụ kiện = 600.000 + 1.500.000 + 2.000.000 = **4.100.000**
- 3.11: phụ thuộc vào định nghĩa "chi tiêu" — **hãy ghi rõ giả định trong code**:
  - tính mọi đơn không bị hủy (kể cả `NEW`): **Dũng — 25.000.000** (An 24.100.000, Chi 12.000.000)
  - chỉ tính đơn đã thanh toán (`PAID`, `SHIPPED`): **An — 24.100.000**

Bài 3.11 cố tình mơ hồ: ở dự án thật, yêu cầu "doanh thu" gần như luôn mơ hồ như vậy. Hỏi lại cho rõ là kỹ năng, không phải điểm yếu.

</details>
