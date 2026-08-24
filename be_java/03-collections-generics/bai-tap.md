# Bài tập Module 03 — Collections & Generics

## Nhóm A — List

**A1.** Nhập n số, lưu vào `ArrayList`, in: tổng, trung bình, max, min, số phần tử chẵn.

**A2.** Khử trùng lặp một `List<String>` mà **vẫn giữ nguyên thứ tự** xuất hiện. Làm bằng 2 cách (LinkedHashSet và vòng lặp thủ công).

**A3.** Trộn 2 list đã sắp xếp thành 1 list đã sắp xếp (merge, không dùng `sort`).

**A4.** Xoay list sang phải k vị trí: `[1,2,3,4,5]`, k=2 → `[4,5,1,2,3]`.

**A5.** Xóa mọi phần tử thỏa điều kiện trong lúc duyệt, bằng `Iterator` và bằng `removeIf`. Chứng minh cách dùng for-each sẽ ném `ConcurrentModificationException`.

## Nhóm B — Set

**B1.** Tìm phần tử chung, riêng của 2 danh sách bằng `retainAll`/`removeAll`.

**B2.** Kiểm tra một mảng có phần tử trùng lặp không, độ phức tạp O(n).

**B3.** Cho class `Product(id, name, price)`. Bỏ 2 sản phẩm cùng `id` vào `HashSet` và giải thích kết quả trước/sau khi override `equals`+`hashCode`.

**B4.** Dùng `TreeSet` lấy: số nhỏ nhất > 100, số lớn nhất < 50, tất cả số trong khoảng [20, 80].

## Nhóm C — Map (quan trọng nhất)

**C1. Đếm tần suất từ** trong một đoạn văn, in top 5 từ xuất hiện nhiều nhất.

**C2. Đếm tần suất ký tự** trong chuỗi, bỏ qua khoảng trắng, in theo thứ tự alphabet (`TreeMap`).

**C3. Danh bạ điện thoại**: thêm/sửa/xóa/tìm theo tên, tìm theo số, in toàn bộ theo thứ tự tên.

**C4. Gom nhóm sinh viên theo lớp** bằng `computeIfAbsent`, sau đó in điểm TB mỗi lớp.

**C5. Đảo ngược Map**: `Map<String,String>` → `Map<String,List<String>>` (vì value có thể trùng).

**C6. Giỏ hàng**: `Map<Product,Integer>` (sản phẩm → số lượng). Thêm sản phẩm đã có thì tăng số lượng (`merge`). Tính tổng tiền.

**C7. LRU Cache** dung lượng N, dùng `LinkedHashMap` với `accessOrder = true` và override `removeEldestEntry`.
*Đạt khi*: thêm phần tử thứ N+1 thì phần tử ít dùng nhất tự bị loại.

## Nhóm D — Queue / Deque

**D1.** Kiểm tra chuỗi ngoặc hợp lệ `"{[()]}"` bằng `ArrayDeque` làm stack.

**D2.** Mô phỏng hàng đợi in ấn: các job vào hàng, xử lý theo FIFO, in nhật ký.

**D3.** `PriorityQueue<Task>` với `Task(name, priority, deadline)`: lấy ra task ưu tiên cao nhất, cùng mức ưu tiên thì deadline sớm hơn trước.

## Nhóm E — Comparable / Comparator

**E1.** `Student implements Comparable` sắp theo tên. Sau đó dùng `Comparator` sắp theo: GPA giảm dần → tuổi tăng dần → tên A-Z.

**E2.** Sắp xếp `List<String>` theo độ dài, cùng độ dài thì theo alphabet.

**E3.** Sắp xếp `List<Employee>` với nhân viên có lương null xếp cuối (`Comparator.nullsLast`).

## Nhóm F — Generics

**F1.** Viết class `Pair<K, V>` với method `swap()` trả về `Pair<V, K>`.

**F2.** Viết `Repository<T, ID>` generic với `save`, `findById` (trả `Optional<T>`), `findAll`, `deleteById`. Cài đặt `InMemoryRepository` dùng `Map<ID, T>`.
*Đạt khi*: dùng lại được cho cả `User` và `Product` mà không sửa dòng nào trong `InMemoryRepository`.

**F3.** Viết `static <T extends Comparable<T>> T max(List<T> list)` và `min`.

**F4.** Giải thích + code minh họa PECS: vì sao `List<Integer>` không truyền được vào `List<Number>`?

**F5.** Viết `record ApiResponse<T>` với factory `ok`, `error`, `okPage(List<T> items, int page, int total)`.

## Nhóm G — Tổng hợp

**G1. Quản lý sinh viên v2** (nâng cấp bài G1 module 01 sang Collections):
- `List<Student>` thay cho mảng.
- Thêm/sửa/xóa theo id (`Map<Integer, Student>` để tra nhanh).
- Tìm kiếm theo tên (không phân biệt hoa thường, tìm gần đúng).
- Sắp xếp theo nhiều tiêu chí (dùng `Comparator`).
- Thống kê: điểm TB theo lớp, top 3 toàn trường, số lượng theo xếp loại.

*Đạt khi*: không còn mảng thô, dùng đúng `Map` cho tra cứu theo id, tách rõ tầng service.

**G2. Phân tích log.** Cho file text mỗi dòng dạng `2026-08-24 10:15:30 ERROR UserService Không tìm thấy user id=5`:
- Đếm số dòng theo mức log (INFO/WARN/ERROR).
- Top 5 service có nhiều lỗi nhất.
- Nhóm lỗi theo giờ trong ngày.
*Gợi ý*: `Map<String, Integer>` + `merge`. (Đọc file sẽ học ở Module 04 — tạm hardcode một `List<String>`.)

---

## Câu hỏi phỏng vấn tự trả lời
1. `ArrayList` và `LinkedList` khác nhau ra sao? Khi nào chọn cái nào?
2. `HashMap` hoạt động thế nào? Xử lý collision ra sao? Java 8 cải tiến gì?
3. Vì sao không nên dùng object mutable làm key của `HashMap`?
4. `HashSet` khác `TreeSet` chỗ nào?
5. `ConcurrentModificationException` xảy ra khi nào, tránh thế nào?
6. `Comparable` khác `Comparator` thế nào?
7. Type erasure là gì? Hệ quả?
8. PECS nghĩa là gì?
9. `HashMap` và `Hashtable` và `ConcurrentHashMap` khác nhau ra sao?
