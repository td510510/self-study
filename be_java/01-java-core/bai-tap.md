# Bài tập Module 01 — Java Core

> Làm lần lượt. Mỗi bài tạo 1 file `.java` trong `01-java-core/baitap/`, chạy bằng `java <file>.java`.
> Không xem gợi ý khi chưa tự làm đủ 30 phút.

## Nhóm A — Biến, toán tử (khởi động)

**A1. Đổi đơn vị.** Nhập số cm, in ra mét và inch (1 inch = 2.54 cm), làm tròn 2 chữ số.
*Đạt khi*: dùng `String.format("%.2f", ...)`, không bị lỗi chia nguyên.

**A2. Hoán đổi hai biến** không dùng biến thứ ba.
*Đạt khi*: giải thích được cách làm (dùng cộng/trừ hoặc XOR).

**A3. Tiền lãi.** Vốn 10 triệu, lãi 6.5%/năm, tính số tiền sau 5 năm (lãi kép).
*Đạt khi*: dùng `BigDecimal`, KHÔNG dùng `double`, làm tròn `RoundingMode.HALF_UP` 2 số lẻ.

## Nhóm B — Rẽ nhánh

**B1. Xếp loại học lực** theo điểm: ≥9 Xuất sắc, ≥8 Giỏi, ≥6.5 Khá, ≥5 Trung bình, <5 Yếu. Điểm ngoài 0–10 thì báo "Điểm không hợp lệ".
*Đạt khi*: viết bằng cả `if-else` và `switch` expression (Java 14+).

**B2. Năm nhuận.** Nhập năm, kiểm tra nhuận (chia hết 4, trừ khi chia hết 100 mà không chia hết 400).

**B3. Số ngày trong tháng.** Nhập tháng + năm, in số ngày (dùng `switch` + kết quả bài B2).

**B4. Máy tính bỏ túi.** Nhập `a`, phép toán (`+ - * /`), `b`. Xử lý chia cho 0.
*Đạt khi*: dùng `switch` expression và không để chương trình crash.

## Nhóm C — Vòng lặp

**C1. FizzBuzz.** In 1..100; bội 3 → "Fizz", bội 5 → "Buzz", bội cả hai → "FizzBuzz".

**C2. Kiểm tra số nguyên tố** và in 100 số nguyên tố đầu tiên.
*Đạt khi*: chỉ lặp tới `Math.sqrt(n)`, giải thích được vì sao đủ.

**C3. Bảng cửu chương** 2→9 dạng lưới, các cột thẳng hàng (dùng `printf("%4d")`).

**C4. Đảo ngược số nguyên.** `12345 → 54321`. Không được đổi sang String.

**C5. Dãy Fibonacci** 30 số đầu, viết bằng vòng lặp (không đệ quy).
*Đạt khi*: dùng `long`, giải thích vì sao `int` sẽ tràn.

**C6. Đoán số.** Máy random 1–100, người dùng đoán, in "cao quá / thấp quá", đếm số lần đoán, kết thúc khi đúng.

## Nhóm D — Mảng

**D1. Thống kê mảng.** Nhập n số, in min, max, tổng, trung bình.
*Đạt khi*: duyệt mảng đúng 1 lần.

**D2. Đảo ngược mảng** tại chỗ (in-place, không tạo mảng mới).

**D3. Tìm phần tử trùng lặp** trong mảng và đếm số lần xuất hiện.

**D4. Sắp xếp nổi bọt (bubble sort)** tự cài, so kết quả với `Arrays.sort()`.
*Đạt khi*: giải thích độ phức tạp O(n²).

**D5. Ma trận.** Nhập ma trận 3x3, in tổng mỗi hàng, mỗi cột và đường chéo chính.

**D6. Tìm kiếm nhị phân** trên mảng đã sắp xếp, tự cài đặt.

## Nhóm E — String

**E1. Kiểm tra palindrome** ("cấp cấp", "abcba") — bỏ qua hoa/thường và khoảng trắng.

**E2. Đếm số từ, số nguyên âm** trong một câu.

**E3. Viết hoa chữ cái đầu mỗi từ**: `"java backend developer"` → `"Java Backend Developer"`.

**E4. Che số điện thoại**: `0912345678` → `091****678`.

**E5. Kiểm tra hai chuỗi có phải anagram** ("listen"/"silent").

**E6. Tự cài `reverse()`** cho chuỗi bằng `StringBuilder` và bằng vòng lặp `charAt`, đo thời gian cả hai với chuỗi 100.000 ký tự.

## Nhóm F — Method

**F1.** Viết các method tiện ích trong class `MathUtils`: `isPrime`, `gcd`, `lcm`, `factorial` (dùng `long`), `power`.

**F2.** Overload method `dienTich` cho: hình vuông (1 tham số), chữ nhật (2), hình tròn (1 double).
*Gợi ý*: hình vuông và hình tròn cùng 1 tham số → phân biệt bằng kiểu.

**F3.** Viết `static int sum(int... nums)` và `static double average(int... nums)` (rỗng thì trả 0).

**F4.** Chứng minh pass-by-value: viết method nhận `int[]` và sửa phần tử đầu; giải thích vì sao bên ngoài thấy thay đổi, trong khi sửa biến `int` thì không.

## Nhóm G — Tổng hợp (bắt buộc làm)

**G1. Quản lý điểm sinh viên (console).**
- Nhập số sinh viên n, với mỗi người nhập tên + 3 điểm (Toán, Lý, Hóa).
- Tính điểm trung bình, xếp loại.
- In bảng kết quả thẳng cột, sắp xếp giảm dần theo điểm TB.
- In: điểm TB cả lớp, người cao nhất, người thấp nhất, số người đậu (≥5).

*Đạt khi*:
- Dùng mảng (chưa cần Collections).
- Tách thành các method riêng: `nhapDuLieu()`, `tinhTrungBinh()`, `xepLoai()`, `sapXep()`, `inBang()` — main chỉ điều phối.
- Nhập sai kiểu không làm crash chương trình.

**G2. Máy ATM mô phỏng.**
- Menu: 1-Xem số dư, 2-Nạp tiền, 3-Rút tiền, 4-Lịch sử giao dịch, 0-Thoát (dùng `do-while`).
- Số dư ban đầu 1.000.000. Rút không quá số dư, không quá 5 triệu/lần, số tiền phải là bội của 50.000.
- Lịch sử lưu vào mảng String, in ra khi chọn 4.

*Đạt khi*: dùng `long` cho tiền, validate đầy đủ, chương trình không bao giờ crash dù nhập bậy.

---

## Tự chấm điểm
- Làm xong nhóm A–F: bạn đã nắm cú pháp.
- Làm xong G1 + G2 mà code chia method rõ ràng: **đủ điều kiện sang Module 02**.
- Commit toàn bộ bài tập lên GitHub: `git commit -m "module 01: java core exercises"`.
