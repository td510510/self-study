# Module 09 — Maven, Git & Testing

> Mục tiêu: dùng thành thạo 3 công cụ mà **mọi** dự án Java đều có — quản lý thư viện, quản lý mã nguồn, và kiểm thử tự động.
> Thời lượng: 1 tuần. Sau module này bạn làm **Dự án 1**.

---

## Phần 1 — Maven

### 1.1 Maven giải quyết vấn đề gì?
Trước Maven: tải jar thủ công, jar này cần jar kia, mỗi máy một cấu trúc thư mục, build bằng script riêng. Maven chuẩn hóa:
- **Khai báo** thư viện, Maven tự tải cả cây phụ thuộc.
- **Quy ước** cấu trúc thư mục thống nhất.
- **Vòng đời build** giống nhau ở mọi máy và trên CI.

### 1.2 Cài đặt
Tải: https://maven.apache.org/download.cgi → giải nén → thêm `bin` vào `PATH`. Kiểm tra: `mvn -v`.

Hoặc **không cần cài**: dùng Maven Wrapper có sẵn trong dự án Spring Boot (`./mvnw`, `mvnw.cmd`). Đây là cách khuyến nghị vì cả team dùng đúng một phiên bản Maven.

### 1.3 pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>

    <!-- Toạ độ định danh dự án -->
    <groupId>com.learn</groupId>
    <artifactId>library</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.17.2</version>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.2</version>
            <scope>test</scope>            <!-- chỉ dùng khi test, không đóng gói -->
        </dependency>
    </dependencies>
</project>
```

**Scope** hay dùng: `compile` (mặc định), `test` (chỉ khi test), `provided` (môi trường chạy đã có), `runtime` (chỉ cần lúc chạy, ví dụ driver DB).

### 1.4 Vòng đời & lệnh
```bash
mvn clean            # xóa thư mục target/
mvn compile          # biên dịch src/main/java
mvn test             # chạy test
mvn package          # đóng gói jar/war vào target/
mvn install          # cài vào kho local ~/.m2 để dự án khác dùng
mvn clean package -DskipTests
mvn dependency:tree  # xem cây phụ thuộc — cứu tinh khi xung đột version
mvn versions:display-dependency-updates
```

### 1.5 Xung đột phiên bản
Hai thư viện cùng cần một thư viện thứ ba nhưng khác phiên bản → Maven chọn theo "đường ngắn nhất tới gốc". Xử lý bằng `dependencyManagement` hoặc loại trừ:
```xml
<dependency>
    <groupId>a</groupId><artifactId>b</artifactId><version>1.0</version>
    <exclusions>
        <exclusion><groupId>c</groupId><artifactId>d</artifactId></exclusion>
    </exclusions>
</dependency>
```
Triệu chứng điển hình: `NoSuchMethodError`, `ClassNotFoundException` lúc chạy dù compile ổn → chạy ngay `mvn dependency:tree`.

## Phần 2 — Git

### 2.1 Thiết lập
```bash
git config --global user.name "Tên bạn"
git config --global user.email "email@example.com"
git config --global init.defaultBranch main
git config --global core.autocrlf true      # Windows
```

### 2.2 Luồng làm việc hằng ngày
```bash
git status
git add .                     # hoặc git add -p để chọn từng phần
git commit -m "feat: thêm API tạo đơn hàng"
git pull --rebase origin main
git push origin main

git log --oneline --graph --all
git diff                      # thay đổi chưa stage
git diff --staged
```

### 2.3 Nhánh
```bash
git switch -c feature/user-api      # tạo và chuyển nhánh
git switch main
git merge feature/user-api
git branch -d feature/user-api
```

**Quy ước nhánh** phổ biến trong công ty:
```
main            # code production, luôn chạy được
develop         # tích hợp
feature/xxx     # tính năng mới
bugfix/xxx      # sửa lỗi
hotfix/xxx      # sửa gấp trên production
release/1.2.0
```

### 2.4 Commit message chuẩn (Conventional Commits)
```
feat:     tính năng mới
fix:      sửa lỗi
docs:     tài liệu
refactor: sửa cấu trúc code, không đổi hành vi
test:     thêm/sửa test
chore:    việc lặt vặt (nâng version, cấu hình)

Ví dụ: feat(order): thêm API hủy đơn hàng
       fix(auth): sửa lỗi token hết hạn không refresh được
```

### 2.5 Cứu hộ khi lỡ tay
```bash
git restore <file>                   # bỏ thay đổi chưa stage
git restore --staged <file>          # bỏ stage
git commit --amend                   # sửa commit cuối (CHƯA push)
git reset --soft HEAD~1              # hủy commit, giữ nguyên thay đổi
git reset --hard HEAD~1              # hủy commit VÀ thay đổi (nguy hiểm)
git revert <hash>                    # tạo commit đảo ngược (an toàn, dùng khi đã push)
git stash / git stash pop            # cất tạm để chuyển việc
git reflog                           # nhật ký mọi thao tác — cứu được cả commit đã "mất"
```
Quy tắc vàng: **đã push lên nhánh chung thì không `reset --hard`/`push --force`**, hãy dùng `revert`.

### 2.6 .gitignore cho dự án Java
```
target/
out/
*.class
.idea/
*.iml
.env
application-local.yml
```
**Không bao giờ commit**: mật khẩu, API key, file `.env`, file build.

### 2.7 Làm việc nhóm: branch, Pull Request & code review

Ở công ty bạn **không bao giờ** push thẳng lên `main`. Mọi thay đổi đi qua quy trình:

```
main ──●──────────────●────────────●───►   (luôn chạy được, được bảo vệ: cấm push trực tiếp)
        \            / (squash merge)
         ●──●──●────●   feature/SHOP-123-them-voucher
         code  push  PR -> CI xanh -> review -> sửa -> approve -> merge
```

**Quy trình một ngày làm việc điển hình:**
```bash
git switch main && git pull                        # 1. lấy code mới nhất
git switch -c feature/SHOP-123-them-voucher        # 2. nhánh mới, đặt tên theo mã ticket
# ... code, commit nhỏ thường xuyên ...
git fetch origin && git rebase origin/main         # 3. cập nhật theo main (xem ghi chú bên dưới)
git push -u origin feature/SHOP-123-them-voucher   # 4. đẩy lên
# 5. mở Pull Request (GitHub) / Merge Request (GitLab) trên web
```

**Chiến lược nhánh** — phần lớn team hiện nay dùng **trunk-based / GitHub flow**: chỉ có `main` + các nhánh feature sống ngắn (1–3 ngày), merge thường xuyên. **Git flow** (có thêm `develop`, `release/*`, `hotfix/*`) vẫn gặp ở dự án phát hành theo đợt (ngân hàng, outsource). Vào team nào thì hỏi team đó dùng gì.

**Merge hay rebase?**
- `git merge origin/main` vào nhánh của bạn: an toàn, sinh thêm commit merge.
- `git rebase origin/main`: đặt các commit của bạn lên đầu main, lịch sử thẳng. **Chỉ rebase nhánh của riêng bạn**; sau khi rebase một nhánh đã push thì phải `git push --force-with-lease` (không dùng `--force` trần: `--force-with-lease` từ chối nếu người khác vừa push lên nhánh đó).

**Xử lý conflict:**
```bash
git rebase origin/main          # báo CONFLICT ở OrderService.java
# mở file, tìm các đoạn:
# <<<<<<< HEAD          (code trên main)
# =======
# >>>>>>> abc123        (code của bạn)
# sửa thành bản đúng (thường là KẾT HỢP cả hai), xóa các dòng đánh dấu
git add OrderService.java
git rebase --continue           # hoặc git rebase --abort để hủy, quay về như trước
mvn test                        # BẮT BUỘC chạy lại test: hết conflict không có nghĩa là code đúng
```

**Một Pull Request tốt:**
- **Nhỏ**: dưới ~400 dòng thay đổi. PR 2.000 dòng sẽ được "LGTM" cho qua mà không ai đọc kỹ.
- **Một mục đích**: không trộn sửa bug + refactor + đổi format trong cùng PR.
- **Mô tả rõ**:
  ```markdown
  ## Vì sao
  SHOP-123: khách muốn nhập mã giảm giá khi thanh toán.

  ## Thay đổi
  - Thêm bảng `vouchers` (migration V7)
  - `POST /api/v1/orders` nhận thêm `voucherCode` (tùy chọn, tương thích ngược)
  - Voucher hết hạn/hết lượt -> 409 VOUCHER_INVALID

  ## Kiểm thử
  - Unit test VoucherServiceTest (8 case), integration test OrderFlowIT
  - Đã thử tay bằng api.http

  ## Lưu ý khi deploy
  Chạy migration trước khi deploy bản mới.
  ```
- **CI xanh** trước khi nhờ review. **Tự review** diff của mình trên web trước — bạn sẽ tự bắt được một nửa lỗi.

**Khi review code người khác**, xem theo thứ tự ưu tiên:
1. **Đúng không?** Logic, trường hợp biên (null, rỗng, số âm), xử lý lỗi, đồng thời (race condition).
2. **An toàn không?** SQL injection, thiếu kiểm tra quyền (IDOR), lộ dữ liệu nhạy cảm trong log/response.
3. **Hiệu năng?** N+1, gọi DB/API trong vòng lặp, thiếu index, thiếu phân trang.
4. **Có test không?** Test có thật sự kiểm tra hành vi hay chỉ để tăng coverage?
5. **Dễ đọc không?** Tên biến, hàm quá dài, trùng lặp.
6. Format/style → để **công cụ** lo (formatter, Checkstyle, Spotless), không tốn công review.

Viết comment về **code**, không về **người**; đưa lý do và gợi ý:
```
❌ "Sai rồi."
✅ "Chỗ này gọi findById trong vòng lặp nên sẽ ra N+1 query khi danh sách dài.
    Dùng findAllById(ids) một lần được không?"
✅ "nit: tên `data2` hơi khó hiểu, đổi thành `activeVouchers`?"   (nit = góp ý nhỏ, không bắt buộc)
```
**Khi nhận review**: đừng tự ái — review là cho code, không phải cho bạn. Sửa xong thì trả lời từng comment ("Đã sửa ở commit abc123" hoặc giải thích vì sao giữ nguyên), không tự bấm "Resolve" comment của người khác.

## Phần 3 — Testing (phần quan trọng nhất module này)

### 3.1 Vì sao viết test?
Không phải để "cho đẹp". Test cho bạn **dám sửa code**: refactor xong chạy test là biết còn đúng hay không. Dự án không có test thì càng lớn càng chậm, vì ai cũng sợ đụng vào.

Kim tự tháp test:
```
        /\      E2E        ít, chậm, giòn
       /  \     Integration  vừa (API + DB thật qua Testcontainers)
      /____\    Unit         nhiều, nhanh, rẻ
```

### 3.2 JUnit 5

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.10.2</version>
    <scope>test</scope>
</dependency>
```

```java
class CalculatorTest {

    Calculator calc;

    @BeforeEach void setUp() { calc = new Calculator(); }      // chạy trước MỖI test
    @AfterEach  void tearDown() { }
    @BeforeAll static void initAll() { }                        // chạy 1 lần cho cả class

    @Test
    @DisplayName("Cộng hai số dương trả về tổng đúng")
    void cong_haiSoDuong_traVeTong() {
        // Given (chuẩn bị)
        int a = 2, b = 3;
        // When (hành động)
        int result = calc.add(a, b);
        // Then (kiểm chứng)
        assertEquals(5, result);
    }

    @Test
    void chiaChoKhong_nemException() {
        var ex = assertThrows(ArithmeticException.class, () -> calc.divide(1, 0));
        assertEquals("Không thể chia cho 0", ex.getMessage());
    }

    @ParameterizedTest                                          // một test, nhiều bộ dữ liệu
    @CsvSource({"1,1,2", "2,3,5", "-1,1,0"})
    void cong_nhieuTruongHop(int a, int b, int expected) {
        assertEquals(expected, calc.add(a, b));
    }

    @Test @Disabled("Chờ API bên thứ 3")
    void chuaLam() { }
}
```

**Đặt tên test**: `<method>_<tình huống>_<kết quả mong đợi>` — ví dụ `withdraw_soDuKhongDu_nemException`. Đọc tên là biết hỏng gì khi test đỏ.

**Cấu trúc Given–When–Then**: mọi test nên có 3 khối rõ ràng này.

### 3.3 AssertJ — assert dễ đọc hơn nhiều
```java
assertThat(user.getName()).isEqualTo("An");
assertThat(list).hasSize(3).contains("a").doesNotContain("z");
assertThat(user).isNotNull().extracting(User::getEmail).isEqualTo("a@b.com");
assertThatThrownBy(() -> service.withdraw(-1))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("phải > 0");
```

### 3.4 Mockito — thay thế phụ thuộc
Unit test chỉ nên kiểm tra **một** class. Các phụ thuộc (repository, gateway thanh toán) được thay bằng "hàng giả".

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository repository;          // đối tượng giả
    @Mock PaymentGateway payment;
    @InjectMocks OrderService service;         // tự tiêm 2 mock trên vào constructor

    @Test
    void taoDon_khiHopLe_luuVaThanhToan() {
        // Given
        given(repository.save(any(Order.class))).willAnswer(inv -> inv.getArgument(0));
        given(payment.charge(anyLong())).willReturn(true);

        // When
        Order result = service.create(new OrderRequest(1L, 100_000));

        // Then
        assertThat(result.getStatus()).isEqualTo(Status.PAID);
        verify(repository).save(any(Order.class));       // đã gọi đúng 1 lần
        verify(payment).charge(100_000L);
    }

    @Test
    void taoDon_khiThanhToanLoi_nemException() {
        given(payment.charge(anyLong())).willReturn(false);

        assertThatThrownBy(() -> service.create(new OrderRequest(1L, 100_000)))
                .isInstanceOf(PaymentFailedException.class);

        verify(repository, never()).save(any());          // KHÔNG được lưu
    }
}
```

Ghi nhớ: **chỉ mock được cái bạn tiêm từ ngoài vào**. Đây chính là lý do Module 02 nhấn mạnh "phụ thuộc vào interface, nhận qua constructor". Code không tiêm phụ thuộc thì không test được.

### 3.5 Test cái gì?
✅ Nên test: logic nghiệp vụ, tính toán, validate, xử lý biên (rỗng, null, số âm, 0, giá trị max), luồng lỗi.
❌ Không cần test: getter/setter, framework, thư viện bên thứ ba.

**Độ phủ (coverage)** là chỉ báo, không phải mục tiêu. 80% coverage với test vô nghĩa còn tệ hơn 50% test đúng chỗ. Đo bằng JaCoCo:
```bash
mvn test jacoco:report     # xem target/site/jacoco/index.html
```

### 3.6 TDD — viết test trước
```
🔴 Red    → viết test cho tính năng chưa có, test hỏng
🟢 Green  → viết code tối thiểu để test xanh
🔵 Refactor → dọn code, test vẫn xanh
```
Không bắt buộc theo TDD 100%, nhưng hãy thử với các hàm logic thuần — bạn sẽ thấy thiết kế API của mình tự nhiên tốt hơn.

---

## Tổng kết
- Maven: `pom.xml`, scope, vòng đời, `dependency:tree` khi xung đột.
- Git: nhánh, commit message chuẩn, và các lệnh cứu hộ.
- JUnit 5 + AssertJ + Mockito; Given–When–Then; test logic nghiệp vụ và ca biên.
- Không tiêm phụ thuộc = không test được.

## Code trong module
- [demo-project/](demo-project/) — dự án Maven hoàn chỉnh có test chạy được
  ```bash
  cd 09-maven-git-testing/demo-project
  mvn test
  ```

👉 Làm [bai-tap.md](bai-tap.md), sau đó bắt tay vào **[Dự án 1 — Quản lý thư viện](../projects/p1-library-console/)**.
