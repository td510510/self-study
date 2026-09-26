# Luyện tay Module 03 — 30 bài nhỏ về Collections

> Bổ sung cho [bai-tap.md](bai-tap.md). Mỗi bài 5–15 phút. Luôn tự hỏi: **cấu trúc nào hợp nhất, độ phức tạp bao nhiêu?**
> ⭐ dễ · ⭐⭐ vừa · ⭐⭐⭐ khó. Bài thuật toán sâu hơn nằm ở [Module 03b](../03b-dsa/).

## Phần 1 — Đọc code, đoán kết quả

```java
// 1.1
List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4));
list.remove(1);
list.remove(Integer.valueOf(1));
System.out.println(list);

// 1.2
Set<String> set = new HashSet<>();
System.out.println(set.add("a") + " " + set.add("a") + " " + set.size());

// 1.3
Map<String, Integer> m = new HashMap<>();
m.put("a", 1);
System.out.println(m.put("a", 2) + " " + m.get("a") + " " + m.get("b") + " " + m.getOrDefault("b", 0));

// 1.4
List<String> fixed = Arrays.asList("x", "y");
fixed.set(0, "z");
System.out.println(fixed);
fixed.add("w");

// 1.5
TreeSet<Integer> ts = new TreeSet<>(List.of(50, 10, 40, 20, 30));
System.out.println(ts.first() + " " + ts.ceiling(25) + " " + ts.headSet(30) + " " + ts.descendingSet());

// 1.6
Deque<Integer> dq = new ArrayDeque<>();
dq.push(1); dq.push(2); dq.offer(3);
System.out.println(dq.pop() + " " + dq.pollLast() + " " + dq);

// 1.7
class Key { int id; Key(int id) { this.id = id; } @Override public boolean equals(Object o) { return o instanceof Key k && k.id == id; } }
Map<Key, String> map = new HashMap<>();
map.put(new Key(1), "one");
System.out.println(map.get(new Key(1)));

// 1.8
Map<String, Integer> lhm = new LinkedHashMap<>();
lhm.put("c", 3); lhm.put("a", 1); lhm.put("b", 2);
Map<String, Integer> tm = new TreeMap<>(lhm);
System.out.println(lhm.keySet() + " " + tm.keySet());
```

## Phần 2 — List

**2.1** ⭐ `List<Integer> evens(List<Integer> in)`: trả về list mới chỉ gồm số chẵn, không sửa list gốc.

**2.2** ⭐ `chunk(List<T> list, int size)`: `[1..7]`, size 3 → `[[1,2,3],[4,5,6],[7]]`. (Dùng khi gửi dữ liệu theo lô: insert DB 500 dòng một lần.)

**2.3** ⭐ `interleave(List<T> a, List<T> b)`: `[1,2,3]` và `[a,b]` → `[1,a,2,b,3]`.

**2.4** ⭐⭐ `paginate(List<T> all, int page, int size)`: trả trang thứ `page` (bắt đầu từ 0). Trang vượt quá thì trả list rỗng, không ném exception. Dùng `subList`.

**2.5** ⭐⭐ `moveToFront(List<T> list, T item)`: đưa phần tử lên đầu (danh sách "gần đây"). Không có thì thêm vào đầu; tối đa 5 phần tử.

## Phần 3 — Set

**3.1** ⭐ Có bao nhiêu từ **khác nhau** trong một đoạn văn (không phân biệt hoa thường, bỏ dấu câu)?

**3.2** ⭐ `hasCommon(List<A> a, List<A> b)` trong O(n + m).

**3.3** ⭐⭐ Cho danh sách email đăng ký sự kiện (có thể trùng, khác hoa thường, có dấu cách thừa), trả về danh sách sạch, **giữ thứ tự** đăng ký đầu tiên.

**3.4** ⭐⭐ Hai danh sách quyền `Set<String>` của vai trò cũ và mới: in ra quyền **được thêm**, **bị gỡ**, **giữ nguyên**.

**3.5** ⭐⭐ `TreeSet<LocalTime>` các khung giờ đã đặt; viết `nextAvailable(LocalTime from)` trả khung 30 phút gần nhất còn trống trong giờ làm việc 8:00–17:00.

## Phần 4 — Map (quan trọng nhất)

**4.1** ⭐ Đếm số lần xuất hiện của mỗi phần tử trong `List<String>` bằng `merge`. Làm lại bằng `getOrDefault` và bằng `compute`.

**4.2** ⭐ `Map<Character, List<String>>` nhóm tên theo chữ cái đầu, tên trong nhóm sắp A-Z.

**4.3** ⭐ `invert(Map<K, V>)` với giá trị không trùng. Trùng thì ném exception chỉ rõ giá trị nào trùng.

**4.4** ⭐⭐ Từ `List<Order(customer, amount)>`: tổng chi tiêu theo khách, khách chi nhiều nhất, khách có nhiều đơn nhất.

**4.5** ⭐⭐ `Map<String, Map<String, Integer>>`: doanh số theo *tháng → sản phẩm → số lượng*. In báo cáo tháng theo thứ tự thời gian (`TreeMap`).

**4.6** ⭐⭐ `mergeInventory(Map<String,Integer> a, Map<String,Integer> b)`: gộp tồn kho 2 chi nhánh, cộng dồn sản phẩm trùng. Không sửa map gốc.

**4.7** ⭐⭐ Tra cứu nhanh: có `List<Product>` 100.000 phần tử và `List<Long>` 10.000 id cần tìm. Viết hai cách (lồng vòng lặp và `Map<Long, Product>`), đo thời gian.

**4.8** ⭐⭐ Cache đơn giản với thời hạn: `put(key, value, Duration ttl)`, `get(key)` trả `Optional`, hết hạn thì coi như không có. Dùng `Map<K, Entry(value, expiresAt)>`.

**4.9** ⭐⭐⭐ Hệ thống bình chọn: mỗi người bầu 1 lần (bầu lại thì thay phiếu cũ), in kết quả theo số phiếu giảm dần, bằng phiếu thì theo tên. Chỉ ra cấu trúc dữ liệu dùng cho từng yêu cầu.

## Phần 5 — Queue, Deque, PriorityQueue

**5.1** ⭐ Dùng `ArrayDeque` làm stack: đảo ngược một chuỗi; kiểm tra chuỗi đối xứng.

**5.2** ⭐⭐ Lịch sử trình duyệt: `visit(url)`, `back()`, `forward()` dùng 2 stack.

**5.3** ⭐⭐ Hàng đợi khám bệnh: `PriorityQueue<Patient>` ưu tiên cấp cứu → người già (≥ 70) → thứ tự đến. Chú ý: cùng mức ưu tiên phải giữ thứ tự đến (gợi ý: thêm số thứ tự tăng dần).

**5.4** ⭐⭐ Chỉ giữ **N sự kiện gần nhất** (ví dụ 100 dòng log cuối) trong bộ nhớ: dùng `ArrayDeque`, thêm cuối, vượt N thì bỏ đầu.

## Phần 6 — Generics

**6.1** ⭐ `static <T> T firstOrDefault(List<T> list, T defaultValue)`.

**6.2** ⭐⭐ `static <K, V extends Comparable<V>> K keyOfMaxValue(Map<K, V> map)`.

**6.3** ⭐⭐ `class Result<T>` với `success(T)`, `failure(String error)`, `isSuccess()`, `getOrElse(T)`, `<R> Result<R> map(Function<T, R>)` (có thể làm sau khi học lambda ở Module 05).

**6.4** ⭐⭐ `static double sumAll(Collection<? extends Number> nums)` và `static void fillZeros(List<? super Integer> list, int n)`. Thử truyền `List<Integer>`, `List<Double>`, `List<Number>`, `List<Object>` vào từng hàm, ghi lại cái nào biên dịch được và giải thích bằng PECS.

---

## Đáp án Phần 1

<details>
<summary>Bấm để xem</summary>

| Câu | Kết quả | Vì sao |
|---|---|---|
| 1.1 | `[3, 4]` | `remove(1)` xóa theo **chỉ số** (xóa 2); `remove(Integer.valueOf(1))` xóa theo **giá trị** |
| 1.2 | `true false 1` | `add` trả `false` khi phần tử đã có |
| 1.3 | `1 2 null 0` | `put` trả về giá trị **cũ** |
| 1.4 | `[z, y]` rồi `UnsupportedOperationException` | `Arrays.asList` có kích thước cố định: `set` được, `add` không |
| 1.5 | `10 30 [10, 20] [50, 40, 30, 20, 10]` | `ceiling` = nhỏ nhất ≥ 25; `headSet(30)` = các phần tử < 30 |
| 1.6 | `2 3 [1]` | `push` thêm **đầu**, `offer` thêm **cuối**; `pop` lấy đầu |
| 1.7 | `null` | override `equals` mà **quên `hashCode`** → hai key "bằng nhau" rơi vào hai bucket khác nhau |
| 1.8 | `[c, a, b] [a, b, c]` | `LinkedHashMap` giữ thứ tự thêm vào; `TreeMap` sắp theo key |

</details>
