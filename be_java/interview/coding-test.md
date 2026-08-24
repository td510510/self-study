# Bài test code — dạng thường gặp & chiến lược

> Với vị trí Fresher/Junior Java Backend ở Việt Nam, bài code thường **không** phải thuật toán khó
> kiểu LeetCode Hard. Họ kiểm tra: bạn có viết được code sạch, xử lý ca biên, và dùng đúng cấu trúc dữ liệu không.

## Chiến lược làm bài (áp dụng cho mọi bài)

1. **Đọc kỹ và hỏi lại** (1–2 phút): đầu vào có thể null/rỗng không? Kích thước cỡ bao nhiêu? Có phân biệt hoa thường không? Kết quả mong đợi khi không tìm thấy?
2. **Nói ra cách làm trước khi gõ** (2 phút): "Em sẽ dùng HashMap để đếm tần suất, độ phức tạp O(n)". Nếu hướng sai, người phỏng vấn sẽ chỉnh ngay — tiết kiệm 20 phút.
3. **Viết bản chạy được trước**, tối ưu sau. Bản đúng-mà-chậm luôn hơn bản nhanh-mà-sai.
4. **Xử lý ca biên**: null, rỗng, một phần tử, trùng lặp, số âm, tràn số.
5. **Tự kiểm thử bằng miệng** với 2–3 bộ dữ liệu, gồm cả ca biên.
6. **Nói về độ phức tạp** thời gian và bộ nhớ khi làm xong.

## Nhóm 1 — Chuỗi & mảng (hay gặp nhất)

1. Đảo ngược chuỗi / kiểm tra palindrome (bỏ qua hoa thường và khoảng trắng).
2. Đếm tần suất ký tự, tìm ký tự không lặp đầu tiên.
3. Kiểm tra hai chuỗi là anagram.
4. Đếm số từ, viết hoa chữ cái đầu mỗi từ.
5. Nén chuỗi: `"aaabbc"` → `"a3b2c1"`.
6. Tìm phần tử xuất hiện nhiều nhất / xuất hiện đúng một lần.
7. Hai số trong mảng có tổng bằng target (Two Sum) — làm bằng `HashMap` O(n), đừng lồng 2 vòng lặp.
8. Xoay mảng k vị trí; trộn 2 mảng đã sắp xếp.
9. Tìm dãy con liên tiếp có tổng lớn nhất (Kadane).
10. Kiểm tra chuỗi ngoặc hợp lệ bằng `ArrayDeque`.

```java
// Mẫu trả lời tốt: có xử lý null, dùng đúng cấu trúc dữ liệu, nói được độ phức tạp
public static Map<Character, Integer> demTanSuat(String s) {
    if (s == null || s.isBlank()) return Map.of();
    Map<Character, Integer> result = new LinkedHashMap<>();   // giữ thứ tự xuất hiện
    for (char c : s.toLowerCase().toCharArray()) {
        if (Character.isWhitespace(c)) continue;
        result.merge(c, 1, Integer::sum);
    }
    return result;      // Thời gian O(n), bộ nhớ O(k) với k là số ký tự khác nhau
}
```

## Nhóm 2 — Collections & Stream (rất hay hỏi cho Java)

Cho `List<Employee>` với `(id, name, department, salary, joinDate)`:

1. Nhóm nhân viên theo phòng ban.
2. Lương trung bình mỗi phòng ban.
3. Top 3 người lương cao nhất.
4. Người có lương cao nhất từng phòng ban.
5. Đếm nhân viên theo phòng ban, sắp xếp giảm dần.
6. Tổng quỹ lương, chỉ tính người vào làm trước 2024.
7. Chia hai nhóm: lương trên/dưới trung bình.
8. Chuyển `List` thành `Map<id, Employee>` (nhớ xử lý trùng key!).
9. Danh sách tên phòng ban duy nhất, sắp xếp A-Z.
10. Sắp xếp nhiều tiêu chí: phòng ban tăng dần → lương giảm dần → tên A-Z.

```java
// Câu 4 — thường bị làm sai
Map<String, Optional<Employee>> topByDept = employees.stream()
        .collect(Collectors.groupingBy(Employee::department,
                 Collectors.maxBy(Comparator.comparing(Employee::salary))));
```

## Nhóm 3 — Thiết kế class (kiểm tra tư duy OOP)

1. Thiết kế `ParkingLot`: nhiều loại xe, tính phí theo giờ, tìm chỗ trống.
2. Thiết kế `Library`: mượn/trả, hạn mức, phí trễ (chính là Dự án 1 của bạn!).
3. Thiết kế `ShoppingCart`: thêm/xóa sản phẩm, áp dụng nhiều loại giảm giá.
4. Thiết kế `ATM`: rút tiền, nhả tờ tiền tối ưu, kiểm tra số dư.
5. Thiết kế `LRU Cache` dung lượng N.
6. Thiết kế hệ thống đặt vé xem phim (chống đặt trùng ghế).

Điều họ chấm: bạn có **tách trách nhiệm** hợp lý không, có dùng interface cho phần dễ thay đổi (chiến lược tính phí, phương thức thanh toán) không, có nghĩ tới đồng thời không.

```java
// Ví dụ được đánh giá cao: chiến lược giảm giá tách rời
public interface DiscountStrategy { long apply(long amount); }

public class Cart {
    private final List<CartItem> items = new ArrayList<>();
    private DiscountStrategy discount = amount -> amount;   // mặc định không giảm

    public void setDiscount(DiscountStrategy discount) { this.discount = discount; }

    public long total() {
        long sum = items.stream().mapToLong(CartItem::lineTotal).sum();
        return discount.apply(sum);      // thêm loại giảm giá mới = thêm 1 class, không sửa Cart
    }
}
```

## Nhóm 4 — SQL (thường có 3–5 câu)

Cho `users(id, name, city)`, `orders(id, user_id, total, status, created_at)`:

1. Top 5 khách chi nhiều nhất (không tính đơn hủy).
2. Khách chưa từng mua hàng.
3. Doanh thu theo tháng năm nay.
4. Khách có từ 2 đơn trở lên.
5. Đơn hàng gần nhất của mỗi khách (window function).
6. Tỷ lệ hủy đơn theo tháng.
7. Sản phẩm chưa bao giờ được bán.
8. Xếp hạng doanh thu trong từng thành phố.

```sql
-- Câu 5 — dạng "bản ghi mới nhất của mỗi nhóm", rất hay hỏi
SELECT * FROM (
    SELECT o.*, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) rn
    FROM orders o
) t WHERE rn = 1;
```

## Nhóm 5 — Bài tổng hợp (bài về nhà, 2–4 tiếng)

Đề điển hình: *"Xây REST API quản lý sản phẩm với Spring Boot, có CRUD, tìm kiếm, phân trang, validate và test."*

Đây là lúc **Dự án 2** của bạn phát huy tác dụng — bạn đã làm y hệt rồi. Checklist để được điểm cao:

- [ ] Phân tầng rõ: controller → service → repository
- [ ] DTO tách khỏi entity (điểm cộng lớn, nhiều ứng viên bỏ qua)
- [ ] Validate đầy đủ + `@RestControllerAdvice` xử lý lỗi thống nhất
- [ ] Đúng status code (201 khi tạo, 204 khi xóa, 404, 400, 409)
- [ ] Phân trang bằng `Pageable`
- [ ] Có test: ít nhất vài unit test service + vài test controller
- [ ] Flyway hoặc script SQL khởi tạo, **không** dùng `ddl-auto=update`
- [ ] README: cách chạy, danh sách API, quyết định thiết kế và lý do
- [ ] `docker-compose.yml` để người chấm chạy bằng 1 lệnh
- [ ] Git history sạch, commit message có nghĩa

> **Mẹo ăn điểm**: viết trong README một mục *"Những gì tôi sẽ làm thêm nếu có thời gian"* — liệt kê cache, rate limit, tối ưu N+1... Nó cho thấy bạn biết giới hạn của bài làm và có tầm nhìn xa hơn yêu cầu.

## Nhóm 6 — Debug / đọc code (vòng phỏng vấn trực tiếp)

Họ đưa một đoạn code có bug và hỏi bạn thấy gì. Các bug hay được cài:

```java
// 1. So sánh String bằng ==
if (status == "ACTIVE") { }                    // -> .equals()

// 2. Sửa collection khi đang duyệt
for (String s : list) { if (...) list.remove(s); }   // -> removeIf

// 3. double cho tiền
double total = price * quantity;               // -> BigDecimal

// 4. Nuốt exception
try { ... } catch (Exception e) { }            // -> log + ném tiếp

// 5. Không đóng tài nguyên
FileInputStream in = new FileInputStream(f);   // -> try-with-resources

// 6. State thay đổi được trong bean singleton
@Service class X { private int counter; }      // -> race condition

// 7. N+1
for (Order o : orders) { o.getUser().getName(); }   // -> JOIN FETCH

// 8. Nối chuỗi SQL
"SELECT * FROM users WHERE email = '" + email + "'"  // -> SQL Injection

// 9. count++ trong môi trường đa luồng
private volatile int count; count++;           // -> AtomicInteger

// 10. Gọi method @Transactional trong cùng class
public void b() { a(); }                       // -> proxy không chạy
```

Học kỹ 10 lỗi này — bạn đã gặp **tất cả** trong các module 01–14 của chương trình này.

## Luyện tập ở đâu

- **LeetCode Easy** (~50 bài) là đủ cho Fresher/Junior backend. Đừng sa đà vào Hard.
- **HackerRank** phần Java + SQL — sát với bài test của các công ty Việt Nam.
- **Codewars** để luyện viết code gọn.
- Quan trọng nhất: **hoàn thiện 3 dự án của chương trình này**. Một dự án chạy được, có test và README tử tế có sức nặng hơn 200 bài LeetCode.
