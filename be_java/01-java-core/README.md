# Module 01 — Java Core: cú pháp nền tảng

> Mục tiêu: viết được logic bất kỳ bằng Java — biến, kiểu dữ liệu, toán tử, rẽ nhánh, vòng lặp, mảng, method, String.
> Thời lượng: 2 tuần. Đây là module bạn phải gõ code nhiều nhất.

---

## 1. Biến và kiểu dữ liệu

Java là ngôn ngữ **kiểu tĩnh**: mỗi biến phải khai báo kiểu, và kiểu không đổi được.

```java
int tuoi = 25;
String ten = "Thinh";
tuoi = "hai lăm";   // ❌ compile error: incompatible types
```

### 1.1 Tám kiểu nguyên thủy (primitive)

| Kiểu | Kích thước | Khoảng giá trị | Mặc định | Dùng khi |
|---|---|---|---|---|
| `byte` | 1 byte | -128 … 127 | 0 | xử lý dữ liệu nhị phân |
| `short` | 2 byte | -32.768 … 32.767 | 0 | hiếm dùng |
| `int` | 4 byte | ~ ±2,1 tỷ | 0 | **mặc định cho số nguyên** |
| `long` | 8 byte | ~ ±9,2 tỷ tỷ | 0L | id, timestamp, tiền (đơn vị nhỏ nhất) |
| `float` | 4 byte | ~7 chữ số thập phân | 0.0f | hiếm dùng |
| `double` | 8 byte | ~15 chữ số | 0.0d | **mặc định cho số thực** |
| `char` | 2 byte | 1 ký tự Unicode | ký tự U+0000 | ký tự đơn |
| `boolean` | (JVM tự quyết) | true / false | false | điều kiện |

```java
long soLon = 9_000_000_000L;   // bắt buộc hậu tố L, dấu _ để dễ đọc
double gia = 19.99;
float f = 1.5f;                // bắt buộc hậu tố f
char c = 'A';                  // nháy đơn — khác "A" là String
boolean ok = true;
```

> **Cạm bẫy #1 — tràn số**: `int` chỉ tới ~2,1 tỷ.
> ```java
> int max = Integer.MAX_VALUE;   // 2147483647
> System.out.println(max + 1);   // -2147483648  (âm!) — không có lỗi nào báo cả
> ```
> Với id, số tiền tổng, timestamp: dùng `long`.

> **Cạm bẫy #2 — số thực không chính xác**:
> ```java
> System.out.println(0.1 + 0.2);          // 0.30000000000000004
> System.out.println(0.1 + 0.2 == 0.3);   // false
> ```
> Vì `double` lưu theo chuẩn nhị phân IEEE-754, không biểu diễn chính xác 0.1.
> **Quy tắc vàng: KHÔNG BAO GIỜ dùng `double`/`float` cho tiền tệ.** Dùng `BigDecimal`, hoặc `long` tính theo đơn vị nhỏ nhất (đồng, xu).
> ```java
> BigDecimal a = new BigDecimal("0.1");   // dùng constructor String, không dùng double!
> BigDecimal b = new BigDecimal("0.2");
> System.out.println(a.add(b));           // 0.3
> ```

### 1.2 Primitive vs Wrapper (Object)

Mỗi primitive có một class "bọc" tương ứng: `int→Integer`, `long→Long`, `double→Double`, `boolean→Boolean`, `char→Character`…

```java
int a = 5;            // primitive: lưu giá trị trực tiếp, nằm trên stack, không thể null
Integer b = 5;        // object: là tham chiếu, nằm trên heap, CÓ THỂ null
Integer c = null;     // hợp lệ
int d = c;            // ❌ NullPointerException lúc chạy (unboxing null)
```

Khi nào dùng cái nào?
- Biến cục bộ, vòng lặp, tính toán → **primitive** (nhanh, ít tốn bộ nhớ).
- Trong Collections (`List<Integer>`), trường entity có thể null trong DB → **wrapper**.

> **Cạm bẫy #3 — so sánh wrapper bằng `==`**:
> ```java
> Integer x = 127, y = 127;
> System.out.println(x == y);        // true  (JVM cache -128..127)
> Integer m = 128, n = 128;
> System.out.println(m == n);        // false (2 object khác nhau!)
> System.out.println(m.equals(n));   // true  ✅ luôn dùng equals
> ```
> **Với object luôn dùng `.equals()`; `==` chỉ so sánh địa chỉ tham chiếu.**

### 1.3 `var` — suy luận kiểu (Java 10+)

```java
var ten = "Thinh";              // compiler tự hiểu là String
var list = new ArrayList<String>();
var x;                          // ❌ phải khởi tạo ngay
```
`var` **không** làm Java thành ngôn ngữ động — kiểu vẫn cố định lúc biên dịch. Dùng khi kiểu đã rõ ràng từ vế phải; tránh dùng khi làm code khó đọc.

### 1.4 Hằng số
```java
final double VAT = 0.1;             // không gán lại được
static final int MAX_RETRY = 3;     // hằng số cấp class, viết HOA_GACH_DUOI
```

## 2. Toán tử

```java
int a = 10, b = 3;
a + b   // 13
a - b   // 7
a * b   // 30
a / b   // 3   ⚠ chia nguyên: phần thập phân bị cắt
a % b   // 1   phần dư
(double) a / b   // 3.3333  ép kiểu trước khi chia
```

> **Cạm bẫy #4**: `int / int` luôn ra `int`. `1/2 == 0`. Muốn ra số thực phải ép kiểu ít nhất một vế.

```java
// Tăng/giảm
int i = 5;
System.out.println(i++);  // in 5 rồi mới tăng → i = 6
System.out.println(++i);  // tăng trước → in 7

// So sánh: == != > < >= <=
// Logic: && (và, short-circuit) || (hoặc, short-circuit) ! (phủ định)
if (user != null && user.isActive()) { }   // an toàn: nếu null thì không xét vế 2

// Gán rút gọn
x += 5;  x -= 2;  x *= 3;  x /= 2;  x %= 4;

// Toán tử 3 ngôi
String status = (diem >= 5) ? "Đậu" : "Rớt";
```

## 3. Cấu trúc điều khiển

### 3.1 if / else if / else
```java
int diem = 85;
if (diem >= 90) {
    System.out.println("Xuất sắc");
} else if (diem >= 70) {
    System.out.println("Khá");
} else {
    System.out.println("Trung bình");
}
```
Quy ước: **luôn dùng `{}`** kể cả 1 dòng — tránh lỗi khi sau này thêm dòng thứ 2.

### 3.2 switch
```java
// Kiểu cũ (chú ý break, thiếu là "rơi" xuống case dưới)
switch (day) {
    case 1: System.out.println("Thứ Hai"); break;
    case 6:
    case 7: System.out.println("Cuối tuần"); break;
    default: System.out.println("Trong tuần");
}

// switch expression (Java 14+) — an toàn hơn, khuyến khích dùng
String ten = switch (day) {
    case 1 -> "Thứ Hai";
    case 6, 7 -> "Cuối tuần";
    default -> "Trong tuần";
};

// Có nhiều dòng thì dùng yield
int soNgay = switch (thang) {
    case 2 -> 28;
    case 4, 6, 9, 11 -> 30;
    default -> {
        System.out.println("Tháng 31 ngày");
        yield 31;
    }
};
```

### 3.3 Vòng lặp
```java
// for: biết trước số lần lặp
for (int i = 0; i < 5; i++) { System.out.println(i); }

// while: lặp khi điều kiện còn đúng
int n = 5;
while (n > 0) { n--; }

// do-while: chạy ít nhất 1 lần (hay dùng cho menu console)
do {
    hienThiMenu();
    luaChon = scanner.nextInt();
} while (luaChon != 0);

// for-each: duyệt mảng/collection — ưu tiên dùng khi không cần chỉ số
int[] arr = {1, 2, 3};
for (int x : arr) { System.out.println(x); }
```

`break` thoát vòng lặp, `continue` bỏ qua lượt hiện tại:
```java
for (int i = 1; i <= 10; i++) {
    if (i % 2 == 0) continue;   // bỏ số chẵn
    if (i > 7) break;           // dừng hẳn
    System.out.println(i);      // 1 3 5 7
}
```

## 4. Mảng (array)

```java
int[] a = new int[5];              // 5 phần tử, mặc định 0
int[] b = {10, 20, 30};            // khởi tạo trực tiếp
String[] ten = new String[3];      // mặc định null

b[0] = 99;                         // gán
System.out.println(b.length);      // 3 — LƯU Ý: length là thuộc tính, không phải method
System.out.println(b[3]);          // ❌ ArrayIndexOutOfBoundsException (chỉ số 0..2)
```

Mảng có **kích thước cố định** sau khi tạo. Cần danh sách co giãn → `ArrayList` (module 03).

```java
// Mảng 2 chiều
int[][] matrix = {{1,2,3},{4,5,6}};
System.out.println(matrix[1][2]);   // 6

// Tiện ích trong java.util.Arrays
int[] c = {5, 2, 9};
Arrays.sort(c);                       // [2, 5, 9]
System.out.println(Arrays.toString(c));
int[] d = Arrays.copyOf(c, 5);        // [2,5,9,0,0]
System.out.println(Arrays.equals(c, d));
```

> **Cạm bẫy #5**: `System.out.println(arr)` in ra `[I@6d06d69c` (kiểu + mã băm), không phải nội dung. Phải dùng `Arrays.toString(arr)`, mảng nhiều chiều dùng `Arrays.deepToString(arr)`.

## 5. String

`String` là **immutable** (bất biến): mọi thao tác "sửa" đều tạo ra object mới.

```java
String s = "hello";
s.toUpperCase();               // KHÔNG đổi s
s = s.toUpperCase();           // ✅ phải gán lại
```

### 5.1 API hay dùng
```java
String s = "  Java Backend  ";
s.length();                    // 17
s.trim();                      // "Java Backend"  (strip() cho Unicode, Java 11+)
s.isEmpty();                   // độ dài == 0
s.isBlank();                   // rỗng hoặc chỉ toàn khoảng trắng (Java 11+)
s.toUpperCase(); s.toLowerCase();
s.contains("Java");            // true
s.startsWith("  J");           // true
s.indexOf("Back");             // vị trí đầu tiên, -1 nếu không có
s.substring(2, 6);             // "Java"  (từ 2 đến 5)
s.replace("Java", "Kotlin");
"a,b,c".split(",");            // ["a","b","c"]
String.join("-", "a", "b");    // "a-b"
"Xin chao".charAt(0);          // 'X'
String.format("Tên %s, tuổi %d, điểm %.2f", "An", 20, 8.567);
"""
Văn bản nhiều dòng
giữ nguyên xuống dòng (Java 15+)
""";
```

### 5.2 So sánh chuỗi — cực kỳ quan trọng
```java
String a = "hello";
String b = "hello";
String c = new String("hello");

a == b        // true  — cùng trỏ vào String Pool
a == c        // false — c là object mới trên heap
a.equals(c)   // true  ✅ ĐÂY MỚI LÀ CÁCH ĐÚNG
a.equalsIgnoreCase("HELLO")   // true
```
**Luôn so sánh chuỗi bằng `.equals()`.** So sánh bằng `==` là lỗi kinh điển của người mới, và tệ ở chỗ nó *đôi khi* vẫn chạy đúng nên rất khó phát hiện.

Mẹo tránh NPE khi biến có thể null:
```java
if ("ADMIN".equals(role)) { }   // an toàn kể cả role == null
```

### 5.3 StringBuilder — khi nối chuỗi trong vòng lặp
```java
// ❌ Chậm: mỗi vòng lặp tạo một String mới → 10.000 object rác
String s = "";
for (int i = 0; i < 10_000; i++) { s += i; }

// ✅ Nhanh: dùng bộ đệm có thể thay đổi
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 10_000; i++) { sb.append(i); }
String result = sb.toString();
```
Nối vài chuỗi cố định (`"a" + b + "c"`) thì cứ dùng `+` — compiler tự tối ưu. Chỉ trong **vòng lặp** mới bắt buộc `StringBuilder`.

## 6. Method (hàm)

```java
//  [phạm vi] [static] [kiểu trả về] tênMethod([tham số])
public static int cong(int a, int b) {
    return a + b;
}

public static void inChao(String ten) {   // void = không trả về
    System.out.println("Chào " + ten);
}
```

### 6.1 Nạp chồng (overloading)
Cùng tên, khác **danh sách tham số**:
```java
static int cong(int a, int b) { return a + b; }
static double cong(double a, double b) { return a + b; }
static int cong(int a, int b, int c) { return a + b + c; }
```
Chỉ khác kiểu trả về là **không đủ** — sẽ lỗi biên dịch.

### 6.2 Tham số biến đổi (varargs)
```java
static int tong(int... so) {          // nhận 0..n tham số, bên trong là mảng
    int t = 0;
    for (int x : so) t += x;
    return t;
}
tong(); tong(1); tong(1, 2, 3);
```

### 6.3 Java truyền tham số kiểu gì? (câu hỏi phỏng vấn)
**Java luôn truyền theo giá trị (pass by value)** — kể cả với object, cái được sao chép là *giá trị của tham chiếu*.

```java
static void doiSo(int x) { x = 100; }
static void doiTen(Person p) { p.setName("B"); }     // ✅ đổi được nội dung object
static void thayThe(Person p) { p = new Person("C"); } // ❌ không ảnh hưởng bên ngoài

int n = 5;  doiSo(n);        // n vẫn = 5
Person p = new Person("A");
doiTen(p);                   // p.name = "B"
thayThe(p);                  // p.name vẫn "B"
```
Giải thích: `p` bên trong method là **bản sao của con trỏ**. Sửa *đối tượng nó trỏ tới* thì bên ngoài thấy; gán lại chính bản sao đó thì bên ngoài không thấy.

## 7. Nhập dữ liệu từ bàn phím

```java
import java.util.Scanner;

Scanner sc = new Scanner(System.in);
System.out.print("Tên: ");
String ten = sc.nextLine();
System.out.print("Tuổi: ");
int tuoi = sc.nextInt();
sc.nextLine();               // ⚠ "ăn" ký tự xuống dòng còn sót lại
System.out.print("Địa chỉ: ");
String dc = sc.nextLine();
```
> **Cạm bẫy #6**: sau `nextInt()`, ký tự Enter còn trong bộ đệm khiến `nextLine()` kế tiếp trả về chuỗi rỗng. Cách chắc chắn nhất: **luôn dùng `nextLine()` rồi tự parse**:
> ```java
> int tuoi = Integer.parseInt(sc.nextLine().trim());
> ```

## 8. Quy ước đặt tên (bắt buộc theo, mọi team Java đều dùng)

| Đối tượng | Quy tắc | Ví dụ |
|---|---|---|
| Class | PascalCase, danh từ | `OrderService`, `UserRepository` |
| Method | camelCase, động từ | `findById`, `calculateTotal` |
| Biến | camelCase | `totalPrice`, `userList` |
| Hằng số | UPPER_SNAKE_CASE | `MAX_RETRY`, `DEFAULT_PAGE_SIZE` |
| Package | chữ thường, không gạch | `com.company.order.service` |
| Boolean | is/has/can + … | `isActive`, `hasPermission` |

---

## Tổng kết & bẫy phải nhớ
1. `int/int` là chia nguyên → ép kiểu khi cần số thực.
2. Không dùng `double` cho tiền → `BigDecimal`.
3. So sánh object (String, Integer) bằng `.equals()`, không dùng `==`.
4. `array.length`, `String.length()`, `list.size()` — ba cách viết khác nhau, dễ nhầm.
5. Nối chuỗi trong vòng lặp → `StringBuilder`.
6. Java **pass by value**.

## Code trong module
- [src/Basics.java](src/Basics.java) — chạy thử toàn bộ các bẫy ở trên
- [src/StringDemo.java](src/StringDemo.java) — String & StringBuilder
- [src/MethodDemo.java](src/MethodDemo.java) — overloading, varargs, pass-by-value

```bash
java 01-java-core/src/Basics.java
```

👉 Làm [bai-tap.md](bai-tap.md) (bài chính) và [luyen-tay.md](luyen-tay.md) (40 bài nhỏ luyện phản xạ) rồi sang [Module 02 — OOP](../02-oop/).
