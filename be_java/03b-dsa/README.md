# Module 03b — Cấu trúc dữ liệu & Giải thuật (DSA)

> Mục tiêu: đánh giá được code nhanh hay chậm (Big-O), nhận ra dạng bài và chọn đúng kỹ thuật, qua được vòng code test.
> Thời lượng: **học song song** từ tuần 5 đến hết khóa, mỗi tuần 2–3 giờ. Phần lý thuyết đọc trong 1 tuần, phần luyện bài kéo dài.
> Yêu cầu trước: xong Module 01 (vòng lặp, mảng, method) và Module 03 (Collections).

Vì sao backend developer cần học giải thuật khi hằng ngày chỉ viết CRUD?
1. **Vòng code test**: gần như công ty nào cũng có 1–2 bài thuật toán mức dễ–trung bình.
2. **Nhận ra code chậm trước khi nó lên production**: vòng lặp lồng nhau trên 100.000 bản ghi, `list.contains()` trong vòng lặp, gọi DB trong vòng lặp (chính là N+1 ở Module 12).
3. **Hiểu công cụ mình dùng**: index DB là B-tree, `HashMap` là bảng băm, `TreeMap` là cây đỏ-đen, Spring khởi tạo bean theo thứ tự sắp xếp topo trên đồ thị phụ thuộc.

Bạn **không** cần giải được bài LeetCode Hard. Mục tiêu thực tế: giải chắc bài Easy, giải được 60–70% bài Medium phổ biến.

---

## 1. Big-O — đo độ phức tạp

Big-O trả lời câu hỏi: **khi dữ liệu tăng gấp đôi, thời gian (hoặc bộ nhớ) tăng thế nào?** Nó không đo giây, nó đo *tốc độ tăng*.

| Big-O | Tên | Ví dụ | n = 1.000.000 thì khoảng |
|---|---|---|---|
| O(1) | hằng số | `array[i]`, `map.get(k)` | 1 thao tác |
| O(log n) | logarit | tìm kiếm nhị phân, `TreeMap.get` | 20 thao tác |
| O(n) | tuyến tính | duyệt mảng một lần | 1 triệu |
| O(n log n) | | sắp xếp tốt (merge sort, `Arrays.sort`) | 20 triệu |
| O(n²) | bình phương | 2 vòng lặp lồng nhau | 1 **nghìn tỷ** → treo máy |
| O(2ⁿ) | hàm mũ | liệt kê mọi tập con | không bao giờ xong |

Quy tắc ngón tay cái: máy tính làm được khoảng **10⁸ thao tác đơn giản/giây**. Đề cho n ≤ 10⁵ thì O(n²) = 10¹⁰ → quá chậm, phải tìm cách O(n log n) hoặc O(n).

### Cách đếm
```java
// O(n): một vòng lặp
for (int i = 0; i < n; i++) sum += a[i];

// O(n²): hai vòng lồng nhau
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++)
        if (a[i] == a[j]) return true;

// O(log n): mỗi bước chia đôi
while (n > 1) n /= 2;

// O(n) chứ KHÔNG phải O(2n): bỏ hằng số
for (...) {}   // n
for (...) {}   // n  -> tổng 2n -> O(n)

// O(n + m) chứ không phải O(n): hai đầu vào độc lập giữ cả hai
```

Ba quy tắc rút gọn:
- **Bỏ hằng số**: O(3n) → O(n).
- **Giữ số hạng lớn nhất**: O(n² + n) → O(n²).
- **Đầu vào khác nhau dùng biến khác nhau**: duyệt mảng `a` rồi mảng `b` là O(a + b).

### Chi phí ẩn trong API Java — bẫy của người mới
```java
for (String id : ids) {                // n lần
    if (list.contains(id)) { ... }     // contains trên ArrayList là O(n)!
}                                      // → tổng O(n²)

Set<String> set = new HashSet<>(list); // O(n) một lần
for (String id : ids) {
    if (set.contains(id)) { ... }      // O(1)
}                                      // → tổng O(n)
```
Tương tự: `String +=` trong vòng lặp là O(n²) (mỗi lần tạo chuỗi mới), `list.remove(0)` trên `ArrayList` là O(n), `list.get(i)` trên `LinkedList` là O(n).

### Độ phức tạp bộ nhớ
Đếm bộ nhớ **thêm vào** ngoài đầu vào. Tạo thêm một `HashMap` n phần tử → O(n). Chỉ dùng vài biến → O(1). Đệ quy sâu n tầng → O(n) (mỗi tầng chiếm một khung trên call stack).

### Amortized (khấu hao)
`ArrayList.add()` thỉnh thoảng phải copy toàn bộ mảng (O(n)) khi đầy, nhưng vì mỗi lần mở rộng gấp 1.5 lần nên **tính trung bình** mỗi lần `add` vẫn là O(1). Đó là ý nghĩa của "O(1) trung bình" bạn gặp ở Module 03.

---

## 2. Đệ quy

Đệ quy = hàm tự gọi chính nó với **bài toán nhỏ hơn**. Bắt buộc có 2 phần:
1. **Điều kiện dừng (base case)** — trường hợp đủ nhỏ để trả lời ngay.
2. **Bước đệ quy** — đưa bài toán về bài nhỏ hơn và *tiến gần* tới điều kiện dừng.

```java
static long factorial(int n) {
    if (n <= 1) return 1;              // điều kiện dừng
    return n * factorial(n - 1);       // bài nhỏ hơn
}
```

Mỗi lần gọi hàm chiếm một **khung (frame)** trên call stack (Module 07). Quên điều kiện dừng hoặc đệ quy quá sâu (khoảng vài nghìn đến vài chục nghìn tầng) → `StackOverflowError`.

### Bẫy: tính lại cùng một thứ nhiều lần
```java
static long fib(int n) {               // O(2ⁿ) — fib(50) chạy vài phút
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}
```
`fib(5)` gọi `fib(3)` 2 lần, `fib(2)` 3 lần... Sửa bằng **ghi nhớ (memoization)**: lưu kết quả đã tính vào mảng/Map → O(n). Đây chính là ý tưởng của quy hoạch động (mục 12).

### Khi nào dùng đệ quy?
- Cấu trúc tự nhiên là đệ quy: **cây**, thư mục lồng nhau, JSON lồng nhau, menu nhiều cấp.
- Chia để trị: merge sort, quick sort.
- Quay lui (backtracking): sinh hoán vị, tổ hợp.

Còn lại, vòng lặp thường dễ đọc hơn và không lo tràn stack.

---

## 3. Mảng & chuỗi — ba kỹ thuật dùng nhiều nhất

### 3.1 Hai con trỏ (two pointers)
Dùng khi mảng **đã sắp xếp**, hoặc cần so sánh hai đầu.
```java
// Mảng đã sắp xếp, tìm 2 số có tổng = target. O(n) thay vì O(n²)
static int[] twoSumSorted(int[] a, int target) {
    int left = 0, right = a.length - 1;
    while (left < right) {
        int sum = a[left] + a[right];
        if (sum == target) return new int[]{left, right};
        if (sum < target) left++;      // cần tổng lớn hơn -> dịch trái sang phải
        else right--;                  // cần tổng nhỏ hơn -> dịch phải sang trái
    }
    return new int[0];
}
```
Dạng biến thể: đảo mảng tại chỗ, kiểm tra palindrome, khử trùng mảng đã sắp xếp, gộp 2 mảng đã sắp xếp.

### 3.2 Cửa sổ trượt (sliding window)
Dùng khi đề hỏi về **đoạn con liên tiếp** (subarray/substring): dài nhất, ngắn nhất, tổng lớn nhất trong k phần tử...
```java
// Tổng lớn nhất của k phần tử liên tiếp. O(n) thay vì O(n·k)
static int maxSumWindow(int[] a, int k) {
    int window = 0;
    for (int i = 0; i < k; i++) window += a[i];
    int best = window;
    for (int i = k; i < a.length; i++) {
        window += a[i] - a[i - k];     // thêm phần tử mới, bỏ phần tử rơi khỏi cửa sổ
        best = Math.max(best, window);
    }
    return best;
}
```
Cửa sổ **co giãn** (độ dài thay đổi): mở rộng bên phải, khi vi phạm điều kiện thì thu hẹp bên trái. Ví dụ kinh điển: *chuỗi con dài nhất không có ký tự lặp* (xem `ArrayTechniques.java`).

### 3.3 Mảng cộng dồn (prefix sum)
Dùng khi phải hỏi **tổng đoạn [i, j]** rất nhiều lần.
```java
long[] prefix = new long[n + 1];
for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + a[i];
// tổng a[i..j] = prefix[j + 1] - prefix[i]   -> O(1) mỗi truy vấn
```
Ứng dụng backend: báo cáo doanh thu lũy kế, đây cũng chính là `SUM() OVER (ORDER BY ...)` trong SQL (Module 08).

---

## 4. Bảng băm (hashing) — vũ khí số 1

Phần lớn bài "tìm cặp", "đếm", "có trùng không", "nhóm lại" đều giải bằng `HashMap`/`HashSet` trong O(n).

```java
// Two Sum (mảng CHƯA sắp xếp): tìm 2 chỉ số có tổng = target
static int[] twoSum(int[] a, int target) {
    Map<Integer, Integer> seen = new HashMap<>();      // giá trị -> chỉ số
    for (int i = 0; i < a.length; i++) {
        Integer j = seen.get(target - a[i]);
        if (j != null) return new int[]{j, i};
        seen.put(a[i], i);
    }
    return new int[0];
}
```
Tư duy: *"Nếu tôi đã biết hết những gì đứng trước, tôi cần tra cứu cái gì?"* → cái đó cho vào Map.

Dạng bài: đếm tần suất, nhóm anagram (`Map<String, List<String>>` với key là chuỗi đã sắp xếp), phần tử xuất hiện đầu tiên không lặp, tổng đoạn con bằng k (prefix sum + HashMap).

> Nhắc lại Module 03: `HashMap` O(1) *trung bình*. Nếu `hashCode()` tệ (mọi object trả cùng một số) thì mọi phần tử rơi vào một bucket → O(n) (Java 8+ cải thiện thành O(log n) nhờ chuyển bucket sang cây).

---

## 5. Sắp xếp

Đi làm bạn gần như **không bao giờ** tự viết thuật toán sắp xếp — dùng `Arrays.sort`, `List.sort`, `ORDER BY`. Nhưng phải hiểu để trả lời phỏng vấn và vì merge sort/quick sort là ví dụ đẹp nhất của *chia để trị*.

| Thuật toán | Trung bình | Xấu nhất | Bộ nhớ | Ổn định? | Ghi chú |
|---|---|---|---|---|---|
| Bubble / Selection | O(n²) | O(n²) | O(1) | Bubble có | chỉ để học |
| Insertion | O(n²) | O(n²) | O(1) | có | rất nhanh với mảng **gần như đã sắp xếp** hoặc nhỏ |
| Merge sort | O(n log n) | O(n log n) | O(n) | **có** | chia đôi, sắp từng nửa, trộn lại |
| Quick sort | O(n log n) | O(n²) | O(log n) | không | chọn chốt, chia 2 phía; nhanh nhất thực tế |
| Heap sort | O(n log n) | O(n log n) | O(1) | không | |
| Counting sort | O(n + k) | | O(k) | có | chỉ khi giá trị nằm trong khoảng nhỏ k |

**Ổn định (stable)** = hai phần tử bằng nhau giữ nguyên thứ tự ban đầu. Quan trọng khi sắp nhiều lần: sắp danh sách nhân viên theo tên rồi sắp theo phòng ban, stable sort giữ cho người trong cùng phòng vẫn theo thứ tự tên.

**Java thực tế dùng gì?** (câu hỏi phỏng vấn hay gặp)
- `Arrays.sort(int[])` — mảng nguyên thủy: **Dual-Pivot Quicksort** (không cần stable vì hai số `5` giống hệt nhau).
- `Arrays.sort(Object[])`, `List.sort`, `Collections.sort` — **TimSort** (lai merge + insertion), **stable**, O(n log n), cực nhanh với dữ liệu đã sắp xếp một phần.

### Merge sort — chia để trị
```
[5 2 8 1 9 3]
   chia đôi            [5 2 8]        [1 9 3]
   chia tiếp        [5] [2 8]      [1] [9 3]
   ...              trộn lên dần
   trộn 2 nửa đã sắp  [2 5 8]  +  [1 3 9]  ->  [1 2 3 5 8 9]
```
Có log n tầng chia, mỗi tầng trộn tốn O(n) → O(n log n). Code đầy đủ trong `SortingDemo.java`.

---

## 6. Tìm kiếm nhị phân (binary search)

Điều kiện: dữ liệu **đã sắp xếp** (hoặc tổng quát hơn: có tính *đơn điệu* — từ một điểm trở đi điều kiện luôn đúng).

```java
static int binarySearch(int[] a, int target) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;      // KHÔNG viết (lo + hi) / 2 — tràn số khi lo + hi > 2^31
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
```
Mỗi bước loại một nửa → O(log n). 1 tỷ phần tử chỉ cần 30 bước.

Bug `(lo + hi) / 2` có thật: nó nằm trong `Arrays.binarySearch` của JDK suốt 9 năm trước khi được sửa năm 2006.

### Tìm kiếm nhị phân trên đáp án
Dạng nâng cao, rất hay gặp: *"tìm giá trị nhỏ nhất X sao cho điều kiện(X) đúng"*, khi điều kiện đơn điệu.
Ví dụ: *Có n kiện hàng, cần chở hết trong D ngày, sức chở tối thiểu của xe là bao nhiêu?* → Thử sức chở `mid`, đếm số ngày cần; nếu ≤ D thì thử nhỏ hơn, không thì lớn hơn. Xem `BinarySearchDemo.java`.

Trong thư viện Java: `Arrays.binarySearch`, `Collections.binarySearch`, và `TreeMap.floorKey/ceilingKey` (tìm key gần nhất).

---

## 7. Stack & Queue

| | Nguyên tắc | Java dùng | Thao tác |
|---|---|---|---|
| Stack | LIFO — vào sau ra trước | `ArrayDeque` (**không** dùng class `Stack` cũ) | `push`, `pop`, `peek` |
| Queue | FIFO — vào trước ra trước | `ArrayDeque` | `offer`, `poll`, `peek` |

**Stack** dùng khi cần "quay lại cái gần nhất": kiểm tra ngoặc hợp lệ, undo, tính biểu thức, duyệt DFS không đệ quy. Chính JVM dùng stack cho lời gọi hàm.

**Queue** dùng khi xử lý "theo lượt": BFS, hàng đợi công việc. Kafka/RabbitMQ (Module 14) về bản chất là queue phân tán.

**Monotonic stack** (stack đơn điệu) — dạng bài "phần tử lớn hơn tiếp theo":
```java
// Với mỗi ngày, bao nhiêu ngày nữa thì nhiệt độ ấm hơn? O(n)
static int[] dailyTemperatures(int[] t) {
    int[] result = new int[t.length];
    Deque<Integer> stack = new ArrayDeque<>();          // lưu CHỈ SỐ các ngày chưa tìm được đáp án
    for (int i = 0; i < t.length; i++) {
        while (!stack.isEmpty() && t[i] > t[stack.peek()]) {
            int j = stack.pop();
            result[j] = i - j;
        }
        stack.push(i);
    }
    return result;
}
```

---

## 8. Danh sách liên kết (linked list)

Mỗi node giữ giá trị và con trỏ tới node sau. Không có truy cập theo chỉ số → `get(i)` là O(n).

```java
class Node { int val; Node next; Node(int v) { val = v; } }
```

Ba bài phải tự viết được không cần tra (đều có trong `MyLinkedList.java`):

**Đảo ngược** — dùng 3 con trỏ:
```java
static Node reverse(Node head) {
    Node prev = null, cur = head;
    while (cur != null) {
        Node next = cur.next;   // giữ lại phần còn lại
        cur.next = prev;        // đảo chiều mũi tên
        prev = cur;
        cur = next;
    }
    return prev;
}
```
**Tìm node giữa** — con trỏ nhanh đi 2 bước, chậm đi 1 bước; nhanh tới cuối thì chậm ở giữa.
**Phát hiện vòng lặp (Floyd)** — cũng nhanh/chậm; nếu có vòng thì hai con trỏ sẽ gặp nhau.

---

## 9. Cây (tree)

```
            8          <- gốc (root)
          /   \
         3     10
        / \      \
       1   6      14   <- lá (leaf): không có con
          / \
         4   7
```

**Cây nhị phân tìm kiếm (BST)**: mọi node bên trái < node hiện tại < mọi node bên phải. Tìm/thêm/xóa O(log n) nếu cây **cân bằng**, O(n) nếu lệch (thêm 1, 2, 3, 4... theo thứ tự sẽ thành một đường thẳng).
→ Vì thế Java dùng **cây đỏ-đen** (tự cân bằng) cho `TreeMap`/`TreeSet`.

### Bốn cách duyệt
| Cách | Thứ tự | Với cây trên | Dùng khi |
|---|---|---|---|
| Pre-order | gốc → trái → phải | 8 3 1 6 4 7 10 14 | copy cây, in cây thư mục |
| **In-order** | trái → gốc → phải | 1 3 4 6 7 8 10 14 | BST → ra dãy **đã sắp xếp** |
| Post-order | trái → phải → gốc | 1 4 7 6 3 14 10 8 | xóa cây, tính dung lượng thư mục |
| Level-order (BFS) | theo từng tầng | 8 3 10 1 6 14 4 7 | tầng gần gốc nhất, in theo tầng |

Ba cách đầu viết bằng đệ quy chỉ 4 dòng. Level-order dùng `Queue`.

```java
static int height(TreeNode node) {
    if (node == null) return 0;
    return 1 + Math.max(height(node.left), height(node.right));
}
```
Hầu hết bài cây đều theo khuôn: *"trả lời cho node = kết hợp câu trả lời của con trái và con phải"*.

**Liên hệ backend**
- Index trong PostgreSQL/MySQL là **B+ tree**: cây có rất nhiều nhánh mỗi node (hàng trăm), nên 1 tỷ dòng chỉ cao 3–4 tầng → 3–4 lần đọc đĩa. Đó là lý do `WHERE id = ?` nhanh còn `WHERE LOWER(email) = ?` (không có index phù hợp) phải quét toàn bảng (Module 08).
- Dữ liệu phân cấp (danh mục sản phẩm, phòng ban, bình luận lồng nhau) lưu trong DB bằng cột `parent_id` và duyệt bằng đệ quy hoặc `WITH RECURSIVE` trong SQL.

---

## 10. Heap & PriorityQueue

Heap là cây nhị phân gần đầy, node cha luôn ≤ (min-heap) mọi node con. Lấy phần tử nhỏ nhất O(1), thêm/xóa O(log n). Java: `PriorityQueue` (mặc định min-heap).

**Bài kinh điển: Top K** — *"tìm k phần tử lớn nhất trong n phần tử"*:
- Sắp xếp rồi lấy k cái đầu: O(n log n).
- Min-heap giữ đúng k phần tử, gặp phần tử lớn hơn đỉnh heap thì thay: **O(n log k)**. Với n = 10 triệu, k = 10 thì nhanh hơn hẳn và chỉ tốn bộ nhớ O(k) — xử lý được cả dữ liệu dạng luồng không nạp hết vào RAM.

```java
PriorityQueue<Integer> heap = new PriorityQueue<>();      // min-heap
for (int x : nums) {
    heap.offer(x);
    if (heap.size() > k) heap.poll();                      // bỏ cái nhỏ nhất
}
// heap chứa k số lớn nhất
```
Ứng dụng: top 10 sản phẩm bán chạy, lập lịch job theo độ ưu tiên, trộn k file log đã sắp xếp theo thời gian.

---

## 11. Đồ thị (graph)

Đồ thị = tập **đỉnh** + tập **cạnh** nối các đỉnh. Có hướng (A theo dõi B) hoặc vô hướng (A là bạn B).

Biểu diễn phổ biến nhất — **danh sách kề**:
```java
Map<String, List<String>> graph = new HashMap<>();
graph.computeIfAbsent("A", k -> new ArrayList<>()).add("B");
```

### BFS — duyệt theo chiều rộng
Đi theo từng "vòng" từ điểm xuất phát, dùng **Queue**. Tìm được **đường đi ngắn nhất** trên đồ thị không trọng số (bạn của bạn cách mấy bước, ít lần chuyển tuyến xe buýt nhất).
```java
static Map<String, Integer> bfs(Map<String, List<String>> g, String start) {
    Map<String, Integer> dist = new HashMap<>();
    Deque<String> queue = new ArrayDeque<>();
    dist.put(start, 0);
    queue.offer(start);
    while (!queue.isEmpty()) {
        String cur = queue.poll();
        for (String next : g.getOrDefault(cur, List.of())) {
            if (!dist.containsKey(next)) {           // chưa thăm
                dist.put(next, dist.get(cur) + 1);
                queue.offer(next);
            }
        }
    }
    return dist;
}
```

### DFS — duyệt theo chiều sâu
Đi sâu hết một nhánh rồi mới quay lui, dùng đệ quy (hoặc Stack). Dùng để: đếm số vùng liên thông (bài "đếm số đảo" trên lưới), phát hiện chu trình, sắp xếp topo.

**Luôn nhớ tập `visited`** — thiếu nó, đồ thị có chu trình sẽ làm chương trình lặp vô hạn.

### Sắp xếp topo (topological sort)
Sắp các đỉnh sao cho mọi cạnh A → B thì A đứng trước B. Chỉ làm được khi đồ thị **không có chu trình**.
Bạn gặp nó mỗi ngày mà không để ý:
- Maven build module theo thứ tự phụ thuộc.
- Spring tạo bean: bean được tiêm vào phải tạo trước. Có chu trình A → B → A thì Spring báo `BeanCurrentlyInCreationException` — đó chính là "phát hiện chu trình" (Module 10).
- Flyway chạy migration, hệ thống CI chạy job theo `needs:`.

Thuật toán Kahn: đếm số cạnh đi vào mỗi đỉnh, bỏ các đỉnh có số đó bằng 0 vào queue, lấy ra thì giảm số của các đỉnh kề. Code trong `GraphDemo.java`.

### Đường đi ngắn nhất có trọng số
Cạnh có độ dài khác nhau (bản đồ, phí vận chuyển) → **Dijkstra** dùng `PriorityQueue`, O((V + E) log V). Mức Junior chỉ cần biết tên, ý tưởng và khi nào dùng; code có trong `GraphDemo.java` để đọc tham khảo.

---

## 12. Quy hoạch động (dynamic programming) — nhập môn

Quy hoạch động = đệ quy + **ghi nhớ kết quả bài con** để không tính lại. Dùng khi bài toán có:
1. **Bài con chồng lấn**: cùng một bài con được hỏi nhiều lần (như `fib`).
2. **Cấu trúc con tối ưu**: đáp án tốt nhất xây từ đáp án tốt nhất của bài con.

Quy trình 4 bước:
1. Định nghĩa trạng thái: `dp[i]` nghĩa là gì? (viết ra bằng lời!)
2. Công thức chuyển: `dp[i]` tính từ các `dp` nhỏ hơn thế nào?
3. Giá trị khởi đầu.
4. Đáp án nằm ở đâu.

**Ví dụ — leo cầu thang**: mỗi lần leo 1 hoặc 2 bậc, có bao nhiêu cách lên bậc n?
1. `dp[i]` = số cách lên tới bậc i.
2. Muốn tới bậc i thì bước cuối xuất phát từ bậc i-1 hoặc i-2 → `dp[i] = dp[i-1] + dp[i-2]`.
3. `dp[0] = 1, dp[1] = 1`.
4. Đáp án `dp[n]`.

**Ví dụ — đổi tiền**: có các mệnh giá `[1000, 2000, 5000]`, đổi số tiền X với ít tờ nhất?
- `dp[x]` = số tờ ít nhất để đổi x.
- `dp[x] = min(dp[x - coin] + 1)` với mọi `coin ≤ x`.
- Chú ý: thuật toán **tham lam** (luôn lấy tờ to nhất) sai với mệnh giá `[1, 3, 4]` và x = 6: tham lam cho 4+1+1 (3 tờ), tối ưu là 3+3 (2 tờ). Code minh họa trong `DynamicProgrammingDemo.java`.

Mức Junior: làm được các bài DP một chiều (cầu thang, nhà cướp, đổi tiền, dãy con tăng dài nhất) là đủ.

---

## 13. Nhận diện dạng bài — bảng tra

| Tín hiệu trong đề | Nghĩ tới |
|---|---|
| Mảng **đã sắp xếp**, tìm cặp / bộ ba | Hai con trỏ |
| Mảng đã sắp xếp, tìm vị trí / giá trị | Tìm kiếm nhị phân |
| "Nhỏ nhất sao cho..." / "lớn nhất sao cho..." với điều kiện đơn điệu | Nhị phân trên đáp án |
| **Đoạn con liên tiếp** dài/ngắn nhất thỏa điều kiện | Cửa sổ trượt |
| Tổng đoạn [i, j] nhiều lần | Prefix sum |
| "Đã thấy chưa?", đếm, cặp có tổng bằng... | HashMap / HashSet |
| Ngoặc, "phần tử lớn hơn tiếp theo", undo | Stack |
| Top K, phần tử lớn thứ K, trộn K danh sách | Heap |
| Đường đi ngắn nhất (không trọng số), theo tầng | BFS |
| Tất cả khả năng / tổ hợp / hoán vị | Quay lui (backtracking) |
| Đếm số cách / tối ưu, có bài con chồng lấn | Quy hoạch động |
| Thứ tự phụ thuộc | Sắp xếp topo |

Và bảng **ràng buộc → độ phức tạp cần đạt**:

| n tối đa | Cần đạt khoảng |
|---|---|
| ≤ 20 | O(2ⁿ) — quay lui được |
| ≤ 1.000 | O(n²) |
| ≤ 100.000 | O(n log n) |
| ≤ 10.000.000 | O(n) |
| lớn hơn | O(log n) hoặc O(1) |

---

## 14. Luyện tập — làm thế nào cho hiệu quả

1. **Mỗi bài tối đa 30–45 phút.** Bí thì xem lời giải, hiểu, **đóng lại và tự viết lại từ đầu**, 3 ngày sau làm lại.
2. **Học theo dạng, không học theo số lượng.** 80 bài chia đúng 12 dạng ở bảng trên giá trị hơn 300 bài làm lung tung.
3. **Nói to cách làm** trước khi code — luyện luôn kỹ năng phỏng vấn (xem [interview/coding-test.md](../interview/coding-test.md)).
4. **Luôn ghi độ phức tạp** thời gian và bộ nhớ ở đầu lời giải.
5. Nền tảng gợi ý: LeetCode (danh sách "Top Interview 150", "NeetCode 150"), HackerRank, và các bài trong [bai-tap.md](bai-tap.md).

---

## Tổng kết
- Big-O đo **tốc độ tăng**. n ≤ 10⁵ thì tránh O(n²).
- Cẩn thận chi phí ẩn: `list.contains` trong vòng lặp, `String +=`, gọi DB trong vòng lặp.
- 80% bài phỏng vấn Junior giải bằng: HashMap, hai con trỏ, cửa sổ trượt, sắp xếp, tìm kiếm nhị phân, BFS/DFS.
- Cây và đồ thị có mặt khắp nơi trong backend: index DB, `TreeMap`, thứ tự tạo bean, thứ tự build.
- Quy hoạch động = đệ quy + ghi nhớ.

## Code trong module
Mỗi file chạy độc lập, không cần biên dịch trước:
```bash
java 03b-dsa/src/dsa/ComplexityDemo.java
```
- [src/dsa/ComplexityDemo.java](src/dsa/ComplexityDemo.java) — đo thời gian O(n²) vs O(n), chi phí ẩn của `contains`
- [src/dsa/RecursionDemo.java](src/dsa/RecursionDemo.java) — đệ quy, memoization, quay lui (hoán vị, tập con)
- [src/dsa/ArrayTechniques.java](src/dsa/ArrayTechniques.java) — hai con trỏ, cửa sổ trượt, prefix sum, two sum
- [src/dsa/SortingDemo.java](src/dsa/SortingDemo.java) — insertion, merge, quick sort + so sánh tốc độ + tính ổn định
- [src/dsa/BinarySearchDemo.java](src/dsa/BinarySearchDemo.java) — tìm kiếm nhị phân, cận trái/phải, nhị phân trên đáp án
- [src/dsa/StackQueueHeapDemo.java](src/dsa/StackQueueHeapDemo.java) — ngoặc hợp lệ, monotonic stack, top K
- [src/dsa/MyLinkedList.java](src/dsa/MyLinkedList.java) — tự cài linked list, đảo ngược, tìm giữa, phát hiện vòng
- [src/dsa/BinaryTreeDemo.java](src/dsa/BinaryTreeDemo.java) — BST, 4 cách duyệt, chiều cao, kiểm tra BST hợp lệ
- [src/dsa/GraphDemo.java](src/dsa/GraphDemo.java) — BFS, DFS, đếm đảo, sắp xếp topo, Dijkstra
- [src/dsa/DynamicProgrammingDemo.java](src/dsa/DynamicProgrammingDemo.java) — cầu thang, nhà cướp, đổi tiền, dãy con tăng

👉 Làm [bai-tap.md](bai-tap.md). Module này học **song song**: tiếp tục sang [Module 04 — Exception & I/O](../04-exception-io/) và dành 2–3 giờ mỗi tuần luyện bài.
