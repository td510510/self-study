# Bài code phỏng vấn — dạng bài & chiến lược

> Ở Việt Nam, vòng code cho Fresher/Junior Java Backend thường là: 1–2 bài thuật toán mức dễ–trung bình, hoặc một bài "viết API nhỏ", hoặc live coding trên màn hình chung.
>
> Nền tảng giải thuật (Big-O, hai con trỏ, cửa sổ trượt, BFS/DFS, quy hoạch động) và lộ trình luyện bài theo dạng nằm ở
> [Module 03b — Cấu trúc dữ liệu & Giải thuật](../03b-dsa/). File này tập trung vào **chiến lược làm bài** khi phỏng vấn.

---

## 1. Chiến lược làm bài (áp dụng cho mọi bài)

**Bước 1 — Hỏi lại trước khi code (30 giây này ghi điểm rất cao)**
- Đầu vào có thể null/rỗng không? Kích thước tối đa bao nhiêu?
- Có ký tự đặc biệt, số âm, trùng lặp không?
- Kết quả mong đợi khi không tìm thấy: trả null, ném exception, hay `Optional`?

**Bước 2 — Nói ra cách làm trước khi gõ**
> "Em sẽ dùng HashMap để đếm tần suất, độ phức tạp O(n) thời gian, O(k) bộ nhớ. Cách thay thế là sắp xếp rồi duyệt, O(n log n), chậm hơn nhưng ít tốn bộ nhớ hơn."

Người phỏng vấn cần thấy bạn **cân nhắc đánh đổi**, không phải thấy bạn gõ nhanh.

**Bước 3 — Code sạch**
- Tên biến có nghĩa (`count`, `result`, không phải `a`, `tmp`)
- Xử lý trường hợp biên **ngay từ đầu** (null, rỗng, một phần tử)
- Tách hàm nếu quá 20 dòng

**Bước 4 — Tự test bằng miệng**
Chạy thử với: ví dụ đề bài, mảng rỗng, một phần tử, có trùng lặp, giá trị lớn.

**Bước 5 — Nói về cải tiến**
> "Nếu dữ liệu lên tới 100 triệu phần tử, em sẽ xử lý theo luồng thay vì nạp hết vào bộ nhớ."

---

## 2. Bài String (hay gặp nhất)

**2.1 Đảo ngược chuỗi, kiểm tra palindrome**
```java
static boolean isPalindrome(String s) {
    if (s == null) return false;
    String clean = s.toLowerCase().replaceAll("[^a-z0-9]", "");
    int left = 0, right = clean.length() - 1;
    while (left < right) {
        if (clean.charAt(left++) != clean.charAt(right--)) return false;
    }
    return true;
}
```
*Điểm cộng*: dùng hai con trỏ thay vì `new StringBuilder(s).reverse().equals(s)` — O(1) bộ nhớ thay vì O(n).

**2.2 Đếm tần suất ký tự / từ**
```java
Map<Character, Integer> freq = new HashMap<>();
for (char c : s.toCharArray()) freq.merge(c, 1, Integer::sum);
```

**2.3 Kiểm tra anagram**
```java
static boolean isAnagram(String a, String b) {
    if (a == null || b == null || a.length() != b.length()) return false;
    int[] count = new int[26];
    for (int i = 0; i < a.length(); i++) {
        count[a.charAt(i) - 'a']++;
        count[b.charAt(i) - 'a']--;
    }
    return Arrays.stream(count).allMatch(c -> c == 0);
}
```

**2.4 Ký tự không lặp đầu tiên**
```java
static Character firstUnique(String s) {
    Map<Character, Integer> freq = new LinkedHashMap<>();   // LinkedHashMap để giữ thứ tự
    for (char c : s.toCharArray()) freq.merge(c, 1, Integer::sum);
    return freq.entrySet().stream()
            .filter(e -> e.getValue() == 1)
            .map(Map.Entry::getKey)
            .findFirst().orElse(null);
}
```

---

## 3. Bài mảng & Collections

**3.1 Two Sum** (kinh điển, phải làm được trong 5 phút)
```java
static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();      // giá trị -> chỉ số
    for (int i = 0; i < nums.length; i++) {
        Integer j = seen.get(target - nums[i]);
        if (j != null) return new int[]{j, i};
        seen.put(nums[i], i);
    }
    return new int[]{-1, -1};
}
```
Giải thích được vì sao O(n) tốt hơn hai vòng lặp lồng O(n²).

**3.2 Tìm phần tử trùng lặp / số lớn thứ hai**
```java
static int secondLargest(int[] nums) {
    int max = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
    for (int n : nums) {
        if (n > max) { second = max; max = n; }
        else if (n > second && n != max) { second = n; }
    }
    return second;
}
```
*Điểm cộng*: một lần duyệt, không cần sắp xếp.

**3.3 Nhóm dữ liệu (rất hay hỏi vì giống việc thật)**
```java
Map<String, List<Employee>> byDept = employees.stream()
        .collect(Collectors.groupingBy(Employee::getDepartment));

Map<String, Double> avgSalary = employees.stream()
        .collect(Collectors.groupingBy(Employee::getDepartment,
                 Collectors.averagingDouble(Employee::getSalary)));

// Top 3 lương cao nhất
List<Employee> top3 = employees.stream()
        .sorted(Comparator.comparingDouble(Employee::getSalary).reversed())
        .limit(3).toList();
```

**3.4 Kiểm tra chuỗi ngoặc hợp lệ**
```java
static boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
    for (char c : s.toCharArray()) {
        if (pairs.containsValue(c)) stack.push(c);
        else if (pairs.containsKey(c)) {
            if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;
        }
    }
    return stack.isEmpty();
}
```

---

## 4. Bài "viết API nhỏ" (dạng take-home)

Đề điển hình: *"Viết REST API quản lý sản phẩm với CRUD, tìm kiếm, phân trang. Thời gian: 3–5 ngày."*

Người chấm nhìn vào những gì (theo thứ tự quan trọng):

| Tiêu chí | Cụ thể |
|---|---|
| **Cấu trúc** | phân tầng controller/service/repository, phụ thuộc một chiều |
| **DTO** | không lộ entity ra API |
| **Validation** | `@Valid`, thông báo lỗi rõ ràng |
| **Xử lý lỗi** | `@RestControllerAdvice`, đúng status code |
| **Test** | có unit test cho service, integration test cho controller |
| **README** | cách chạy, cách test, các quyết định thiết kế |
| **Git** | commit nhỏ, message rõ ràng, không commit `target/` hay secret |

Ba thứ khiến bài bị loại ngay: (1) không có test, (2) trả entity thẳng ra API kèm cả password, (3) README trống.

Mẹo: **viết một mục "Đánh đổi & những gì tôi sẽ làm nếu có thêm thời gian"** trong README. Nó cho thấy bạn biết bài của mình chưa hoàn hảo ở đâu — người chấm rất thích điều này.

---

## 5. Bài SQL (rất hay gặp ở ngân hàng, fintech)

Cho bảng `orders(id, user_id, total, status, created_at)` và `users(id, name, city)`:

```sql
-- 1. Top 5 khách chi nhiều nhất
SELECT u.name, SUM(o.total) AS tong
FROM users u JOIN orders o ON o.user_id = u.id
WHERE o.status <> 'CANCELLED'
GROUP BY u.id, u.name
ORDER BY tong DESC LIMIT 5;

-- 2. Khách CHƯA từng mua (bẫy: phải dùng LEFT JOIN hoặc NOT EXISTS)
SELECT u.* FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;

-- 3. Doanh thu theo tháng
SELECT TO_CHAR(created_at, 'YYYY-MM') AS thang, SUM(total)
FROM orders WHERE status <> 'CANCELLED'
GROUP BY 1 ORDER BY 1;

-- 4. Đơn hàng mới nhất của mỗi khách (window function — câu phân loại trình độ)
SELECT * FROM (
    SELECT o.*, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) rn
    FROM orders o
) t WHERE rn = 1;

-- 5. Tỷ lệ hủy đơn theo tháng
SELECT TO_CHAR(created_at, 'YYYY-MM') AS thang,
       ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'CANCELLED') / COUNT(*), 1) AS ty_le_huy
FROM orders GROUP BY 1;
```

Hay bị hỏi thêm: *"Query này chạy chậm với 10 triệu dòng, bạn làm gì?"* → `EXPLAIN ANALYZE`, thêm index cho `user_id` và `(status, created_at)`, tránh hàm bọc quanh cột, cân nhắc bảng tổng hợp sẵn nếu là báo cáo.

---

## 6. Bài debug / đọc code

Dạng này ngày càng phổ biến: đưa một đoạn code có bug, hỏi bạn tìm ra.

Những bug hay được cài sẵn (bạn đã học hết trong chương trình này):
1. So sánh `String` bằng `==` thay vì `.equals()`
2. `Integer` so sánh `==` ngoài khoảng cache -128..127
3. `count++` không đồng bộ trong môi trường đa luồng
4. `equals()` mà không có `hashCode()` → mất dữ liệu trong `HashSet`
5. `double` dùng cho tiền tệ
6. Sửa collection trong lúc for-each → `ConcurrentModificationException`
7. Nối chuỗi trong vòng lặp lớn
8. Quên đóng tài nguyên (không dùng try-with-resources)
9. `catch (Exception e) {}` nuốt lỗi
10. `@Transactional` gọi nội bộ trong cùng class (không có tác dụng)
11. N+1 query
12. Trả entity ra API kèm password

---

## 7. Luyện tập

- **LeetCode Easy** (~50 bài): Array, String, HashMap là đủ cho Fresher/Junior.
- **HackerRank SQL**: làm hết mục Basic + Intermediate.
- **Tự đặt đồng hồ**: 20 phút/bài, ép mình nói to cách làm trong lúc code.
- **Quan trọng nhất**: làm lại chính bài tập trong `bai-tap.md` của các module — chúng bám sát thứ được hỏi hơn nhiều bài thuật toán khó.

## 8. Live coding — mẹo sống còn

- **Nói to suy nghĩ.** Im lặng 3 phút gõ code là điều tệ nhất; người phỏng vấn không biết bạn đang nghĩ hay đang bí.
- **Bí thì nói ra**: "Em đang phân vân giữa dùng Map và sắp xếp, anh/chị gợi ý hướng nào phù hợp hơn không ạ?" — hỏi không bị trừ điểm, im lặng mới bị.
- **Bắt đầu bằng lời giải chạy được, dù chưa tối ưu**, rồi cải tiến. Lời giải hoàn hảo chưa viết xong = 0 điểm.
- Viết code như đang làm việc thật: xử lý null, đặt tên rõ ràng, không gọi biến là `x1`, `x2`.
