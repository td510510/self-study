# Dự án 1 — Hệ thống quản lý thư viện (Console)

> Làm sau Module 09. Mục tiêu: gộp toàn bộ Java core + OOP + Collections + Exception + Stream + Testing vào một ứng dụng hoàn chỉnh, **có kiến trúc đúng chuẩn** để sau này nâng thẳng lên Spring Boot.

## Chạy thử

**Cách 1 — không cần Maven:**
```bash
cd projects/p1-library-console
javac -encoding UTF-8 -d out $(find src/main -name "*.java")
java -Dfile.encoding=UTF-8 -cp out com.learn.library.LibraryApplication
```
Windows PowerShell:
```powershell
javac -encoding UTF-8 -d out (Get-ChildItem -Recurse src\main -Filter *.java).FullName
java "-Dfile.encoding=UTF-8" -cp out com.learn.library.LibraryApplication
```

**Cách 2 — có Maven:**
```bash
mvn clean package
java -jar target/library-console-1.0.0.jar
mvn test                 # chạy 30+ test
mvn test jacoco:report   # báo cáo độ phủ: target/site/jacoco/index.html
```

> Tiếng Việt bị vỡ font trên terminal Windows? Chạy `chcp 65001` trước, hoặc chạy trong IntelliJ.

## Kiến trúc

```
com.learn.library
├── LibraryApplication      ← composition root: nơi DUY NHẤT lắp ráp phụ thuộc
├── model/                  ← Book, Member, Loan (dữ liệu + quy tắc của chính nó)
├── repository/             ← interface + bản cài in-memory
│     Repository<T,ID>, BookRepository, MemberRepository, LoanRepository
├── service/                ← LibraryService: toàn bộ nghiệp vụ
├── ui/                     ← ConsoleUI: chỉ nhập/xuất
├── exception/              ← LibraryException, NotFoundException, BusinessRuleException
└── util/                   ← SampleData
```

Luồng phụ thuộc **một chiều**: `ui → service → repository → model`.

Ba điều quan trọng nhất trong thiết kế này:
1. `LibraryService` **không biết** dữ liệu được lưu ở đâu — nó chỉ thấy interface. Muốn đổi sang lưu file JSON hay PostgreSQL, viết class mới implement `BookRepository`, service không sửa một dòng.
2. Mọi phụ thuộc tiêm qua **constructor** → test được bằng mock.
3. `ConsoleUI` không chứa quy tắc nghiệp vụ nào. Ở Dự án 2, ta thay nó bằng REST Controller và **service dùng lại nguyên vẹn**.

## Quy tắc nghiệp vụ đã cài

| Quy tắc | Nơi kiểm tra |
|---|---|
| Mỗi thành viên giữ tối đa 3 cuốn | `LibraryService.borrowBook` |
| Sách hết bản thì không cho mượn | `Book.isAvailable` + service |
| Không mượn 2 bản cùng một đầu sách | service |
| Có sách quá hạn thì không mượn thêm | service |
| Thành viên bị khóa không được mượn | service |
| Hạn trả 14 ngày, trễ phạt 5.000đ/ngày | `Loan` |
| Sách đang có người mượn thì không xóa được | service |
| ISBN và email không được trùng | service |

## Test

```
LibraryServiceTest      — 20 test, dùng repository in-memory thật
LibraryServiceMockTest  — 4 test, dùng Mockito để kiểm chứng tương tác
```
Đã bao phủ: luồng thành công, mọi luồng lỗi, và các **ca biên** (trả đúng ngày hạn, mượn cuốn thứ 4, trả 2 lần).

## Bài tập mở rộng (làm tiếp để lên trình)

**Mức 1 — dữ liệu bền vững**
1. Viết `JsonBookRepository implements BookRepository` lưu xuống file JSON (Jackson). Chứng minh chỉ cần đổi một dòng trong `LibraryApplication`.
2. Tự động lưu khi thoát, tự động nạp khi khởi động.
3. Viết test cho repository JSON dùng thư mục tạm (`@TempDir`).

**Mức 2 — tính năng**
4. Đặt trước sách (reservation): hết bản thì xếp hàng, có người trả thì thông báo cho người đầu hàng.
5. Gia hạn lượt mượn (tối đa 1 lần, chỉ khi chưa quá hạn).
6. Lịch sử mượn của thành viên + xuất báo cáo CSV.
7. Tự động khóa thành viên có phí phạt chưa trả > 100.000đ.
8. Tìm kiếm nâng cao: theo nhiều tiêu chí kết hợp, phân trang.

**Mức 3 — kỹ thuật**
9. Thay `InMemory*Repository` bằng `Jdbc*Repository` với PostgreSQL (Module 08). Mượn sách phải nằm trong một transaction.
10. Ghi log ra file bằng SLF4J + Logback thay cho `System.out`.
11. Tách `LibraryService` thành `BookService`, `MemberService`, `LoanService` (nguyên tắc Single Responsibility) — cân nhắc xem có đáng không và giải thích lựa chọn.
12. Đạt độ phủ test ≥ 85% cho package `service`.

## Tự chấm

- [ ] Chạy được, không crash dù nhập bậy bất kỳ đâu
- [ ] Không có quy tắc nghiệp vụ nào nằm trong `ui/`
- [ ] `service` không import gì từ `ui`
- [ ] Mọi phụ thuộc tiêm qua constructor
- [ ] Không dùng `double` cho tiền
- [ ] Exception có thông điệp tiếng Việt rõ ràng, nêu được nguyên nhân
- [ ] Test phủ cả luồng lỗi và ca biên
- [ ] README + commit history sạch sẽ trên GitHub

Xong dự án này, bạn đã đủ nền tảng để bước vào Spring. 👉 [Module 10 — Spring Core](../../10-spring-core/)
