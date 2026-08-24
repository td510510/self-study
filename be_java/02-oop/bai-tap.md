# Bài tập Module 02 — OOP

## Nhóm A — Class & đóng gói

**A1. `Rectangle`** với `width`, `height` private; getter/setter có validate (> 0); method `area()`, `perimeter()`, `isSquare()`; override `toString()`.

**A2. `BankAccount`** (tự làm trước khi xem [src/oop/BankAccount.java](src/oop/BankAccount.java)):
- `accountNumber` (final), `owner`, `balance` (long).
- `deposit`, `withdraw`, `transfer(BankAccount to, long amount)`.
- Không cho số dư âm; ném `IllegalArgumentException` / `IllegalStateException` phù hợp.
- Lưu lịch sử giao dịch, `getHistory()` trả về bản **không sửa được từ ngoài**.

*Đạt khi*: không có field `public`, mọi thay đổi số dư đều qua method có kiểm tra.

**A3. `Student`** với 4 constructor khác nhau (chuỗi `this(...)`), field `id` tự tăng bằng biến `static`.

## Nhóm B — Kế thừa & đa hình

**B1. Cây `Employee`.**
```
Employee (abstract): id, name, baseSalary, abstract calculateSalary()
├── FullTimeEmployee : lương = base + phụ cấp
├── PartTimeEmployee : lương = số giờ × đơn giá
└── Manager extends FullTimeEmployee : + thưởng theo % lợi nhuận
```
Tạo `List<Employee>`, in bảng lương và tổng quỹ lương.
*Đạt khi*: vòng lặp in lương **không có** một câu `if` nào kiểm tra loại nhân viên (đó chính là đa hình).

**B2. Composition vs Inheritance.** Cho `Car` và `Engine`. Viết đúng quan hệ, giải thích trong comment vì sao `Car extends Engine` là sai.

**B3. Ghi đè `toString`, `equals`, `hashCode`** cho `Employee` dựa trên `id`. Bỏ hai object cùng `id` vào `HashSet`, kiểm tra `size()` == 1.

## Nhóm C — Interface

**C1. `Shape`.** Interface có `area()`, `perimeter()`, `default describe()`. Cài `Circle`, `Rectangle`, `Triangle`. Sắp xếp danh sách hình theo diện tích tăng dần (dùng `Comparator`).

**C2. Hệ thống thông báo.**
```java
interface Notifier { void send(String to, String message); }
```
Cài `EmailNotifier`, `SmsNotifier`, `SlackNotifier`. Viết `NotificationService` nhận `List<Notifier>` qua constructor và gửi qua tất cả kênh.
*Đạt khi*: thêm kênh mới **không phải sửa** `NotificationService`.

**C3. Chiến lược giảm giá.**
```java
interface DiscountStrategy { long apply(long amount); }
```
Cài: `NoDiscount`, `PercentDiscount(10%)`, `FixedDiscount(50k)`, `TieredDiscount` (>1tr giảm 15%, >500k giảm 5%). Viết `Cart` chọn chiến lược lúc chạy.

**C4.** Giải thích bằng ví dụ code: khi nào chọn `interface`, khi nào chọn `abstract class`.

## Nhóm D — record, enum, sealed

**D1.** Chuyển các DTO sau thành `record`: `Money(currency, amount)`, `Address(street, city, zip)`, `PageRequest(page, size)`. Thêm validate trong compact constructor.

**D2. `enum OrderStatus`** với label tiếng Việt và method `canTransitionTo(OrderStatus next)` định nghĩa luồng hợp lệ:
`PENDING → PAID → SHIPPED → DELIVERED`, mọi trạng thái trước `DELIVERED` đều có thể `→ CANCELLED`.
*Đạt khi*: chuyển trạng thái sai bị ném exception.

**D3. `sealed interface PaymentResult permits Success, Failure, Pending`** dùng record cho mỗi nhánh, xử lý bằng `switch` pattern matching không cần `default`.

## Nhóm E — Thiết kế (quan trọng nhất)

**E1. Refactor code xấu.** Cho class dưới đây, hãy tách theo SOLID:
```java
class UserManager {
    void register(String email, String password) {
        // validate email
        // hash password
        // lưu vào file
        // gửi email chào mừng
        // ghi log
    }
}
```
*Đạt khi*: tách thành ít nhất `UserValidator`, `PasswordEncoder` (interface), `UserRepository` (interface), `Notifier` (interface), `UserService` điều phối; `UserService` nhận phụ thuộc qua constructor.

**E2. Thư viện sách — phiên bản OOP** (tiền đề cho Dự án 1):
```
model/Book.java, Member.java, Loan.java, enum BookStatus
repository/BookRepository.java (interface) + InMemoryBookRepository.java
service/LibraryService.java   — mượn/trả sách, kiểm tra quy tắc nghiệp vụ
Main.java                     — lắp ráp và chạy thử
```
Quy tắc nghiệp vụ: mỗi thành viên mượn tối đa 3 cuốn; sách đang được mượn thì không cho mượn tiếp; trả trễ hơn 14 ngày thì tính phí 5.000đ/ngày.

*Đạt khi*:
- Đúng phân tầng, phụ thuộc một chiều controller → service → repository.
- `LibraryService` nhận `BookRepository` qua constructor (không `new` bên trong).
- Đổi `InMemoryBookRepository` sang bản lưu file **không cần sửa** `LibraryService`.

---

## Câu hỏi tự kiểm tra (viết câu trả lời ra giấy)
1. Overloading khác overriding thế nào?
2. Vì sao `equals` phải đi cùng `hashCode`?
3. Khi nào dùng `abstract class` thay vì `interface`?
4. Java có đa kế thừa không? Giải quyết vấn đề "kim cương" bằng cách nào?
5. `static` method có gọi được biến instance không? Vì sao?
6. Vì sao "composition over inheritance"?
7. `record` khác class thường ở điểm nào? Khi nào không nên dùng record?
8. Dependency Injection giải quyết vấn đề gì? (trả lời bằng ví dụ test)
