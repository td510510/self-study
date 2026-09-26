# Luyện tay Module 04 — 25 bài nhỏ về Exception, I/O, ngày giờ

> Bổ sung cho [bai-tap.md](bai-tap.md). Mỗi bài 10–20 phút.
> ⭐ dễ · ⭐⭐ vừa · ⭐⭐⭐ khó.

## Phần 1 — Đọc code, đoán kết quả

```java
// 1.1
static int f() {
    try { return 1; }
    finally { System.out.print("finally "); }
}
System.out.println(f());

// 1.2
static int g() {
    int x = 1;
    try { return x; }
    finally { x = 2; }
}
System.out.println(g());

// 1.3
try {
    Object o = "text";
    Integer i = (Integer) o;
} catch (NumberFormatException e) {
    System.out.println("NFE");
} catch (RuntimeException e) {
    System.out.println("RTE: " + e.getClass().getSimpleName());
}

// 1.4
try {
    throw new IllegalStateException("A");
} catch (IllegalStateException e) {
    throw new RuntimeException("B");
} finally {
    System.out.println("finally chạy");
}
// Chương trình in gì, và exception nào thoát ra ngoài?

// 1.5
class Res implements AutoCloseable {
    String n; Res(String n) { this.n = n; System.out.print("open-" + n + " "); }
    public void close() { System.out.print("close-" + n + " "); }
}
try (Res a = new Res("a"); Res b = new Res("b")) {
    System.out.print("body ");
}

// 1.6
Optional<String> opt = Optional.of("x");
String r = opt.orElse(expensive());      // expensive() in ra "CALLED" và trả "y"
String t = opt.orElseGet(() -> expensive());
```

## Phần 2 — Exception

**2.1** ⭐ `safeParseInt(String s, int defaultValue)`: không ném exception với `null`, `""`, `"abc"`, `"99999999999"`.

**2.2** ⭐ `requireRange(int value, int min, int max, String name)`: ném `IllegalArgumentException` với thông báo `"age phải trong [0, 150], nhận được 200"`.

**2.3** ⭐⭐ Tạo `InsufficientBalanceException extends RuntimeException` có field `requested`, `available`. `Account.withdraw` ném nó; `main` bắt và in thông báo dùng các field (không parse chuỗi message).

**2.4** ⭐⭐ Viết `validate(RegisterForm form)` trả về **tất cả** lỗi (`Map<String, String>` field → thông báo) thay vì ném ở lỗi đầu tiên. Khi có lỗi thì ném `ValidationException` chứa map đó. (Đây chính là cách `@Valid` hoạt động ở Module 11.)

**2.5** ⭐⭐ Cho 3 tầng `Controller → Service → Repository`. Repository ném `SQLException` (checked). Service bọc thành `DataAccessException` (unchecked) **giữ cause**. Controller bắt và in: thông báo thân thiện + stacktrace đầy đủ ra "log" (stderr). Chứng minh stacktrace còn thấy dòng gốc của `SQLException`.

**2.6** ⭐⭐ Viết lại hàm sau cho đúng:
```java
public String readConfig(String path) {
    try {
        BufferedReader r = new BufferedReader(new FileReader(path));
        String line = r.readLine();
        r.close();
        return line;
    } catch (Exception e) {
        e.printStackTrace();
        return null;
    }
}
```

**2.7** ⭐⭐⭐ `Result<T>` thay cho exception: `Result.of(() -> riskyCall())` bắt exception thành `Failure`. Viết `map`, `orElse`, `orElseThrow`. So sánh khi nào nên dùng `Result`, khi nào dùng exception.

## Phần 3 — File I/O

**3.1** ⭐ Ghi `List<String>` ra file UTF-8, đọc lại, so sánh bằng `equals`. Thử với nội dung tiếng Việt có dấu.

**3.2** ⭐ `countLines(Path)` bằng `Files.lines` — nhớ đóng stream (try-with-resources).

**3.3** ⭐⭐ `tail(Path file, int n)`: in n dòng cuối của file 1GB **không** nạp cả file (gợi ý: đọc theo dòng, giữ `ArrayDeque` n phần tử — hoặc thử `RandomAccessFile` đọc ngược).

**3.4** ⭐⭐ `findLargestFiles(Path dir, int top)`: duyệt đệ quy, in top file lớn nhất kèm dung lượng dạng `1.5 MB`.

**3.5** ⭐⭐ Đổi tên hàng loạt: mọi file `IMG_*.jpg` trong thư mục thành `2026-09-26_001.jpg`, `_002`... theo ngày sửa đổi. Có chế độ `--dry-run` chỉ in ra mà không đổi.

**3.6** ⭐⭐ Đọc file cấu hình `key=value` (bỏ dòng trống và dòng bắt đầu bằng `#`) thành `Map`. Dòng sai định dạng thì báo số dòng. Làm lại bằng `java.util.Properties` và so sánh.

**3.7** ⭐⭐⭐ Ghi file an toàn: ghi vào file tạm rồi `Files.move(..., ATOMIC_MOVE)` đè lên file thật. Giải thích vì sao cách này không làm hỏng file khi chương trình bị tắt giữa chừng.

## Phần 4 — CSV và JSON

**4.1** ⭐⭐ Đọc CSV có dòng tiêu đề thành `List<Map<String, String>>` (key là tên cột). Xử lý trường có dấu phẩy nằm trong ngoặc kép: `1,"Nguyễn Văn A, Jr",20`.

**4.2** ⭐⭐ Dùng Jackson đọc JSON mảng sản phẩm thành `List<Product>` (record); field lạ trong JSON không làm lỗi (`FAIL_ON_UNKNOWN_PROPERTIES`).

**4.3** ⭐⭐ Chuyển file CSV đơn hàng sang JSON nhóm theo khách hàng:
```json
{ "an@shop.vn": [ { "orderId": 1, "total": 250000 } ], ... }
```

## Phần 5 — Ngày giờ

**5.1** ⭐ Số ngày còn lại tới Tết Nguyên Đán năm sau (ngày cố định do bạn nhập).

**5.2** ⭐ Parse `"26/09/2026 14:30"` thành `LocalDateTime`, cộng 90 phút, in lại cùng định dạng.

**5.3** ⭐⭐ `isBusinessHour(ZonedDateTime t)`: 8:00–17:30, thứ Hai–thứ Sáu, **theo giờ Việt Nam** bất kể `t` ở múi giờ nào.

**5.4** ⭐⭐ Ngày cuối cùng của mỗi tháng trong năm 2028 (năm nhuận) — dùng `TemporalAdjusters`.

**5.5** ⭐⭐ Tính số phút làm thêm giờ: cho danh sách `(checkIn, checkOut)` trong tháng, giờ chuẩn 8 tiếng/ngày, ngày cuối tuần tính toàn bộ là làm thêm.

**5.6** ⭐⭐⭐ Server lưu `Instant` (UTC). Viết hàm nhận `Instant` và `ZoneId` của người dùng, trả về chuỗi thân thiện: `"vừa xong"`, `"5 phút trước"`, `"hôm qua lúc 21:15"`, `"26/09/2026"`.

---

## Đáp án Phần 1

<details>
<summary>Bấm để xem</summary>

| Câu | Kết quả | Vì sao |
|---|---|---|
| 1.1 | `finally 1` | `finally` luôn chạy trước khi hàm thật sự trả về |
| 1.2 | `1` | giá trị trả về được "chốt" trước khi `finally` chạy; gán `x = 2` không ảnh hưởng |
| 1.3 | `RTE: ClassCastException` | ép kiểu sai ném `ClassCastException`, không phải `NumberFormatException` |
| 1.4 | in `finally chạy`, rồi `RuntimeException("B")` thoát ra | exception "A" bị **mất** vì không được truyền làm cause → luôn dùng `new RuntimeException("B", e)` |
| 1.5 | `open-a open-b body close-b close-a ` | tài nguyên đóng theo thứ tự **ngược** với lúc mở |
| 1.6 | `CALLED` in **một lần** | `orElse(x)` luôn tính `x` trước kể cả khi có giá trị; `orElseGet` chỉ gọi khi rỗng |

</details>
