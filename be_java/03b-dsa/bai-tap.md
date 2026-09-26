# Bài tập Module 03b — Cấu trúc dữ liệu & Giải thuật

> Quy tắc chung cho mọi bài:
> - Đầu lời giải ghi **độ phức tạp thời gian và bộ nhớ**.
> - Viết hàm `main` tự kiểm tra ít nhất 4 trường hợp: ví dụ đề bài, rỗng/null, một phần tử, trường hợp biên (trùng lặp, số âm, giá trị lớn).
> - Mỗi bài tối đa 45 phút. Bí thì đọc gợi ý, vẫn bí thì xem lời giải trên mạng, **đóng lại và tự viết lại**.
> - Tên trong ngoặc là tên bài tương ứng trên LeetCode để bạn nộp kiểm tra tự động.

## Nhóm A — Big-O (làm trên giấy)

**A1.** Cho độ phức tạp của từng đoạn:
```java
// (a)
for (int i = 0; i < n; i++) for (int j = 0; j < 100; j++) ...
// (b)
for (int i = 1; i < n; i *= 2) ...
// (c)
for (int i = 0; i < n; i++) for (int j = i; j > 0; j /= 2) ...
// (d)
for (String id : ids) { if (list.contains(id)) ... }         // list là ArrayList m phần tử
// (e)
for (Order o : orders) { userRepository.findById(o.getUserId()); }   // mỗi lần gọi là 1 query DB
```
*Đạt khi*: (a) O(n), (b) O(log n), (c) O(n log n), (d) O(n·m), và giải thích được (e) là N+1 query — độ phức tạp không đổi nhưng mỗi "thao tác" tốn vài ms qua mạng.

**A2.** Đề cho n ≤ 200.000. Lời giải O(n²) của bạn có qua không? Vì sao? Cần đạt độ phức tạp nào?

**A3.** Viết lại đoạn sau từ O(n²) thành O(n):
```java
List<Integer> common = new ArrayList<>();
for (int a : listA) for (int b : listB) if (a == b) common.add(a);
```

## Nhóm B — Mảng, chuỗi, hashing (Easy)

**B1.** Two Sum — trả về chỉ số 2 phần tử có tổng bằng target. *(LeetCode 1)*
**B2.** Contains Duplicate. *(217)*
**B3.** Valid Anagram. *(242)*
**B4.** Valid Palindrome — bỏ qua ký tự không phải chữ/số, không phân biệt hoa thường. *(125)*
**B5.** Best Time to Buy and Sell Stock — mua 1 lần, bán 1 lần, lãi lớn nhất. *(121)* *Gợi ý*: giữ giá thấp nhất đã thấy.
**B6.** Move Zeroes — đưa số 0 về cuối, giữ thứ tự phần còn lại, tại chỗ. *(283)*
**B7.** Majority Element — phần tử xuất hiện hơn n/2 lần. *(169)* Làm 2 cách: HashMap O(n) bộ nhớ, và Boyer-Moore O(1) bộ nhớ.
**B8.** Merge Sorted Array — gộp vào mảng thứ nhất, không dùng mảng phụ. *(88)* *Gợi ý*: gộp từ cuối lên.

## Nhóm C — Hai con trỏ, cửa sổ trượt, prefix sum (Medium)

**C1.** 3Sum — mọi bộ ba có tổng bằng 0, không trùng. *(15)* *Gợi ý*: sắp xếp + cố định 1 số + hai con trỏ.
**C2.** Container With Most Water. *(11)*
**C3.** Longest Substring Without Repeating Characters. *(3)*
**C4.** Minimum Size Subarray Sum. *(209)*
**C5.** Longest Repeating Character Replacement. *(424)*
**C6.** Subarray Sum Equals K. *(560)* *Gợi ý*: prefix sum + HashMap.
**C7.** Product of Array Except Self — không dùng phép chia. *(238)*
**C8.** Group Anagrams. *(49)*
**C9.** Top K Frequent Elements. *(347)* Làm bằng heap, sau đó thử bằng "bucket sort" O(n).

## Nhóm D — Sắp xếp & tìm kiếm nhị phân

**D1.** Tự cài `mergeSort` và `quickSort` cho `int[]` **không nhìn code mẫu**. Viết test so kết quả với `Arrays.sort` trên 1.000 mảng ngẫu nhiên.
*Đạt khi*: cả 1.000 lần đều khớp.

**D2.** Sort Colors — mảng chỉ gồm 0, 1, 2; sắp xếp một lượt, tại chỗ. *(75)*
**D3.** Merge Intervals — gộp các khoảng thời gian chồng nhau. *(56)* Ứng dụng: gộp lịch họp, gộp khung giờ đặt phòng.
**D4.** Binary Search. *(704)*
**D5.** Find First and Last Position of Element in Sorted Array. *(34)*
**D6.** Search in Rotated Sorted Array. *(33)*
**D7.** Koko Eating Bananas — nhị phân trên đáp án. *(875)*
**D8.** Tự viết `Comparator` sắp danh sách đơn hàng: trạng thái (`PENDING` trước), rồi tổng tiền giảm dần, rồi ngày tạo tăng dần. Kiểm chứng sắp xếp **ổn định**.

## Nhóm E — Stack, Queue, Heap

**E1.** Valid Parentheses. *(20)*
**E2.** Min Stack — `push/pop/top/getMin` đều O(1). *(155)*
**E3.** Daily Temperatures. *(739)*
**E4.** Implement Queue using Stacks. *(232)*
**E5.** Kth Largest Element in an Array. *(215)*
**E6.** Merge k Sorted Lists. *(23)*
**E7. Rate limiter cửa sổ trượt.** Viết class `SlidingWindowRateLimiter(int maxRequests, Duration window)` với `boolean allow(String userId, Instant now)`. Dùng `Map<String, Deque<Instant>>`.
*Đạt khi*: người dùng gửi request thứ `max + 1` trong cùng cửa sổ bị từ chối; sau khi cửa sổ trôi qua thì được phép lại. (Bạn sẽ gặp lại bài này ở API Gateway, Module 15.)

## Nhóm F — Linked list & cây

**F1.** Reverse Linked List — làm cả vòng lặp và đệ quy. *(206)*
**F2.** Linked List Cycle. *(141)*
**F3.** Remove Nth Node From End of List. *(19)*
**F4.** Maximum Depth of Binary Tree. *(104)*
**F5.** Invert Binary Tree. *(226)*
**F6.** Validate Binary Search Tree. *(98)*
**F7.** Binary Tree Level Order Traversal. *(102)*
**F8.** Lowest Common Ancestor of a BST. *(235)*
**F9. Cây danh mục sản phẩm.** Cho `List<Category(id, name, parentId)>` lấy từ DB (parentId null là gốc):
- Dựng cây trong **O(n)** (không lồng vòng lặp — dùng `Map<Long, List<Category>>`).
- In cây thụt lề theo cấp.
- Viết hàm lấy **mọi danh mục con cháu** của một id (để lọc sản phẩm "Điện tử" gồm cả "Laptop", "Điện thoại"...).
- Viết hàm lấy **đường dẫn breadcrumb** từ gốc tới một danh mục: `Điện tử > Máy tính > Laptop`.
*Đạt khi*: chạy đúng với 10.000 danh mục trong dưới 50 ms.

## Nhóm G — Đồ thị

**G1.** Number of Islands. *(200)*
**G2.** Flood Fill. *(733)*
**G3.** Course Schedule — có học hết được các môn với điều kiện tiên quyết không? *(207)* Đây chính là phát hiện chu trình.
**G4.** Rotting Oranges — BFS nhiều điểm xuất phát. *(994)*
**G5. Thứ tự chạy migration.** Cho danh sách migration và phụ thuộc giữa chúng, in ra thứ tự chạy hợp lệ, hoặc báo lỗi chỉ rõ các migration nằm trong chu trình.

## Nhóm H — Đệ quy, quay lui, quy hoạch động

**H1.** Climbing Stairs. *(70)*
**H2.** House Robber. *(198)*
**H3.** Coin Change. *(322)*
**H4.** Longest Increasing Subsequence. *(300)*
**H5.** Subsets. *(78)*
**H6.** Permutations. *(46)*
**H7.** Combination Sum. *(39)*
**H8.** Word Break. *(139)*

## Nhóm I — Tổng hợp (mô phỏng bài phỏng vấn)

**I1. LRU Cache** *(146)* — **không** dùng `LinkedHashMap`. Tự kết hợp `HashMap` + danh sách liên kết đôi để `get` và `put` đều O(1).
*Đạt khi*: giải thích được vì sao cần cả hai cấu trúc.

**I2. Autocomplete.** Cài đặt Trie với `insert(word)`, `startsWith(prefix)` trả về tối đa 5 từ gợi ý. *(208)*

**I3. Phân tích log lớn.** File 1 triệu dòng `timestamp userId endpoint latencyMs`. Tìm: top 10 endpoint chậm nhất theo trung bình, top 10 user gọi nhiều nhất, và p95 latency của mỗi endpoint.
*Đạt khi*: đọc file theo luồng (không nạp hết vào RAM), dùng heap cho top 10, chạy dưới 3 giây. Tự sinh file test bằng code.

---

## Kế hoạch luyện gợi ý (song song với các module sau)

| Tuần khóa học | Làm nhóm |
|---|---|
| 5–6 | A, B |
| 7–8 | C, D |
| 9–10 | E, F |
| 11–13 | G, H |
| 14 trở đi | I, rồi luyện lại các bài đã làm sai, sau đó theo danh sách "NeetCode 150" |

## Câu hỏi phỏng vấn tự trả lời
1. Big-O là gì? Vì sao bỏ hằng số?
2. `HashMap.get` là O(1) — trường hợp nào nó thành O(n) hoặc O(log n)?
3. `ArrayList.add` là O(1) "khấu hao" nghĩa là gì?
4. Merge sort và quick sort khác nhau thế nào? `Arrays.sort` dùng thuật toán nào?
5. Sắp xếp ổn định là gì? Cho ví dụ khi nào cần.
6. Vì sao index DB dùng B-tree chứ không dùng cây nhị phân hay bảng băm?
7. BFS và DFS khác nhau thế nào? Khi nào dùng cái nào?
8. Làm sao phát hiện chu trình phụ thuộc? Spring làm gì khi hai bean phụ thuộc vòng?
9. Quy hoạch động khác đệ quy thông thường ở điểm nào?
10. Tìm top 10 trong 1 tỷ số không đủ RAM để chứa hết — làm thế nào?
