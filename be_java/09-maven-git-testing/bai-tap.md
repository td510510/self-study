# Bài tập Module 09 — Maven, Git & Testing

## Nhóm A — Maven

**A1.** Cài Maven, kiểm tra `mvn -v`. Tạo project mới:
```bash
mvn archetype:generate -DgroupId=com.learn -DartifactId=my-app \
  -DarchetypeArtifactId=maven-archetype-quickstart -DinteractiveMode=false
```
Chạy `mvn clean package`, tìm file jar trong `target/`, chạy `java -jar`.

**A2.** Thêm Jackson vào `pom.xml`, viết chương trình chuyển object ↔ JSON. (Đây là nhóm D của Module 04 mà bạn đã hoãn lại.)

**A3.** Chạy `mvn dependency:tree`, vẽ lại cây phụ thuộc. Chỉ ra thư viện nào là phụ thuộc bắc cầu.

**A4.** Cố tình tạo xung đột phiên bản (2 thư viện cần cùng 1 thư viện khác version), quan sát Maven chọn cái nào, rồi ép version bằng `dependencyManagement`.

**A5.** Cấu hình `maven-shade-plugin` để đóng gói "fat jar" chạy được bằng `java -jar` kèm mọi phụ thuộc.

**A6.** Giải thích khác nhau giữa `mvn package`, `mvn install`, `mvn deploy`.

## Nhóm B — Git

**B1.** Tạo repo cho toàn bộ bài tập của bạn, push lên GitHub, viết README mô tả lộ trình học.

**B2.** Thực hành luồng nhánh: tạo `feature/calculator`, commit 3 lần, merge vào `main`, xóa nhánh.

**B3.** Tạo xung đột (conflict) có chủ đích giữa 2 nhánh cùng sửa một dòng, rồi giải quyết thủ công.

**B4.** Thực hành cứu hộ, mỗi lệnh một tình huống:
- lỡ commit thiếu file → `git commit --amend`
- lỡ commit lên nhầm nhánh → `git reset --soft HEAD~1` rồi commit lại đúng nhánh
- muốn hủy 1 commit đã push → `git revert`
- đang làm dở phải chuyển việc gấp → `git stash`
- lỡ `reset --hard` mất commit → tìm lại bằng `git reflog`

**B5.** Viết `.gitignore` cho dự án Java + IntelliJ + Maven. Kiểm chứng `target/` không bị commit.

**B6.** Lỡ commit file chứa mật khẩu — nêu quy trình xử lý đúng (xóa khỏi lịch sử **và** đổi mật khẩu đó ngay, vì nó đã bị lộ).

**B7.** Tạo Pull Request trên GitHub từ nhánh feature, tự review, merge bằng "Squash and merge".

**B8. Luyện conflict.** Trên 2 nhánh khác nhau, sửa **cùng một dòng** trong một file theo 2 cách khác nhau. Merge nhánh thứ nhất vào `main`, rồi rebase nhánh thứ hai lên `main` và tự giải quyết conflict. Làm lại lần nữa bằng `git merge` thay cho rebase, so sánh `git log --oneline --graph` của hai cách.

**B9. Làm việc nhóm (cần 1 bạn học cùng, hoặc tự đóng 2 vai).** Bật **branch protection** cho `main` (bắt buộc PR + 1 approve + CI xanh). Mỗi người mở 1 PR cho repo của người kia theo mẫu mô tả ở mục 2.7, và review PR của người kia với ít nhất 3 comment có lý do cụ thể.
*Đạt khi*: không ai push thẳng được lên `main`; mỗi PR có mô tả đủ 3 phần *Vì sao / Thay đổi / Kiểm thử*.

**B10. Review thử.** Tìm ít nhất 6 vấn đề trong đoạn code sau, sắp theo mức độ nghiêm trọng, viết comment như khi review thật:
```java
@GetMapping("/orders")
public List<Order> orders(@RequestParam Long userId) {
    List<Order> result = new ArrayList<>();
    for (Order o : orderRepository.findAll()) {
        if (o.getUserId() == userId) {
            o.setCustomerName(userRepository.findById(o.getUserId()).get().getName());
            result.add(o);
        }
    }
    System.out.println("found " + result.size());
    return result;
}
```

## Nhóm C — JUnit

**C1.** Viết test đầy đủ cho `MathUtils` (bài F1 module 01): `isPrime`, `gcd`, `factorial`, `power`.
Bao gồm: ca thường, ca biên (0, 1, số âm, giá trị lớn), ca lỗi (ném exception).

**C2.** Dùng `@ParameterizedTest` với `@CsvSource` và `@MethodSource` cho ít nhất 2 hàm.

**C3.** Viết test cho `StringUtils`: `reverse`, `isPalindrome`, `capitalize`, `maskPhone`. Nhớ test `null` và chuỗi rỗng.

**C4.** Dùng `@Nested` nhóm test theo method; dùng `@DisplayName` tiếng Việt cho dễ đọc báo cáo.

**C5.** Viết test cho `BankAccount` (module 02): nạp, rút, số dư không đủ, số tiền âm, lịch sử giao dịch.

**C6.** Chạy `mvn test jacoco:report`, mở báo cáo, tìm nhánh code chưa được test và bổ sung test cho nhánh đó.

## Nhóm D — Mockito

**D1.** Trong `demo-project`, thêm test cho tình huống: cổng thanh toán ném exception (không phải trả `false`). Service nên xử lý thế nào?

**D2.** Viết `UserService` phụ thuộc `UserRepository` + `EmailSender`, test:
- đăng ký thành công → lưu user + gửi mail
- email đã tồn tại → ném exception, **không** lưu, **không** gửi mail
- gửi mail lỗi → user vẫn được lưu (quyết định nghiệp vụ, hãy test đúng quyết định đó)

**D3.** Dùng `ArgumentCaptor` kiểm tra nội dung email được gửi.

**D4.** Dùng `verify(mock, times(n))`, `never()`, `verifyNoMoreInteractions()`.

**D5.** Giả lập mock ném exception bằng `willThrow`, test service có bọc lỗi đúng không.

**D6.** Giải thích: khi nào **không nên** mock? (Gợi ý: đừng mock những gì bạn không sở hữu, đừng mock value object.)

## Nhóm E — TDD

**E1.** Làm bài FizzBuzz theo đúng TDD: viết test đỏ → code xanh → refactor. Ghi lại từng bước.

**E2.** Làm "Roman Numerals" (chuyển 1–3999 sang số La Mã) theo TDD, mỗi lần chỉ thêm 1 test.

**E3.** Làm lại `LibraryService` (mượn/trả sách) theo TDD: viết test cho quy tắc nghiệp vụ trước khi viết code.

## Nhóm F — Tổng hợp (bắt buộc)

**F1. Chuyển toàn bộ bài tập Module 01–05 sang một dự án Maven duy nhất**, có:
- `pom.xml` với JUnit 5, AssertJ, Mockito, Jackson.
- Cấu trúc package đúng chuẩn: `com.learn.<module>`.
- Ít nhất 30 test, độ phủ ≥ 70% cho các lớp logic.
- README mô tả cách chạy.
- Lịch sử Git sạch, commit message theo Conventional Commits.

*Đạt khi*: người khác clone về, chạy `mvn test`, mọi test xanh mà không cần cấu hình thêm gì.

---

## Câu hỏi phỏng vấn
1. Maven giải quyết vấn đề gì? `pom.xml` gồm những phần nào?
2. Các scope của dependency? `provided` khác `compile` thế nào?
3. Xung đột phiên bản xử lý ra sao?
4. `git merge` khác `git rebase`?
5. `git reset` khác `git revert`? Khi nào dùng cái nào?
6. `git push --force` và `--force-with-lease` khác nhau thế nào? Khi nào được phép force push?
7. Bạn xử lý conflict thế nào? Sau khi giải quyết conflict cần làm gì?
8. Khi review code bạn chú ý những gì? Một PR tốt trông như thế nào?
6. Unit test khác integration test?
7. Mock là gì? Khi nào nên và không nên mock?
8. Coverage 100% có nghĩa là code không có bug không?
9. TDD là gì? Lợi ích thực tế?
10. Test tốt cần thỏa những tiêu chí nào? (Gợi ý: F.I.R.S.T — Fast, Independent, Repeatable, Self-validating, Timely)
