# Luyện tay Module 01 — 40 bài nhỏ

> [bai-tap.md](bai-tap.md) là bài chính (bắt buộc). File này là **bài nhỏ để quen tay**: mỗi bài 5–15 phút, có ví dụ vào/ra để tự kiểm tra.
> Làm mỗi ngày 5–8 bài cho tới khi gõ vòng lặp, mảng, String **không cần nghĩ**. Đây là giai đoạn người mới hay bỏ qua nhất — và cũng là lý do hay bị "đứng hình" ở vòng code test.
>
> Cách làm: mỗi bài một method `static`, gọi trong `main` với ví dụ đã cho và **tự so kết quả**. ⭐ dễ · ⭐⭐ vừa · ⭐⭐⭐ khó.

## Phần 1 — Đọc code, đoán kết quả (không chạy máy!)

Viết kết quả ra giấy trước, **sau đó** mới chạy để kiểm tra. Sai câu nào thì đọc lại phần lý thuyết tương ứng.

```java
// 1.1
int a = 7 / 2;           double b = 7 / 2;          double c = 7 / 2.0;
System.out.println(a + " " + b + " " + c);

// 1.2
int x = 5;
int y = x++ + ++x;
System.out.println(x + " " + y);

// 1.3
System.out.println(1 + 2 + "3" + 4 + 5);

// 1.4
String s1 = "java";
String s2 = "ja" + "va";
String s3 = new String("java");
System.out.println((s1 == s2) + " " + (s1 == s3) + " " + s1.equals(s3));

// 1.5
int i = Integer.MAX_VALUE;
System.out.println(i + 1);

// 1.6
System.out.println(0.1 + 0.2 == 0.3);

// 1.7
char ch = 'A';
ch += 2;
System.out.println(ch + " " + (ch + 1));

// 1.8
int n = 10;
for (int k = 0; k < n; k++) { if (k % 3 == 0) continue; if (k == 8) break; System.out.print(k + " "); }

// 1.9
int[] arr = {1, 2, 3};
int[] copy = arr;
copy[0] = 99;
System.out.println(arr[0]);

// 1.10
String s = "Hello";
s.toUpperCase();
System.out.println(s);

// 1.11
System.out.println(-7 % 3 + " " + Math.floorMod(-7, 3));

// 1.12
switch (3) { case 1: System.out.print("A"); case 3: System.out.print("B"); case 4: System.out.print("C"); default: System.out.print("D"); }
```

## Phần 2 — Số và điều kiện

**2.1** ⭐ `sumDigits(int n)`: tổng các chữ số. `sumDigits(9045)` → `18`. Số âm tính theo trị tuyệt đối.

**2.2** ⭐ `countDigits(long n)`: đếm chữ số. `countDigits(0)` → `1`, `countDigits(-120)` → `3`.

**2.3** ⭐ `maxOfThree(int a, int b, int c)` không dùng `Math.max`.

**2.4** ⭐ `isPerfect(int n)`: tổng ước (trừ chính nó) bằng n. `6, 28, 496` → `true`.

**2.5** ⭐ `gcd(int a, int b)` bằng thuật toán Euclid (vòng lặp). `gcd(48, 18)` → `6`.

**2.6** ⭐⭐ `isArmstrong(int n)`: tổng lũy thừa bậc k (k = số chữ số) của các chữ số bằng n. `153 = 1³+5³+3³` → `true`. In mọi số Armstrong < 10.000.

**2.7** ⭐⭐ `toBinary(int n)`: đổi sang chuỗi nhị phân không dùng `Integer.toBinaryString`. `10` → `"1010"`, `0` → `"0"`.

**2.8** ⭐⭐ `fromBinary(String s)`: ngược lại. `"1010"` → `10`. Chuỗi chứa ký tự khác `0/1` thì ném `IllegalArgumentException`.

**2.9** ⭐⭐ `tienDien(int kWh)` theo bậc thang: 50 kWh đầu 1.806đ, 51–100: 1.866đ, 101–200: 2.167đ, 201–300: 2.729đ, trên 300: 3.050đ. `tienDien(150)` → `50*1806 + 50*1866 + 50*2167 = 291.950`.

**2.10** ⭐⭐ `thueTNCN(long thuNhap)` theo biểu lũy tiến 7 bậc (5%, 10%, 15%, 20%, 25%, 30%, 35% với các mốc 5, 10, 18, 32, 52, 80 triệu). Dùng **mảng mốc + mảng thuế suất**, không viết 7 cái `if`.

**2.11** ⭐⭐ `docSo(int n)` với 0 ≤ n ≤ 999: `105` → `"một trăm lẻ năm"`, `215` → `"hai trăm mười lăm"`, `21` → `"hai mươi mốt"`, `24` → `"hai mươi tư"`.

**2.12** ⭐⭐⭐ Mở rộng 2.11 tới 999.999.999: `1250000` → `"một triệu hai trăm năm mươi nghìn"`. (Hóa đơn điện tử thật phải in số tiền bằng chữ đúng như thế này.)

## Phần 3 — Vòng lặp và in hình

**3.1** ⭐ In tam giác vuông n dòng bằng `*`. n = 4:
```
*
**
***
****
```

**3.2** ⭐⭐ In tam giác cân (kim tự tháp) n dòng:
```
   *
  ***
 *****
*******
```

**3.3** ⭐⭐ In hình thoi rỗng cạnh n.

**3.4** ⭐⭐ In tam giác Pascal 6 dòng (mỗi số = tổng hai số phía trên).

**3.5** ⭐⭐ In lịch tháng: nhập tháng, năm → in lịch dạng lưới 7 cột bắt đầu từ Thứ Hai. Được dùng `LocalDate` để biết ngày 1 là thứ mấy.

**3.6** ⭐⭐ In mọi cặp `(a, b)` với `1 ≤ a < b ≤ 100` mà `a + b` và `a * b` đều là số chính phương. Đếm số cặp.

## Phần 4 — Mảng

**4.1** ⭐ `secondLargest(int[] a)`: số lớn thứ hai **khác** số lớn nhất, duyệt một lần. `[5, 1, 5, 3]` → `3`. Không có thì trả `Integer.MIN_VALUE`.

**4.2** ⭐ `rotateLeft(int[] a, int k)` tại chỗ. `[1,2,3,4,5]`, k=2 → `[3,4,5,1,2]`. Nhớ xử lý `k > a.length`.

**4.3** ⭐ `isSorted(int[] a)`: mảng đã sắp xếp tăng dần chưa?

**4.4** ⭐ `countInRange(int[] a, int lo, int hi)`: số phần tử trong đoạn [lo, hi].

**4.5** ⭐⭐ `mergeSorted(int[] a, int[] b)`: gộp 2 mảng đã sắp xếp thành 1 mảng đã sắp xếp, O(n+m), không gọi `Arrays.sort`.

**4.6** ⭐⭐ `removeDuplicates(int[] a)`: trả về mảng mới không trùng, **giữ thứ tự**. `[3,1,3,2,1]` → `[3,1,2]`. Chưa dùng Set (sẽ học Module 03).

**4.7** ⭐⭐ `maxSubarraySum(int[] a)`: tổng lớn nhất của một đoạn liên tiếp. `[-2,1,-3,4,-1,2,1,-5,4]` → `6` (đoạn `[4,-1,2,1]`). Làm O(n²) trước, rồi thử tìm cách O(n) (gợi ý: thuật toán Kadane).

**4.8** ⭐⭐ `transpose(int[][] m)`: chuyển vị ma trận (không nhất thiết vuông).

**4.9** ⭐⭐ `spiral(int[][] m)`: in ma trận theo hình xoắn ốc từ ngoài vào trong. `[[1,2,3],[4,5,6],[7,8,9]]` → `1 2 3 6 9 8 7 4 5`.

**4.10** ⭐⭐⭐ `isValidSudokuRow/Col/Box` rồi `isValidSudoku(int[][] board)` cho bảng 9x9 (0 = ô trống).

## Phần 5 — String

**5.1** ⭐ `countChar(String s, char c)`.

**5.2** ⭐ `reverseWords(String s)`: `"Tôi học Java"` → `"Java học Tôi"`. Nhiều dấu cách liền nhau coi như một.

**5.3** ⭐ `isNumeric(String s)`: chỉ gồm chữ số, không rỗng. Không dùng `try/catch parseInt`.

**5.4** ⭐ `normalizeName(String s)`: `"  nGUYỄN   văn   AN "` → `"Nguyễn Văn An"`.

**5.5** ⭐⭐ `compress(String s)`: `"aaabccdddd"` → `"a3b1c2d4"`. Nếu kết quả không ngắn hơn thì trả chuỗi gốc.

**5.6** ⭐⭐ `isValidEmail(String s)` **không dùng regex**: đúng một `@`, phần trước và sau không rỗng, phần sau có dấu `.` không ở đầu/cuối.

**5.7** ⭐⭐ `isStrongPassword(String s)`: ≥ 8 ký tự, có chữ hoa, chữ thường, chữ số, ký tự đặc biệt. Trả về **danh sách lý do** chưa đạt (dạng `String` nối bằng `", "`), rỗng nếu đạt.

**5.8** ⭐⭐ `toSlug(String title)`: `"Học Java Backend từ A đến Z!"` → `"hoc-java-backend-tu-a-den-z"`. Gợi ý: `java.text.Normalizer` để bỏ dấu, nhớ xử lý riêng `đ/Đ`. (Đây là cách tạo URL bài viết ở Dự án 2.)

**5.9** ⭐⭐ `formatMoney(long amount)`: `1250000` → `"1.250.000 ₫"` — tự chèn dấu chấm, không dùng `String.format`/`NumberFormat`. Sau đó làm lại bằng `NumberFormat` với `Locale("vi", "VN")` và so sánh.

**5.10** ⭐⭐⭐ `longestCommonPrefix(String[] words)`: `["interview", "internet", "interval"]` → `"inter"`.

## Phần 6 — Method

**6.1** ⭐ Viết lại 3 bài bất kỳ ở trên theo quy tắc: method không in gì, chỉ **trả về** kết quả; `main` lo việc in. Giải thích vì sao cách này dễ test hơn.

**6.2** ⭐⭐ Viết `static int[] parseInts(String csv)`: `"1, 2 ,3,,4"` → `[1, 2, 3, 4]` (bỏ phần tử rỗng, trim khoảng trắng).

**6.3** ⭐⭐ Viết `static String repeat(String s, int n, String sep)` bằng vòng lặp + `StringBuilder`: `repeat("ab", 3, "-")` → `"ab-ab-ab"`. Kiểm tra `n = 0` và `n < 0`.

---

## Đáp án Phần 1 (chỉ xem sau khi đã tự làm)

<details>
<summary>Bấm để xem</summary>

| Câu | Kết quả | Vì sao |
|---|---|---|
| 1.1 | `3 3.0 3.5` | `7/2` chia nguyên **trước** rồi mới đổi sang double |
| 1.2 | `7 12` | `x++` trả 5 (x thành 6), `++x` thành 7 trả 7 → 5 + 7 |
| 1.3 | `3345` | cộng từ trái: 1+2=3, gặp String thì mọi thứ sau đó là nối chuỗi |
| 1.4 | `true false true` | hằng chuỗi ghép lúc biên dịch dùng chung String pool; `new` tạo object mới |
| 1.5 | `-2147483648` | tràn số, quay vòng về giá trị nhỏ nhất, **không** báo lỗi |
| 1.6 | `false` | số thực nhị phân không biểu diễn chính xác 0.1 → dùng `BigDecimal` cho tiền |
| 1.7 | `C 68` | `+=` tự ép kiểu về char; `ch + 1` là phép cộng int |
| 1.8 | `1 2 4 5 7 ` | bỏ qua 0, 3, 6 (chia hết cho 3); dừng khi k = 8 |
| 1.9 | `99` | mảng là object, `copy` và `arr` trỏ **cùng một** mảng |
| 1.10 | `Hello` | String bất biến; `toUpperCase()` trả chuỗi **mới** mà không ai giữ lại |
| 1.11 | `-1 2` | `%` giữ dấu của số bị chia; `floorMod` luôn không âm với số chia dương |
| 1.12 | `BCD` | `switch` kiểu cũ thiếu `break` thì **rơi xuống** các nhánh sau — lý do nên dùng `switch` mũi tên `->` |

</details>
