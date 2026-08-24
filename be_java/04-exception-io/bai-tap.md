# Bài tập Module 04 — Exception & I/O

## Nhóm A — Exception

**A1.** Viết `divide(int a, int b)` xử lý chia 0 bằng 3 cách: (a) kiểm tra trước, (b) try-catch, (c) ném custom exception. So sánh ưu nhược điểm.

**A2. Cây exception nghiệp vụ**:
```
AppException (RuntimeException)
├── NotFoundException(resource, id)
├── ValidationException(field, message)
└── BusinessException(code, message)
```
Mỗi loại mang mã lỗi (`errorCode`) để sau này map sang HTTP status (Module 11).

**A3.** `parseAge(String input)`: rỗng → `ValidationException("age", "không được rỗng")`; không phải số → thông báo rõ; ngoài 0–150 → lỗi. **Không** để `NumberFormatException` lọt ra ngoài.

**A4. Bọc lỗi giữ cause.** Viết `UserRepository.save()` ném `SQLException`, `UserService` bắt và bọc thành `DataAccessException` có `cause`. In stacktrace và chỉ ra dòng `Caused by`.

**A5. Retry.** Viết `retry(Supplier<T> action, int maxAttempts)`: thử lại khi lỗi, chờ tăng dần (1s, 2s, 4s), hết lượt thì ném exception cuối cùng.
*Đạt khi*: xử lý `InterruptedException` đúng (`Thread.currentThread().interrupt()`).

**A6.** Cho 5 đoạn code có xử lý exception sai (nuốt lỗi, `printStackTrace`, `catch (Exception)`, `return` trong `finally`, mất cause) — chỉ ra lỗi và sửa lại.

## Nhóm B — Optional

**B1.** Chuyển `UserRepository.findByEmail` từ trả `null` sang trả `Optional<User>`, cập nhật mọi nơi gọi.

**B2.** Dùng `map`/`flatMap` lấy `user.getAddress().getCity().getName()` an toàn khi mọi cấp đều có thể null.

**B3.** Giải thích + chứng minh bằng code sự khác nhau giữa `orElse` và `orElseGet`.

**B4.** Liệt kê 3 cách dùng `Optional` sai và cách sửa.

## Nhóm C — File I/O

**C1.** Đọc file text, đếm số dòng, số từ, số ký tự (giống lệnh `wc`).

**C2. Sao chép file** bằng `Files.copy` và bằng đọc/ghi buffer thủ công; so sánh thời gian với file ~50MB.

**C3. Sổ ghi chú (console)**: thêm ghi chú (ghi thêm vào cuối file), xem tất cả, tìm theo từ khóa, xóa theo số thứ tự.
*Đạt khi*: dùng UTF-8, ghi tiếng Việt đọc lại không lỗi font.

**C4. CSV → Object.** Đọc `students.csv` thành `List<Student>`, tính GPA trung bình, xuất kết quả ra `report.csv` đã sắp xếp.
*Đạt khi*: xử lý được dòng lỗi (thiếu cột, sai số) mà không dừng chương trình — ghi lại danh sách dòng lỗi.

**C5. Phân tích log lớn.** Sinh file log 1 triệu dòng, sau đó thống kê số lỗi theo giờ **mà không** nạp cả file vào bộ nhớ.
*Đạt khi*: dùng `Files.lines()` trong try-with-resources; đo RAM trước/sau bằng `Runtime.getRuntime().totalMemory()`.

**C6. Duyệt thư mục.** Dùng `Files.walk` liệt kê mọi file `.java` trong repo học tập, in tổng số dòng code.

## Nhóm D — JSON (Jackson)

> Cần thư viện. Tải 3 jar (jackson-core, jackson-databind, jackson-annotations) hoặc chờ Module 09 dùng Maven. Có thể làm nhóm D sau.

**D1.** Chuyển `List<Student>` ↔ JSON, ghi ra file, đọc lại.

**D2.** Dùng `@JsonProperty`, `@JsonIgnore` (giấu password), `@JsonFormat` cho `LocalDate`.

**D3.** Đọc JSON lồng nhau (`{"user":{"address":{"city":"HN"}}}`) bằng `JsonNode`.

**D4.** Viết `JsonFileRepository<T>` generic: `save(List<T>)`, `load(Class<T>)` — sẽ dùng lại trong Dự án 1.

## Nhóm E — java.time

**E1.** Tính tuổi chính xác theo năm/tháng/ngày từ ngày sinh.

**E2.** Đếm số ngày làm việc (trừ T7, CN) giữa hai mốc ngày.

**E3.** Tính hạn trả sách (mượn + 14 ngày) và phí trễ 5.000đ/ngày.

**E4.** Format một `LocalDateTime` theo 5 định dạng khác nhau; parse ngược lại chuỗi `"24/08/2026 14:30"`.

**E5.** Cho `Instant` UTC, hiển thị theo giờ Việt Nam, Tokyo, London. Giải thích vì sao nên lưu UTC.

## Nhóm F — Tổng hợp (bắt buộc)

**F1. Ứng dụng ghi chi tiêu cá nhân (console + file).**
- Model: `Expense(id, date, category, amount, note)` — `category` là `enum`.
- Lưu vào file JSON (hoặc CSV nếu chưa có Jackson), tự nạp lại khi khởi động.
- Chức năng: thêm / sửa / xóa / liệt kê theo tháng / thống kê theo danh mục / top 5 khoản chi lớn nhất.
- Validate: số tiền > 0, ngày không ở tương lai, danh mục hợp lệ → ném `ValidationException` có thông báo tiếng Việt rõ ràng.
- Mọi thao tác file nằm trong `ExpenseRepository`, nghiệp vụ nằm trong `ExpenseService`.

*Đạt khi*:
- Chương trình **không bao giờ crash** dù nhập bậy.
- Dùng `try-with-resources`, UTF-8, `Optional` cho `findById`.
- Đổi từ lưu CSV sang lưu JSON chỉ cần sửa lớp repository.

---

## Câu hỏi phỏng vấn
1. Checked và unchecked exception khác nhau thế nào? Khi nào dùng loại nào?
2. `final`, `finally`, `finalize` khác nhau ra sao?
3. `finally` có luôn chạy không? Trường hợp nào không?
4. try-with-resources hoạt động thế nào? Điều kiện của tài nguyên?
5. Vì sao không nên `catch (Exception e) {}`?
6. Đọc `Caused by` trong stacktrace như thế nào?
7. `Optional` giải quyết vấn đề gì? Dùng sai ở đâu?
8. Vì sao nên lưu thời gian dạng UTC trong database?
