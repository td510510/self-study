# Bài tập Module 00

## Bài 1 — Xác minh môi trường
Chạy và ghi lại kết quả:
```bash
java -version
javac -version
echo $JAVA_HOME
```
**Đạt khi**: cả 3 lệnh đều ra kết quả, phiên bản `javac` khớp `java`.

## Bài 2 — Hello World bằng dòng lệnh
Tạo `HelloWorld.java` in ra tên bạn, biên dịch bằng `javac`, chạy bằng `java`.
**Đạt khi**: bạn giải thích được `.class` sinh ra ở đâu và vì sao chạy `java HelloWorld.class` lại lỗi.

## Bài 3 — Tham số dòng lệnh
Viết `Greeter.java` nhận tên qua `args` và in `Chào <tên>!`. Nếu không truyền tham số thì in `Chào người lạ!`.
```bash
java Greeter.java Thinh   # Chào Thinh!
java Greeter.java         # Chào người lạ!
```
**Đạt khi**: không bị `ArrayIndexOutOfBoundsException` khi chạy không tham số.
(Lời giải tham khảo: [src/Greeter.java](src/Greeter.java) — chỉ xem sau khi đã tự làm.)

## Bài 4 — Package
Tạo class `com.learn.basics.Calculator` có method `static int add(int a, int b)`, và class `com.learn.Main` gọi nó.
Biên dịch và chạy từ thư mục gốc:
```bash
javac -d out src/com/learn/Main.java src/com/learn/basics/Calculator.java
java -cp out com.learn.Main
```
**Đạt khi**: hiểu `-d`, `-cp` làm gì và vì sao thư mục phải khớp package.

## Bài 5 — jshell
Dùng jshell tính `7 / 2` với kiểu `int` và với kiểu `double`. Giải thích tại sao kết quả khác nhau.

## Bài 6 — Cố tình gây lỗi
Tạo 3 lỗi rồi đọc thông báo:
(a) thiếu `;` — (b) tên class khác tên file — (c) gọi method trên biến `null`.
**Đạt khi**: bạn chỉ ra được lỗi nào là compile-time, lỗi nào là runtime.

## Bài 7 — Thiết lập IDE
Tạo project trong IntelliJ, chạy Hello World bằng nút Run, rồi đặt breakpoint ở dòng `println` và chạy Debug (`Shift+F9`), xem giá trị biến.
**Đạt khi**: bạn dùng được Step Over (`F8`) và Resume (`F9`).

## Bài 8 — Khởi tạo Git repo học tập
```bash
git init
git add .
git commit -m "module 00: setup"
```
Tạo repo trên GitHub và push lên. Repo này sẽ là portfolio của bạn — commit mỗi ngày học.
