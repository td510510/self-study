# Bài tập Module 12 — Spring Data JPA

> Chuẩn bị: PostgreSQL chạy bằng Docker (Module 08) + project Spring Boot có `spring-boot-starter-data-jpa`, `postgresql`, `flyway-core`.

## Nhóm A — Entity & ánh xạ

**A1.** Tạo entity `Book`, `Member`, `Loan` cho hệ thống thư viện, ánh xạ đúng kiểu dữ liệu (tiền → `BigDecimal`, thời điểm → `Instant`, enum → `STRING`).

**A2.** Bật `show-sql` và `hibernate.format_sql`, chạy `save()` một entity, đọc câu SQL Hibernate sinh ra.

**A3.** Chứng minh tác hại của `@Enumerated(ORDINAL)`: lưu vài bản ghi, chèn thêm một hằng số vào **giữa** enum, đọc lại dữ liệu và xem nó sai thế nào.

**A4.** Thêm `@CreationTimestamp`, `@UpdateTimestamp`, `@Version` và quan sát giá trị thay đổi.

**A5.** Giải thích vì sao không nên dùng Lombok `@Data` trên entity. Tự viết `equals`/`hashCode` dựa trên ISBN.

## Nhóm B — Repository

**B1.** Viết các query method (không dùng `@Query`):
- tìm theo ISBN
- tìm theo tên gần đúng, không phân biệt hoa thường
- tìm theo thể loại + còn bản sẵn có
- đếm sách theo trạng thái
- kiểm tra ISBN đã tồn tại
- 10 sách mới nhất

**B2.** Viết `@Query` JPQL cho: sách chưa từng được mượn; thành viên đang giữ ≥ 2 cuốn; top 5 sách mượn nhiều nhất.

**B3.** Viết native query dùng tính năng riêng của PostgreSQL (`ILIKE`, `to_tsvector`).

**B4.** Viết DTO projection `BookSummary(id, title, author)` và so sánh SQL sinh ra với khi lấy cả entity.

**B5.** `@Modifying` cập nhật hàng loạt: đánh dấu `OUT_OF_STOCK` cho sách hết bản. Giải thích vì sao cần `clearAutomatically = true`.

**B6.** Phân trang + sắp xếp bằng `Pageable`, trả `Page<BookResponse>`.

## Nhóm C — Quan hệ

**C1.** Ánh xạ `Member 1-n Loan` và `Book 1-n Loan` hai chiều, có method tiện ích giữ đồng bộ.

**C2.** Đổi `@ManyToOne` từ EAGER sang LAZY, so sánh số query sinh ra khi gọi `findAll()`.

**C3.** Thử `cascade = ALL` + `orphanRemoval = true`: xóa `Member` thì `Loan` có bị xóa theo không? Điều đó có đúng nghiệp vụ không?

**C4.** Mô hình n-n: `Order` ↔ `Product` qua `OrderItem` có thêm `qty`, `price`. Giải thích vì sao không dùng `@ManyToMany` thuần.

**C5.** Gây `LazyInitializationException` (truy cập quan hệ lazy ngoài transaction), rồi sửa bằng 3 cách khác nhau.

## Nhóm D — N+1 (quan trọng nhất)

**D1.** Tạo 100 `Loan`, gọi `findAll()` rồi lặp in `loan.getMember().getName()`. **Đếm số câu SQL** trong log.

**D2.** Sửa bằng `JOIN FETCH`, đếm lại số query.

**D3.** Sửa bằng `@EntityGraph`, so sánh SQL với cách trên.

**D4.** Sửa bằng `hibernate.default_batch_fetch_size`, so sánh.

**D5.** Sửa bằng DTO projection, so sánh cả số query lẫn lượng dữ liệu truyền.

**D6.** Kết hợp `JOIN FETCH` với `Pageable`, quan sát cảnh báo `HHH90003004`, giải thích rủi ro và cài giải pháp 2 bước (lấy id → fetch theo id).

**D7.** Viết bảng so sánh 5 cách trên: số query, độ phức tạp, khi nào nên dùng.

## Nhóm E — Transaction

**E1.** Cài `borrow()` trong một transaction: kiểm tra tồn kho, giảm số bản, tạo lượt mượn. Ném exception giữa chừng và chứng minh rollback.

**E2.** Chứng minh **dirty checking**: sửa field entity trong transaction mà **không** gọi `save()`, dữ liệu vẫn xuống DB.

**E3.** Chứng minh bẫy self-invocation: `@Transactional` trên method được gọi nội bộ **không** có tác dụng.

**E4.** Ném checked exception trong method `@Transactional` → không rollback. Sửa bằng `rollbackFor`.

**E5.** Optimistic locking: 2 luồng cùng sửa một `Book`, chứng minh `OptimisticLockException`, xử lý bằng retry.

**E6.** Pessimistic locking: 2 luồng cùng mua cuốn sách cuối cùng, chứng minh chỉ 1 luồng thành công.

**E7.** So sánh `@Transactional` và `@Transactional(readOnly = true)` về SQL/hiệu năng.

## Nhóm F — Flyway

**F1.** Chuyển từ `ddl-auto=update` sang Flyway: viết `V1__init.sql` tạo toàn bộ bảng, đặt `ddl-auto=validate`.

**F2.** Thêm `V2__add_price_column.sql`, chạy lại ứng dụng, kiểm tra bảng `flyway_schema_history`.

**F3.** Cố tình sửa file migration đã chạy → quan sát lỗi checksum và giải thích vì sao Flyway chặn.

**F4.** Viết migration thêm dữ liệu mẫu chỉ cho profile `dev`.

**F5.** Viết migration có `rollback plan` (script hoàn tác thủ công) và giải thích vì sao Flyway Community không tự rollback được.

## Nhóm G — Test

**G1.** Cài Testcontainers, viết `@DataJpaTest` cho `BookRepository` với PostgreSQL thật.

**G2.** Test ràng buộc unique (ISBN trùng → `DataIntegrityViolationException`).

**G3.** Test quan hệ: lưu `Member` có 2 `Loan` bằng cascade, đọc lại kiểm tra.

**G4.** Test phân trang: tạo 25 bản ghi, lấy trang 2 cỡ 10, kiểm tra `totalElements`, `totalPages`.

**G5.** Viết test đếm số query (dùng Hibernate `Statistics`) để **chặn hồi quy N+1**.

## Nhóm H — Tổng hợp (bắt buộc)

**H1. Đưa Library API lên database thật.**
- Entity + Flyway migration + index đầy đủ.
- Repository có query method, `@Query`, projection.
- Mượn/trả sách trong transaction, có xử lý tranh chấp tồn kho.
- Không còn N+1 ở bất kỳ endpoint nào (chứng minh bằng log SQL).
- Test repository bằng Testcontainers, test service bằng mock.
- Endpoint thống kê dùng query gom nhóm ở DB, **không** load hết về Java rồi mới tính.

*Đạt khi*: gọi `GET /api/v1/loans?page=0&size=50` chỉ sinh **≤ 3 câu SQL**.

---

## Câu hỏi phỏng vấn
1. JPA, Hibernate, Spring Data JPA khác nhau thế nào?
2. N+1 là gì? Phát hiện và xử lý ra sao?
3. `LAZY` khác `EAGER`? Mặc định của từng loại quan hệ?
4. `LazyInitializationException` xảy ra khi nào?
5. Dirty checking là gì?
6. Vòng đời entity: transient / persistent / detached / removed?
7. `save()` khác `saveAndFlush()`? `getReferenceById()` khác `findById()`?
8. Optimistic vs pessimistic locking?
9. Vì sao production không dùng `ddl-auto=update`?
10. Vì sao nên test bằng Testcontainers thay vì H2?
