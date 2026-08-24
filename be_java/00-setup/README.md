# Module 00 — Chuẩn bị môi trường & chương trình đầu tiên

> Mục tiêu: cài đủ công cụ, hiểu Java *chạy như thế nào*, viết và chạy được chương trình đầu tiên bằng cả 2 cách (dòng lệnh và IDE).

---

## 1. Java là gì và vì sao doanh nghiệp dùng Java cho backend?

Java là ngôn ngữ **biên dịch sang bytecode** rồi chạy trên **JVM (Java Virtual Machine)**. Điều này khác với:
- Python/JS: thông dịch trực tiếp mã nguồn.
- C/C++: biên dịch thẳng ra mã máy của một hệ điều hành cụ thể.

```
HelloWorld.java  --javac-->  HelloWorld.class  --JVM-->  chạy trên Win/Linux/Mac
  (mã nguồn)                    (bytecode)                (mã máy tương ứng)
```

Vì bytecode không phụ thuộc hệ điều hành nên có câu "**Write once, run anywhere**". Bạn build trên Windows, deploy lên Linux server — cùng một file.

Lý do Java thống trị backend doanh nghiệp:
1. **Kiểu tĩnh (static typing)** — lỗi bị bắt lúc biên dịch, cực quan trọng với hệ thống 500k dòng code và 30 người cùng sửa.
2. **JVM cực kỳ trưởng thành** — tối ưu runtime (JIT), GC tốt, chịu tải lớn và ổn định nhiều năm.
3. **Hệ sinh thái Spring** — chuẩn công nghiệp cho web/microservice.
4. **Thị trường việc làm lớn**, đặc biệt ngân hàng, fintech, viễn thông, outsourcing.

## 2. JDK, JRE, JVM — phân biệt (câu hỏi phỏng vấn kinh điển)

| Thành phần | Là gì | Chứa gì |
|---|---|---|
| **JVM** | Máy ảo thực thi bytecode | Trình thông dịch + JIT + GC |
| **JRE** | Môi trường chạy | JVM + thư viện chuẩn (java.lang, java.util…) |
| **JDK** | Bộ công cụ phát triển | JRE + `javac` (compiler) + `jar`, `javadoc`, `jshell`… |

**Lập trình viên luôn cài JDK.** (Từ Java 11 trở đi Oracle không phát hành JRE riêng nữa.)

### Phiên bản nào?
Java phát hành 6 tháng/lần, nhưng chỉ bản **LTS (Long-Term Support)** được hỗ trợ dài hạn: **8, 11, 17, 21, 25**.

- Học và làm dự án mới: **Java 21 hoặc 25** (có record, sealed, pattern matching, virtual threads).
- Đi làm thực tế: rất nhiều dự án còn Java 8/11 — nên bạn phải biết cả cú pháp cũ. Chương trình này sẽ ghi rõ tính năng nào cần Java bao nhiêu.

Chương trình này dùng **JDK 21+** (máy bạn đang có JDK 25 — quá tốt).

## 3. Cài đặt

### 3.1 JDK
Kiểm tra trước:
```bash
java -version
javac -version
```
Nếu chưa có, tải **Eclipse Temurin (Adoptium)** — bản OpenJDK miễn phí, license thoải mái:
https://adoptium.net/temurin/releases/ → chọn JDK 21 (LTS) → `.msi` cho Windows → tick **"Set JAVA_HOME variable"**.

Kiểm tra biến môi trường:
```bash
echo $JAVA_HOME        # Git Bash
echo %JAVA_HOME%       # cmd
```
Nếu rỗng: Windows → "Edit the system environment variables" → Environment Variables → New:
- `JAVA_HOME` = `C:\Program Files\Eclipse Adoptium\jdk-21...`
- Thêm `%JAVA_HOME%\bin` vào biến `Path`.

> **Vì sao cần JAVA_HOME?** Maven, Gradle, Tomcat, IDE đều dò biến này để biết dùng JDK nào. Thiếu nó là nguồn gốc của rất nhiều lỗi kiểu "JAVA_HOME is not set".

### 3.2 IDE — chọn IntelliJ IDEA Community
Tải: https://www.jetbrains.com/idea/download (chọn **Community Edition**, miễn phí).

Vì sao IntelliJ mà không phải Eclipse/VS Code? Gợi ý code, refactor, debug và tích hợp Spring của IntelliJ tốt hơn hẳn; đây là IDE mặc định của đa số team Java.

Phím tắt phải thuộc lòng ngay tuần đầu:

| Phím | Tác dụng |
|---|---|
| `Shift Shift` | Tìm mọi thứ |
| `Ctrl+N` | Tìm class |
| `Alt+Enter` | Sửa lỗi / gợi ý (quan trọng nhất) |
| `Ctrl+B` | Nhảy tới định nghĩa |
| `Ctrl+Alt+L` | Format code |
| `Shift+F10` | Chạy lại |
| `Shift+F9` | Debug |
| `Ctrl+/` | Comment dòng |
| `psvm` + Tab | sinh `public static void main` |
| `sout` + Tab | sinh `System.out.println()` |

### 3.3 Công cụ khác (cài dần theo module)
- **Git** — https://git-scm.com (module 09)
- **Maven** — module 09 (hoặc dùng Maven Wrapper `./mvnw`, không cần cài)
- **PostgreSQL + DBeaver** — module 08
- **Docker Desktop** — module 15
- **Postman** hoặc `curl` — module 11

## 4. Chương trình đầu tiên

Tạo file `HelloWorld.java`:

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Xin chào Java Backend!");
    }
}
```

Chạy theo **cách cổ điển** (2 bước):
```bash
javac HelloWorld.java     # sinh ra HelloWorld.class
java HelloWorld           # chú ý: KHÔNG có .class
```

Chạy theo **cách mới** (Java 11+, chạy thẳng 1 file, tiện để học):
```bash
java HelloWorld.java
```

### Mổ xẻ từng chữ trong đoạn code trên
```java
public class HelloWorld {                     // (1)
    public static void main(String[] args) {  // (2)(3)(4)(5)(6)
        System.out.println("...");            // (7)
    }
}
```
1. `public class HelloWorld` — mọi code Java phải nằm trong một class. Tên class **phải trùng tên file** nếu class là `public`.
2. `public` — JVM ở ngoài phải gọi được method này.
3. `static` — gọi được mà **không cần tạo object**. Lúc JVM khởi động chưa có object nào cả, nên `main` bắt buộc `static`.
4. `void` — không trả về giá trị.
5. `main` — tên cố định, JVM tìm đúng chữ này làm điểm bắt đầu.
6. `String[] args` — tham số dòng lệnh. Chạy `java HelloWorld a b` thì `args = ["a", "b"]`.
7. `System.out.println` — `System` là class chuẩn, `out` là luồng xuất chuẩn, `println` in kèm xuống dòng.

> **Cạm bẫy thường gặp**: `Error: Could not find or load main class` — thường do gõ `java HelloWorld.class`, hoặc đang đứng sai thư mục, hoặc file có khai báo `package` mà chạy sai đường dẫn.

## 5. Package & cấu trúc thư mục chuẩn

`package` là "họ tên đầy đủ" của class, tránh trùng tên giữa các thư viện. Quy ước: tên miền công ty viết ngược.

```java
package com.learn.basics;

public class Greeter { }
```

Cấu trúc thư mục **phải khớp** package:
```
src/
└── com/
    └── learn/
        └── basics/
            └── Greeter.java
```

Cấu trúc chuẩn Maven (dùng từ module 09 trở đi):
```
my-app/
├── pom.xml                              # khai báo thư viện, cấu hình build
└── src/
    ├── main/
    │   ├── java/com/learn/App.java      # code chính
    │   └── resources/                   # file cấu hình (application.yml…)
    └── test/
        └── java/com/learn/AppTest.java  # code test
```
Nhớ cấu trúc này — mọi dự án Java ngoài thực tế đều như vậy.

## 6. jshell — phòng thí nghiệm bỏ túi

Muốn thử nhanh một dòng code mà không cần tạo class:
```bash
jshell
```
```
jshell> int a = 5
a ==> 5
jshell> a * 2 + 1
$2 ==> 11
jshell> "hello".toUpperCase()
$3 ==> "HELLO"
jshell> /exit
```
Dùng jshell để kiểm chứng mọi thắc mắc nhỏ trong lúc học. Rất hiệu quả.

## 6b. Tiếng Việt bị lỗi font trên terminal Windows?

Nếu chạy `java Greeter.java Thinh` mà ra `Ch�o Thinh!`, đó **không phải lỗi code** — console Windows đang dùng bảng mã cũ. Khắc phục:

```bash
chcp 65001                       # chuyển console sang UTF-8 (cmd/PowerShell)
java -Dfile.encoding=UTF-8 Greeter.java Thinh
```
Hoặc chạy trong IntelliJ (mặc định UTF-8). Với dự án Maven sau này, ta sẽ đặt `<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>` trong `pom.xml` để không bao giờ gặp lại vấn đề này.

## 7. Đọc lỗi — kỹ năng sống còn

Java có 2 loại lỗi bạn sẽ gặp mỗi ngày:

**Lỗi biên dịch (compile error)** — code sai cú pháp/kiểu, chưa chạy được:
```
HelloWorld.java:3: error: ';' expected
        System.out.println("hi")
                                ^
```
Đọc theo thứ tự: *tên file : số dòng : mô tả*. Luôn sửa **lỗi đầu tiên** trước rồi biên dịch lại — các lỗi sau thường chỉ là hệ quả.

**Lỗi lúc chạy (runtime exception)**:
```
Exception in thread "main" java.lang.NullPointerException
    at com.learn.App.main(App.java:7)
```
Đọc từ **dòng đầu** (loại lỗi) và **dòng `at` đầu tiên có tên class của bạn** (vị trí lỗi). Module 04 và 07 sẽ đào sâu.

---

## Tổng kết
- JDK = JRE + công cụ dev; bạn luôn cài JDK.
- Code → `javac` → bytecode `.class` → JVM chạy.
- `main` phải là `public static void main(String[] args)`.
- Cấu trúc thư mục phải khớp `package`; ghi nhớ layout Maven.

👉 Làm [bai-tap.md](bai-tap.md) rồi sang [Module 01 — Java Core](../01-java-core/).
