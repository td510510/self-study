# Module 12 — Spring Data JPA & Hibernate

> Mục tiêu: ánh xạ object ↔ bảng, viết truy vấn, hiểu quan hệ, và **tránh N+1** — vấn đề hiệu năng số 1 của mọi ứng dụng Spring.
> Thời lượng: 2 tuần.

---

## 1. JPA, Hibernate, Spring Data — ai là ai?

| | Là gì |
|---|---|
| **JPA** | *Đặc tả* (interface): `@Entity`, `EntityManager`… |
| **Hibernate** | *Bản cài đặt* JPA phổ biến nhất — thứ thực sự sinh SQL |
| **Spring Data JPA** | Lớp bọc trên Hibernate, sinh code repository tự động |

Nhớ lại `JdbcUserRepository` ở Module 08 — 30 dòng cho một hàm `findById`. Spring Data viết hộ toàn bộ:
```java
public interface UserRepository extends JpaRepository<User, Long> { }
```
Chỉ dòng này bạn đã có `save`, `findById`, `findAll`, `deleteById`, `count`, phân trang, sắp xếp.

**Đánh đổi**: tiện nhưng che giấu SQL. Nếu không hiểu nó sinh SQL gì, bạn sẽ tạo ra API chậm mà không biết vì sao. Vì vậy **luôn bật xem SQL trong lúc dev**:
```yaml
spring:
  jpa:
    show-sql: true
    properties:
      hibernate.format_sql: true
logging:
  level:
    org.hibernate.orm.jdbc.bind: trace     # xem cả giá trị tham số
```

## 2. Entity

```java
@Entity
@Table(name = "books", indexes = @Index(name = "idx_books_isbn", columnList = "isbn"))
@Getter @Setter
@NoArgsConstructor                      // JPA BẮT BUỘC có constructor rỗng
@AllArgsConstructor
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String isbn;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)        // LUÔN dùng STRING, không dùng ORDINAL
    private BookStatus status;

    @Column(precision = 15, scale = 2)
    private BigDecimal price;           // tiền: BigDecimal + NUMERIC

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    @Version                             // khóa lạc quan (optimistic locking)
    private Integer version;
}
```

> **Bẫy `@Enumerated(ORDINAL)`** (mặc định): lưu số thứ tự enum. Chèn thêm một giá trị vào giữa enum là **toàn bộ dữ liệu cũ sai nghĩa**. Luôn ghi rõ `EnumType.STRING`.

> **Không dùng `record` cho Entity**: JPA cần constructor rỗng + setter + kế thừa proxy được.

> **Lombok `@Data`/`@EqualsAndHashCode` trên Entity là nguy hiểm**: sinh `equals`/`hashCode` trên mọi field, kể cả quan hệ lazy → gây tải dữ liệu ngoài ý muốn hoặc đệ quy vô hạn. Chỉ dùng `@Getter @Setter`, và tự viết `equals`/`hashCode` dựa trên **id nghiệp vụ** (như ISBN).

## 3. Repository

```java
public interface BookRepository extends JpaRepository<Book, Long> {

    // 1. Query method — Spring sinh SQL từ TÊN method
    Optional<Book> findByIsbn(String isbn);
    List<Book> findByTitleContainingIgnoreCase(String keyword);
    List<Book> findByCategoryAndStatus(String category, BookStatus status);
    List<Book> findByPriceBetweenOrderByPriceAsc(BigDecimal min, BigDecimal max);
    boolean existsByIsbn(String isbn);
    long countByStatus(BookStatus status);
    Page<Book> findByCategory(String category, Pageable pageable);

    // 2. JPQL — viết theo tên ENTITY và FIELD (không phải tên bảng/cột)
    @Query("SELECT b FROM Book b WHERE b.availableCopies > 0 AND b.category = :cat")
    List<Book> findAvailableByCategory(@Param("cat") String category);

    // 3. Native SQL — khi cần tính năng riêng của DB
    @Query(value = "SELECT * FROM books WHERE to_tsvector(title) @@ plainto_tsquery(:kw)",
           nativeQuery = true)
    List<Book> fullTextSearch(@Param("kw") String keyword);

    // 4. Projection — chỉ lấy vài cột, nhẹ hơn nhiều so với lấy cả entity
    @Query("SELECT new com.learn.dto.BookSummary(b.id, b.title, b.author) FROM Book b")
    List<BookSummary> findAllSummaries();

    // 5. Cập nhật hàng loạt
    @Modifying
    @Transactional
    @Query("UPDATE Book b SET b.status = :status WHERE b.availableCopies = 0")
    int markOutOfStock(@Param("status") BookStatus status);
}
```

Từ khóa query method hay dùng: `findBy`, `And`, `Or`, `Between`, `LessThan`, `GreaterThan`, `Like`, `Containing`, `StartingWith`, `In`, `IsNull`, `OrderBy`, `Top10`, `Distinct`.

> Tên method dài quá 4–5 điều kiện thì **chuyển sang `@Query`** — dễ đọc hơn nhiều.

## 4. Quan hệ

```java
// ---- Một-Nhiều / Nhiều-Một ----
@Entity
public class Member {
    @Id @GeneratedValue private Long id;

    @OneToMany(mappedBy = "member", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Loan> loans = new ArrayList<>();

    // Method tiện ích giữ 2 chiều đồng bộ — luôn viết cặp này
    public void addLoan(Loan loan) { loans.add(loan); loan.setMember(this); }
    public void removeLoan(Loan loan) { loans.remove(loan); loan.setMember(null); }
}

@Entity
public class Loan {
    @Id @GeneratedValue private Long id;

    @ManyToOne(fetch = FetchType.LAZY)          // ⚠ LUÔN đặt LAZY
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;
}
```

**Quy tắc vàng về fetch type:**
```java
@ManyToOne  // mặc định EAGER  -> LUÔN đổi thành LAZY
@OneToOne   // mặc định EAGER  -> LUÔN đổi thành LAZY
@OneToMany  // mặc định LAZY   -> giữ nguyên
@ManyToMany // mặc định LAZY   -> giữ nguyên
```
`EAGER` khiến mỗi lần load một entity là kéo theo cả cây quan hệ — nguồn gốc của những query khổng lồ không ai ngờ tới.

```java
// ---- Nhiều-Nhiều: ưu tiên tách thành entity trung gian ----
// Thay vì @ManyToMany, hãy tạo entity OrderItem có thêm qty, price...
@Entity
public class OrderItem {
    @EmbeddedId private OrderItemId id;
    @ManyToOne(fetch = LAZY) @MapsId("orderId")   private Order order;
    @ManyToOne(fetch = LAZY) @MapsId("productId") private Product product;
    private int qty;
    private BigDecimal price;
}
```

## 5. Vấn đề N+1 — phần quan trọng nhất module này

```java
List<Loan> loans = loanRepository.findAll();        // 1 query lấy 100 lượt mượn
for (Loan loan : loans) {
    System.out.println(loan.getMember().getName()); // mỗi vòng lặp = 1 query nữa!
}
// Tổng: 1 + 100 = 101 query. API chậm 2 giây thay vì 20ms.
```

Bốn cách xử lý:

```java
// 1. JOIN FETCH — cách phổ biến nhất
@Query("SELECT l FROM Loan l JOIN FETCH l.member JOIN FETCH l.book")
List<Loan> findAllWithMemberAndBook();

// 2. @EntityGraph — khai báo, không cần viết JPQL
@EntityGraph(attributePaths = {"member", "book"})
List<Loan> findAll();

// 3. Batch fetch — Hibernate gom N query thành N/batch_size query
// application.yml: spring.jpa.properties.hibernate.default_batch_fetch_size: 100

// 4. DTO projection — tốt nhất khi chỉ cần đọc để hiển thị
@Query("""
       SELECT new com.learn.dto.LoanView(l.id, m.name, b.title, l.dueDate)
       FROM Loan l JOIN l.member m JOIN l.book b
       """)
List<LoanView> findAllViews();
```

> **Cách phát hiện**: bật `show-sql`, gọi API, đếm số dòng SQL trong log. Thấy cùng một câu SELECT lặp lại nhiều lần → chính là N+1. Thư viện **p6spy** hoặc Hibernate statistics giúp đếm tự động.

> ⚠ `JOIN FETCH` + `Pageable` khiến Hibernate phân trang **trong bộ nhớ** (cảnh báo `HHH90003004`) — rất nguy hiểm với dữ liệu lớn. Giải pháp: query 2 bước (lấy id có phân trang, rồi fetch theo danh sách id).

## 6. Transaction

```java
@Service
@RequiredArgsConstructor
public class LoanService {

    @Transactional                       // đọc-ghi
    public LoanResponse borrow(String memberCode, String isbn) {
        Book book = bookRepo.findByIsbn(isbn).orElseThrow(...);
        if (book.getAvailableCopies() <= 0) throw new BusinessRuleException("Hết sách");
        book.setAvailableCopies(book.getAvailableCopies() - 1);   // không cần gọi save()!
        Loan loan = loanRepo.save(new Loan(book, member));
        return LoanResponse.from(loan);
    }

    @Transactional(readOnly = true)      // gợi ý tối ưu cho DB, tránh dirty checking
    public Page<BookResponse> search(String kw, Pageable pageable) { ... }
}
```

**Dirty checking**: entity đang được quản lý (managed) trong transaction, mọi thay đổi field sẽ **tự động** được ghi xuống DB khi commit — không cần gọi `save()`.

Những điều bắt buộc nhớ:
- `@Transactional` chỉ rollback với **unchecked exception** (mặc định). Muốn rollback với checked exception: `@Transactional(rollbackFor = Exception.class)`.
- Gọi method có `@Transactional` **từ chính class đó** → không có tác dụng (bẫy proxy, Module 10).
- Đặt `@Transactional` ở tầng **service**, không đặt ở controller/repository.
- Transaction dài (gọi API bên ngoài bên trong transaction) làm giữ kết nối DB → cạn pool. Hãy giữ transaction thật ngắn.

### Khóa
```java
// Lạc quan: dùng @Version, ai commit sau thì bị OptimisticLockException
@Version private Integer version;

// Bi quan: khóa dòng ở DB (SELECT ... FOR UPDATE)
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT b FROM Book b WHERE b.id = :id")
Optional<Book> findByIdForUpdate(@Param("id") Long id);
```
Trừ tồn kho khi nhiều người mua cùng lúc → dùng một trong hai cách trên. Khóa bằng `synchronized` của Java **vô dụng** khi chạy nhiều instance.

## 7. Flyway — quản lý phiên bản database

`spring.jpa.hibernate.ddl-auto=update` chỉ dùng khi học. **Production tuyệt đối không dùng** — nó có thể mất dữ liệu và không kiểm soát được.

```
src/main/resources/db/migration/
├── V1__create_books_table.sql
├── V2__create_members_and_loans.sql
├── V3__add_index_on_isbn.sql
└── V4__add_column_price.sql
```
```yaml
spring:
  flyway:
    enabled: true
    baseline-on-migrate: true
  jpa:
    hibernate:
      ddl-auto: validate       # chỉ kiểm tra entity có khớp schema không
```
Quy tắc: file migration **đã chạy thì không bao giờ sửa** — muốn đổi thì thêm file mới.

## 8. Test tầng dữ liệu với Testcontainers

Test với H2 in-memory dễ nhưng **không đáng tin**: H2 không giống PostgreSQL (kiểu dữ liệu, hàm, hành vi index). Testcontainers chạy PostgreSQL thật trong Docker:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
```

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class BookRepositoryTest {

    @Container
    @ServiceConnection                      // Spring Boot 3.1+ tự cấu hình datasource
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired BookRepository repository;

    @Test
    void findByIsbn_tonTai_traVeSach() {
        repository.save(new Book("978-1", "Clean Code", "Martin", 3));

        assertThat(repository.findByIsbn("978-1"))
                .isPresent()
                .get().extracting(Book::getTitle).isEqualTo("Clean Code");
    }

    @Test
    void isbnTrung_viPhamUniqueConstraint() {
        repository.saveAndFlush(new Book("978-1", "A", "X", 1));

        assertThatThrownBy(() -> repository.saveAndFlush(new Book("978-1", "B", "Y", 1)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
```

## 9. Danh sách kiểm tra hiệu năng JPA

- [ ] Mọi `@ManyToOne`/`@OneToOne` đều `LAZY`
- [ ] Đã kiểm tra N+1 bằng cách đếm SQL trong log
- [ ] Danh sách dùng **DTO projection**, không trả entity đầy đủ
- [ ] `@Transactional(readOnly = true)` cho mọi method chỉ đọc
- [ ] Có index cho mọi khóa ngoại và cột trong `WHERE`
- [ ] Không `findAll()` trên bảng lớn — luôn phân trang
- [ ] Insert hàng loạt dùng batch (`hibernate.jdbc.batch_size: 50`)
- [ ] Không gọi API bên ngoài bên trong transaction
- [ ] Không dùng `EntityManager.merge()` khi không cần
- [ ] Enum lưu bằng `STRING`

---

## Tổng kết
- Spring Data sinh repository từ tên method; phức tạp thì dùng `@Query`.
- `LAZY` mọi quan hệ `@ManyToOne`; N+1 là kẻ thù số một.
- Dirty checking: sửa entity trong transaction là tự lưu.
- `@Transactional` ở service, ngắn gọn, hiểu bẫy proxy.
- Flyway cho schema; `ddl-auto=validate` ở production.
- Test bằng Testcontainers với DB thật.


## 💻 Code ví dụ chạy được

Module này có code chạy thật trong [../spring-playground/](../spring-playground/) — package `m12jpa`:

```bash
cd spring-playground && mvn spring-boot:run     # rồi mở http://localhost:8080/
```
Nội dung: ĐẾM SỐ CÂU SQL cho N+1, dirty checking, rollback, tồn kho an toàn.
Endpoint: `/m12/n-plus-1/bad, /m12/n-plus-1/good, /m12/dirty-checking, /m12/rollback, /m12/atomic-stock`.

> Vừa gọi API vừa **đọc console** — một nửa bài học nằm ở log SQL và log aspect.

## Bài tập
👉 [bai-tap.md](bai-tap.md), sau đó sang [Module 13 — Security & JWT](../13-security-jwt/).
