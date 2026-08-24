# Module 05 — Lambda & Stream API

> Mục tiêu: viết code xử lý dữ liệu ngắn gọn, dễ đọc theo phong cách hàm — thứ bạn sẽ dùng liên tục trong Spring.
> Thời lượng: 1 tuần.

---

## 1. Lambda — hàm không tên

Trước Java 8, muốn truyền "hành vi" phải viết anonymous class dài dòng:
```java
// Cũ
Collections.sort(list, new Comparator<String>() {
    @Override public int compare(String a, String b) { return a.length() - b.length(); }
});

// Lambda
list.sort((a, b) -> a.length() - b.length());
// Ngắn hơn nữa
list.sort(Comparator.comparingInt(String::length));
```

Cú pháp:
```java
() -> System.out.println("hi")                 // không tham số
x -> x * 2                                     // 1 tham số, bỏ được ngoặc
(x, y) -> x + y                                // nhiều tham số
(x, y) -> { int s = x + y; return s * 2; }     // nhiều dòng thì cần {} và return
```

Lambda chỉ dùng được với **functional interface** — interface có **đúng 1 method abstract**:
```java
@FunctionalInterface
interface Calculator {
    int apply(int a, int b);        // đúng 1 method abstract
}

Calculator add = (a, b) -> a + b;
Calculator mul = (a, b) -> a * b;
System.out.println(add.apply(2, 3));   // 5
```

> **Biến bên ngoài dùng trong lambda phải là "effectively final"** (không bị gán lại). Nếu cần biến thay đổi, dùng mảng 1 phần tử, `AtomicInteger`, hoặc thiết kế lại bằng `reduce`.

## 2. Functional interface có sẵn (thuộc lòng 6 cái này)

| Interface | Chữ ký | Dùng để | Ví dụ |
|---|---|---|---|
| `Function<T,R>` | `R apply(T)` | biến đổi | `s -> s.length()` |
| `Predicate<T>` | `boolean test(T)` | lọc/điều kiện | `s -> s.isEmpty()` |
| `Consumer<T>` | `void accept(T)` | tiêu thụ | `System.out::println` |
| `Supplier<T>` | `T get()` | cung cấp | `() -> new User()` |
| `BiFunction<T,U,R>` | `R apply(T,U)` | 2 đầu vào | `(a,b) -> a+b` |
| `UnaryOperator<T>` | `T apply(T)` | T → T | `s -> s.trim()` |

```java
Predicate<String> notEmpty = s -> !s.isBlank();
Predicate<String> isLong = s -> s.length() > 5;
notEmpty.and(isLong).test("hello world");   // kết hợp được
notEmpty.negate();
Function<Integer,Integer> f = x -> x + 1;
f.andThen(x -> x * 2).apply(3);             // (3+1)*2 = 8
f.compose((Integer x) -> x * 2).apply(3);   // (3*2)+1 = 7
```

## 3. Method reference — viết tắt của lambda

| Dạng | Lambda | Method reference |
|---|---|---|
| Static | `x -> Integer.parseInt(x)` | `Integer::parseInt` |
| Instance của object cụ thể | `x -> System.out.println(x)` | `System.out::println` |
| Instance của kiểu | `s -> s.toUpperCase()` | `String::toUpperCase` |
| Constructor | `() -> new ArrayList<>()` | `ArrayList::new` |

## 4. Stream API

Stream là **luồng xử lý dữ liệu**, không phải cấu trúc lưu trữ. Ba đặc điểm quan trọng:
1. **Không sửa nguồn** — luôn tạo kết quả mới.
2. **Lazy** — các phép trung gian chỉ chạy khi có phép kết thúc.
3. **Dùng một lần** — đã `collect` rồi thì không dùng lại được stream đó.

```
nguồn  →  phép trung gian (intermediate)  →  phép kết thúc (terminal)
list      filter, map, sorted, distinct       collect, forEach, count, reduce
```

### 4.1 Tạo stream
```java
list.stream();
Arrays.stream(array);
Stream.of("a", "b", "c");
IntStream.range(1, 10);              // 1..9
IntStream.rangeClosed(1, 10);        // 1..10
Stream.iterate(1, x -> x * 2).limit(10);
Files.lines(path);
```

### 4.2 Phép trung gian
```java
.filter(u -> u.getAge() > 18)        // lọc
.map(User::getName)                  // biến đổi từng phần tử
.flatMap(u -> u.getRoles().stream()) // "làm phẳng" stream lồng nhau
.distinct()                          // khử trùng (dựa trên equals)
.sorted()                            // sắp xếp tự nhiên
.sorted(Comparator.comparing(User::getAge).reversed())
.limit(10)                           // lấy 10 phần tử đầu
.skip(20)                            // bỏ 20 phần tử đầu → phân trang
.peek(System.out::println)           // xem giữa chừng (chỉ để debug)
```

### 4.3 Phép kết thúc
```java
.collect(Collectors.toList())        // hoặc .toList() (Java 16+, bất biến)
.forEach(System.out::println)
.count()
.anyMatch(u -> u.isAdmin())
.allMatch(...)  .noneMatch(...)
.findFirst()    .findAny()           // trả Optional
.min(cmp)  .max(cmp)                 // trả Optional
.reduce(0, Integer::sum)
```

### 4.4 Collectors — phần đáng giá nhất
```java
// Sang collection
.collect(Collectors.toList())
.collect(Collectors.toSet())
.collect(Collectors.toMap(User::getId, Function.identity()))
.collect(Collectors.joining(", ", "[", "]"))

// Gom nhóm — cực kỳ hay dùng
Map<String, List<User>> byCity = users.stream()
    .collect(Collectors.groupingBy(User::getCity));

Map<String, Long> countByCity = users.stream()
    .collect(Collectors.groupingBy(User::getCity, Collectors.counting()));

Map<String, Double> avgAgeByCity = users.stream()
    .collect(Collectors.groupingBy(User::getCity, Collectors.averagingInt(User::getAge)));

// Chia đôi theo điều kiện
Map<Boolean, List<User>> adults = users.stream()
    .collect(Collectors.partitioningBy(u -> u.getAge() >= 18));

// Thống kê một lần lấy đủ min/max/sum/avg/count
IntSummaryStatistics stats = users.stream().mapToInt(User::getAge).summaryStatistics();
```

> **Cạm bẫy #1 — `Collectors.toMap` trùng key** → `IllegalStateException`. Phải truyền hàm xử lý xung đột:
> ```java
> .collect(Collectors.toMap(User::getEmail, u -> u, (a, b) -> a))
> ```
> **Cạm bẫy #2 — `toMap` với value null** → NPE. Lọc null trước.

### 4.5 Stream số nguyên thủy
```java
int sum = list.stream().mapToInt(Integer::intValue).sum();     // tránh boxing
OptionalDouble avg = IntStream.of(1,2,3).average();
```
`Stream<Integer>` phải boxing/unboxing liên tục; với dữ liệu lớn hãy dùng `IntStream`/`LongStream`/`DoubleStream`.

### 4.6 Song song (parallel) — cẩn thận
```java
list.parallelStream().filter(...).count();
```
Chỉ có lợi khi: dữ liệu **rất lớn** (>10.000 phần tử), thao tác **nặng CPU**, và **không có tác dụng phụ**. Với I/O hoặc dữ liệu nhỏ, parallel thường **chậm hơn** vì chi phí chia việc. Trong Spring Boot, đừng dùng parallel stream cho việc gọi DB/API — dùng `CompletableFuture` (module 06).

## 5. So sánh: vòng lặp vs stream

```java
// Vòng lặp: tường minh, dễ debug, nhanh hơn chút với dữ liệu nhỏ
List<String> names = new ArrayList<>();
for (User u : users) {
    if (u.getAge() >= 18) names.add(u.getName().toUpperCase());
}

// Stream: mô tả "làm gì" thay vì "làm thế nào"
List<String> names = users.stream()
        .filter(u -> u.getAge() >= 18)
        .map(u -> u.getName().toUpperCase())
        .toList();
```
Nguyên tắc chọn: chuỗi **lọc → biến đổi → gom nhóm** thì stream đọc dễ hơn hẳn. Logic phức tạp nhiều nhánh, cần `break`, hoặc cần sửa nhiều biến ngoài → dùng vòng lặp. **Đừng cố nhét mọi thứ vào một chuỗi stream 15 dòng** — khó đọc và khó debug.

## 6. Những công thức dùng hằng ngày ở dự án thật

```java
// Lấy danh sách id
List<Long> ids = orders.stream().map(Order::getId).toList();

// Chuyển List thành Map để tra cứu O(1)
Map<Long, User> userById = users.stream()
        .collect(Collectors.toMap(User::getId, Function.identity()));

// Tổng tiền đơn hàng
BigDecimal total = items.stream()
        .map(i -> i.getPrice().multiply(BigDecimal.valueOf(i.getQty())))
        .reduce(BigDecimal.ZERO, BigDecimal::add);

// Top 5 sản phẩm bán chạy
List<Product> top5 = products.stream()
        .sorted(Comparator.comparingInt(Product::getSold).reversed())
        .limit(5).toList();

// Phân trang thủ công
List<T> page = list.stream().skip((long) page * size).limit(size).toList();

// Kiểm tra tồn tại
boolean hasAdmin = users.stream().anyMatch(u -> u.getRole() == Role.ADMIN);

// Nối chuỗi
String csv = users.stream().map(User::getEmail).collect(Collectors.joining(", "));

// Làm phẳng danh sách lồng
List<Item> allItems = orders.stream().flatMap(o -> o.getItems().stream()).toList();

// Lọc null an toàn
List<String> clean = list.stream().filter(Objects::nonNull).toList();
```

---

## Tổng kết
- Lambda cần functional interface (1 method abstract).
- Nhớ 6 functional interface chuẩn + method reference.
- Stream: lazy, không sửa nguồn, dùng một lần.
- `Collectors.groupingBy` là công cụ mạnh nhất — luyện kỹ.
- Đừng lạm dụng: code đọc khó thì quay lại vòng lặp.

## Code trong module
- [src/fp/LambdaDemo.java](src/fp/LambdaDemo.java) — functional interface, method reference
- [src/fp/StreamDemo.java](src/fp/StreamDemo.java) — toàn bộ thao tác stream trên dữ liệu đơn hàng
- [src/fp/CollectorsDemo.java](src/fp/CollectorsDemo.java) — groupingBy, partitioningBy, thống kê

👉 Làm [bai-tap.md](bai-tap.md) rồi sang [Module 06 — Concurrency](../06-concurrency/).
