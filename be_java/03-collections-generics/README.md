# Module 03 — Collections & Generics

> Mục tiêu: chọn đúng cấu trúc dữ liệu cho từng bài toán, hiểu chi phí (độ phức tạp) của mỗi thao tác.
> Thời lượng: 1 tuần. Đây là kiến thức bạn dùng **mỗi ngày** khi đi làm và bị hỏi **mọi buổi phỏng vấn**.

---

## 1. Bản đồ Collections Framework

```
                  Iterable
                     │
                Collection ──────────────┐
                     │                   │
        ┌────────────┼───────────┐       │
       List         Set        Queue     │      Map  (KHÔNG kế thừa Collection)
        │            │           │       │       │
  ArrayList     HashSet      ArrayDeque  │   HashMap
  LinkedList    LinkedHashSet PriorityQueue  LinkedHashMap
                TreeSet                      TreeMap
                                             ConcurrentHashMap
```

Điểm quan trọng: `Map` **không** phải `Collection` — nó lưu cặp key/value, không phải một dãy phần tử.

## 2. List — danh sách có thứ tự, cho trùng

```java
List<String> list = new ArrayList<>();
list.add("A");              // thêm cuối
list.add(0, "B");           // chèn vào vị trí 0
list.get(0);                // đọc theo chỉ số
list.set(0, "C");           // thay thế
list.remove(0);             // xóa theo chỉ số
list.remove("A");           // xóa theo giá trị
list.size(); list.isEmpty(); list.contains("A"); list.indexOf("A");
list.clear();
```

### ArrayList vs LinkedList

| Thao tác | ArrayList | LinkedList |
|---|---|---|
| `get(i)` | **O(1)** | O(n) |
| `add()` cuối | O(1) trung bình | O(1) |
| `add(0, x)` đầu | O(n) | **O(1)** |
| `remove(i)` giữa | O(n) | O(n) (phải duyệt tìm) |
| Bộ nhớ | gọn | tốn hơn (mỗi node 2 con trỏ) |

**Thực chiến: 95% trường hợp dùng `ArrayList`.** `LinkedList` chỉ đáng dùng khi liên tục thêm/xóa ở đầu — mà việc đó `ArrayDeque` còn làm tốt hơn. Đừng chọn `LinkedList` chỉ vì nghe nói "chèn nhanh".

Vì sao `ArrayList` thêm cuối là O(1) "trung bình"? Bên trong nó là mảng; khi đầy sẽ tạo mảng mới lớn hơn 1.5 lần rồi copy. Nếu biết trước số lượng, hãy khai báo sẵn sức chứa: `new ArrayList<>(10_000)`.

### List bất biến
```java
List<String> a = List.of("x", "y");        // Java 9+, KHÔNG sửa được
a.add("z");                                 // ❌ UnsupportedOperationException

List<String> b = new ArrayList<>(a);        // muốn sửa thì copy sang ArrayList
List<String> c = Arrays.asList("x", "y");   // kích thước cố định, set() được, add() không
```

> **Cạm bẫy #1 — xóa phần tử trong lúc duyệt**:
> ```java
> for (String s : list) { if (s.startsWith("a")) list.remove(s); }  // ❌ ConcurrentModificationException
> ```
> Cách đúng:
> ```java
> list.removeIf(s -> s.startsWith("a"));                      // ✅ gọn nhất
> Iterator<String> it = list.iterator();                       // ✅ khi cần logic phức tạp
> while (it.hasNext()) { if (cond(it.next())) it.remove(); }
> ```

> **Cạm bẫy #2 — `remove(int)` vs `remove(Object)`**:
> ```java
> List<Integer> l = new ArrayList<>(List.of(10, 20, 30));
> l.remove(1);                      // xóa theo CHỈ SỐ -> xóa 20
> l.remove(Integer.valueOf(10));    // xóa theo GIÁ TRỊ -> xóa 10
> ```

## 3. Set — không trùng lặp

```java
Set<String> set = new HashSet<>();
set.add("A");
set.add("A");            // không thêm được nữa
set.size();              // 1
```

| Loại | Thứ tự | Hiệu năng | Dùng khi |
|---|---|---|---|
| `HashSet` | không đảm bảo | O(1) | **mặc định** — chỉ cần khử trùng |
| `LinkedHashSet` | theo thứ tự thêm vào | O(1), tốn hơn chút | cần giữ thứ tự chèn |
| `TreeSet` | đã sắp xếp | O(log n) | cần duyệt theo thứ tự, tìm khoảng |

```java
TreeSet<Integer> ts = new TreeSet<>(List.of(5, 1, 9, 3));
ts.first();          // 1
ts.last();           // 9
ts.headSet(5);       // [1, 3]  phần tử < 5
ts.ceiling(4);       // 5       nhỏ nhất mà >= 4
```

**`HashSet` chỉ hoạt động đúng khi phần tử override đúng `equals`/`hashCode`** — xem lại [EqualsDemo](../02-oop/src/oop/EqualsDemo.java) của module 02.

## 4. Map — cặp khóa/giá trị (dùng nhiều nhất)

```java
Map<String, Integer> map = new HashMap<>();
map.put("a", 1);
map.get("a");                       // 1
map.get("zzz");                     // null (không có key)
map.getOrDefault("zzz", 0);         // 0   ✅ tránh null
map.containsKey("a");
map.remove("a");
map.size();

// Các method cực hữu ích (Java 8+)
map.putIfAbsent("b", 2);
map.computeIfAbsent("list", k -> new ArrayList<>()).add("x");   // gom nhóm
map.merge("count", 1, Integer::sum);                            // đếm tần suất
map.forEach((k, v) -> System.out.println(k + " = " + v));

// Duyệt
for (Map.Entry<String, Integer> e : map.entrySet()) {
    System.out.println(e.getKey() + " -> " + e.getValue());
}
```

| Loại | Thứ tự | Ghi chú |
|---|---|---|
| `HashMap` | không đảm bảo | **mặc định**, cho phép 1 key null |
| `LinkedHashMap` | thứ tự chèn | dùng làm LRU cache được |
| `TreeMap` | sắp theo key | key phải `Comparable` |
| `ConcurrentHashMap` | không đảm bảo | **an toàn đa luồng** (module 06) |

### HashMap hoạt động ra sao? (câu hỏi phỏng vấn kinh điển)
1. Tính `hashCode()` của key → suy ra vị trí "bucket" trong mảng bên trong.
2. Nếu bucket trống → đặt vào.
3. Nếu bucket đã có (**collision**) → so `equals()` với từng phần tử: trùng thì ghi đè, không trùng thì nối vào danh sách liên kết của bucket.
4. Từ Java 8, một bucket có > 8 phần tử sẽ chuyển thành **cây đỏ-đen** để tra cứu O(log n) thay vì O(n).
5. Khi số phần tử vượt `capacity × 0.75` (load factor) → **resize** gấp đôi và băm lại toàn bộ.

Hệ quả thực tế:
- `hashCode()` viết tệ (luôn trả cùng một số) làm `HashMap` tụt xuống O(n).
- **Không được dùng object có thể thay đổi (mutable) làm key**: sửa field sau khi put → hash đổi → không tìm lại được.

## 5. Queue & Deque

```java
Deque<Integer> stack = new ArrayDeque<>();      // dùng làm STACK (LIFO)
stack.push(1); stack.push(2);
stack.pop();                                     // 2

Queue<String> queue = new ArrayDeque<>();        // dùng làm QUEUE (FIFO)
queue.offer("a"); queue.offer("b");
queue.poll();                                    // "a"

PriorityQueue<Task> pq = new PriorityQueue<>(Comparator.comparingInt(Task::priority));
```
> Class `Stack` cũ (kế thừa `Vector`) đã lỗi thời vì đồng bộ hóa thừa thãi. **Dùng `ArrayDeque`.**

## 6. Sắp xếp: Comparable & Comparator

```java
// Comparable — thứ tự "tự nhiên", cài trong chính class
public class Student implements Comparable<Student> {
    private String name; private double gpa;
    @Override public int compareTo(Student o) { return this.name.compareTo(o.name); }
}
Collections.sort(students);       // theo tên

// Comparator — thứ tự tùy biến, khai báo bên ngoài, linh hoạt hơn
students.sort(Comparator.comparing(Student::getGpa).reversed()
        .thenComparing(Student::getName));
```
Quy ước giá trị trả về: `< 0` nghĩa là "đứng trước", `0` là bằng, `> 0` là "đứng sau".

> **Cạm bẫy #3**: đừng viết `(a, b) -> (int)(a.getGpa() - b.getGpa())` — phần thập phân bị cắt gây sai thứ tự, và với số lớn có thể tràn `int`. Dùng `Comparator.comparingDouble(...)` hoặc `Double.compare(...)`.

## 7. Generics

Generics cho phép viết code dùng cho nhiều kiểu mà vẫn **an toàn kiểu lúc biên dịch**.

```java
// Không generic: phải ép kiểu, dễ lỗi lúc chạy
List list = new ArrayList();
list.add("hello");
Integer x = (Integer) list.get(0);      // ❌ ClassCastException lúc chạy

// Có generic: compiler chặn ngay
List<String> list2 = new ArrayList<>();
list2.add(123);                          // ❌ lỗi biên dịch — phát hiện sớm
```

### Tự viết class/method generic
```java
public class Box<T> {
    private T value;
    public void set(T value) { this.value = value; }
    public T get() { return value; }
}
Box<String> b = new Box<>();

// Method generic
public static <T> void printAll(List<T> list) { list.forEach(System.out::println); }

// Giới hạn kiểu (bounded)
public static <T extends Number> double sum(List<T> list) {
    double s = 0;
    for (T n : list) s += n.doubleValue();
    return s;
}
```

Mẫu rất hay dùng khi làm API (bạn sẽ viết lại ở Module 11):
```java
public record ApiResponse<T>(boolean success, String message, T data) {
    public static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(true, "OK", data); }
    public static <T> ApiResponse<T> error(String msg) { return new ApiResponse<>(false, msg, null); }
}
```

### Wildcard — nguyên tắc PECS
**P**roducer **E**xtends, **C**onsumer **S**uper:
```java
// Chỉ ĐỌC ra khỏi list -> extends
double total(List<? extends Number> nums) { }
total(List.of(1, 2));        // List<Integer> ✅
total(List.of(1.5, 2.5));    // List<Double>  ✅

// Chỉ GHI vào list -> super
void addNumbers(List<? super Integer> list) { list.add(1); }
```
Lý do cần thiết: `List<Integer>` **không phải** con của `List<Number>` (generic là *invariant*), nên không có wildcard sẽ không truyền được.

### Type erasure
Generic chỉ tồn tại lúc biên dịch; lúc chạy JVM xóa hết thông tin kiểu. Hệ quả:
```java
List<String> a = new ArrayList<>();
List<Integer> b = new ArrayList<>();
a.getClass() == b.getClass();      // true — cùng là ArrayList
new T();                           // ❌ không tạo được object generic
List<String>[] arr;                // ❌ không tạo mảng generic
```

## 8. Chọn cấu trúc dữ liệu nào? (bảng tra nhanh)

| Nhu cầu | Chọn |
|---|---|
| Danh sách có thứ tự, truy cập theo chỉ số | `ArrayList` |
| Khử trùng lặp | `HashSet` |
| Khử trùng + giữ thứ tự chèn | `LinkedHashSet` |
| Tra cứu theo khóa | `HashMap` |
| Tra cứu theo khóa + đã sắp xếp | `TreeMap` |
| Hàng đợi FIFO / ngăn xếp LIFO | `ArrayDeque` |
| Lấy phần tử ưu tiên cao nhất | `PriorityQueue` |
| Đa luồng | `ConcurrentHashMap`, `CopyOnWriteArrayList` |

## 9. Các đoạn code "kinh điển" phải thuộc

```java
// Đếm tần suất
Map<String, Integer> count = new HashMap<>();
for (String w : words) count.merge(w, 1, Integer::sum);

// Gom nhóm
Map<String, List<Student>> byClass = new HashMap<>();
for (Student s : students) {
    byClass.computeIfAbsent(s.getClassName(), k -> new ArrayList<>()).add(s);
}

// Khử trùng nhưng giữ thứ tự
List<String> unique = new ArrayList<>(new LinkedHashSet<>(list));

// Sắp xếp Map theo value giảm dần
count.entrySet().stream()
     .sorted(Map.Entry.<String,Integer>comparingByValue().reversed())
     .forEach(e -> System.out.println(e.getKey() + ": " + e.getValue()));

// Giao / hợp / hiệu hai tập hợp
Set<String> a = new HashSet<>(list1);
a.retainAll(list2);   // giao
a.addAll(list2);      // hợp
a.removeAll(list2);   // hiệu
```

---

## Tổng kết
- Mặc định: `ArrayList`, `HashMap`, `HashSet`, `ArrayDeque`.
- `HashMap`/`HashSet` phụ thuộc hoàn toàn vào `equals`/`hashCode` đúng.
- Không sửa collection trong lúc for-each → dùng `removeIf`/`Iterator`.
- Generics bắt lỗi lúc biên dịch; nhớ PECS và type erasure.

## Code trong module
- [src/coll/ListDemo.java](src/coll/ListDemo.java) — List, các bẫy, so sánh hiệu năng
- [src/coll/MapSetDemo.java](src/coll/MapSetDemo.java) — Map/Set, đếm tần suất, gom nhóm
- [src/coll/GenericsDemo.java](src/coll/GenericsDemo.java) — Box, method generic, PECS

👉 Làm [bai-tap.md](bai-tap.md) rồi sang [Module 04 — Exception & I/O](../04-exception-io/).
