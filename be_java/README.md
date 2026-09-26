# Chương trình tự học Java Backend Developer (từ 0 → đi làm)

Chương trình **28 tuần** (~15 giờ/tuần, tổng khoảng 400–450 giờ) dành cho người mới hoàn toàn, gồm:
- **Lý thuyết**: mỗi module một bài giảng đầy đủ, giải thích *tại sao* chứ không chỉ *làm thế nào*.
- **Code**: ví dụ chạy được, đọc từ trên xuống là hiểu.
- **Bài tập**: có tiêu chí "đạt" rõ ràng, cộng thêm file `luyen-tay.md` (bài nhỏ luyện phản xạ) ở Module 01–05.
- **3 dự án lớn**: Console app → REST API monolith → Hệ microservices có Docker/CI (có một service mẫu hoàn chỉnh).
- **Giai đoạn 6** sau khi đi làm: lộ trình lên Mid/Senior.

> Thời lượng là con số cho người học đều đặn. Người chưa từng lập trình thường cần thêm 20–40% ở Giai đoạn 1 —
> đừng vội: nền Java/OOP/Collections chắc thì Spring học rất nhanh, còn nền yếu thì học Spring rất khổ.

## Bản đồ lộ trình

| Giai đoạn | Tuần | Module | Kết quả đạt được |
|---|---|---|---|
| **1. Nền tảng Java** | 1 | [00-setup](00-setup/) + [dòng lệnh](00-setup/dong-lenh.md) | Cài JDK, IDE, chạy chương trình đầu tiên, dùng terminal |
| | 2–3 | [01-java-core](01-java-core/) | Biến, kiểu dữ liệu, điều khiển luồng, mảng, method |
| | 4–5 | [02-oop](02-oop/) | Class, kế thừa, đa hình, interface, record, SOLID |
| | 6 | [03-collections-generics](03-collections-generics/) | List/Map/Set, equals/hashCode, Generics |
| | 6 → hết khóa | [03b-dsa](03b-dsa/) *(song song, 2–3 giờ/tuần)* | Big-O, đệ quy, sắp xếp, tìm kiếm, cây, đồ thị, quy hoạch động — qua vòng code test |
| | 7 | [04-exception-io](04-exception-io/) | Exception đúng cách, File I/O, JSON, ngày giờ |
| | 8 | [05-functional-stream](05-functional-stream/) | Lambda, Stream API, Optional |
| | 9 | [05b-design-patterns](05b-design-patterns/) | 12 pattern thực dụng, proxy — chìa khóa hiểu Spring |
| | 10 | [06-concurrency](06-concurrency/) | Thread, ExecutorService, CompletableFuture, Virtual Threads |
| | 11 | [07-jvm-performance](07-jvm-performance/) | Bộ nhớ JVM, GC, đọc stacktrace, tránh memory leak |
| **2. Công cụ & dữ liệu** | 12–13 | [08-sql-jdbc](08-sql-jdbc/) | SQL, thiết kế bảng, index, transaction, JDBC |
| | 14 | [09-maven-git-testing](09-maven-git-testing/) | Maven, Git làm việc nhóm (PR, review), JUnit 5, Mockito, TDD |
| | 15 | **Dự án 1** [p1-library-console](projects/p1-library-console/) | App quản lý thư viện thuần Java + test |
| **3. Spring** | 16 | [10-spring-core](10-spring-core/) | IoC/DI, Bean, AOP, cấu hình |
| | 17–19 | [11-spring-boot-rest](11-spring-boot-rest/) | HTTP/web, REST API chuẩn, validation, xử lý lỗi, OpenAPI, logging, gọi API ngoài |
| | 20–21 | [12-spring-data-jpa](12-spring-data-jpa/) | Entity, quan hệ, N+1, phân trang, Flyway |
| | 22 | [13-security-jwt](13-security-jwt/) | Spring Security, JWT, phân quyền |
| | 23 | **Dự án 2** [p2-blog-api](projects/p2-blog-api/) | REST API blog hoàn chỉnh, có test & docs |
| **4. Production** | 24 | [14-cache-redis-messaging](14-cache-redis-messaging/) | Redis, Kafka/RabbitMQ, idempotency |
| | 25–26 | [15-docker-microservices-cicd](15-docker-microservices-cicd/) | Docker, microservices, observability, CI/CD |
| | 27–28 | **Dự án 3** [p3-shop-microservices](projects/p3-shop-microservices/) | Hệ e-commerce nhiều service (có [service mẫu](projects/p3-shop-microservices/product-service/)) |
| **5. Đi làm** | song song | [interview](interview/) | Ôn phỏng vấn, CV, câu hỏi thường gặp |
| **6. Lên Mid/Senior** | sau khi đi làm, 6–12 tháng | [16-nang-cao](16-nang-cao/) | System design, DB nâng cao, Kubernetes, OAuth2, observability, Kafka, kiến trúc |

## Code ví dụ chạy được

| Phần | Chạy thế nào |
|---|---|
| Module 00–08, 03b, 05b | `java 01-java-core/src/Basics.java` — chạy trực tiếp, không cần cài gì thêm |
| Module 09 | [09-maven-git-testing/demo-project](09-maven-git-testing/demo-project/) — `mvn test` |
| **Module 10–14** | [spring-playground](spring-playground/) — `mvn spring-boot:run` rồi mở http://localhost:8080/ |
| Module 15 | thực hành trực tiếp với Docker/CI trên 2 dự án |
| Dự án 1, 2, product-service (Dự án 3) | `mvn test` / `mvn verify` — đã kiểm chứng chạy xanh (Dự án 2 và product-service cần Docker cho integration test) |

`spring-playground` là một app Spring Boot chia package theo module, mỗi endpoint chứng minh **một**
bài học bằng số liệu: đếm SQL để thấy N+1, 100 thread cùng mua hàng, 401 vs 403, cache hit/miss,
các bẫy proxy khiến `@Transactional`/`@Cacheable` im lặng vô hiệu, request id trong log, và gọi API ngoài có timeout/retry.

## Cách học hiệu quả (đọc trước khi bắt đầu)

1. **Gõ lại code, đừng copy.** Bộ nhớ cơ bắp khi gõ + sửa lỗi compile là 50% giá trị bài học.
2. **Quy tắc 70/30**: 30% thời gian đọc lý thuyết, 70% viết code. Không viết code = không học được.
3. **Mỗi module kết thúc bằng bài tập.** Chưa làm xong bài tập thì chưa qua module.
4. **Commit mỗi ngày.** Repo này chính là portfolio của bạn khi đi xin việc.
5. **Bị bí quá 30 phút** mới đi tìm lời giải — nhưng phải đọc hiểu rồi tự viết lại.
6. **Không nhảy cóc lên Spring.** 80% người học fail vì học Spring khi chưa vững OOP + Collections + SQL.

## Chuẩn đầu ra (checklist đi phỏng vấn Fresher/Junior)

- [ ] Giải thích được OOP, interface vs abstract class, equals/hashCode
- [ ] Dùng thành thạo Collections + Stream API
- [ ] Phân tích được Big-O; giải chắc bài Easy và phần lớn bài Medium phổ biến (HashMap, hai con trỏ, cửa sổ trượt, BFS/DFS)
- [ ] Nhận ra và dùng đúng các pattern thông dụng; giải thích được Spring dùng proxy thế nào
- [ ] Giải thích được chuyện gì xảy ra khi gõ URL vào trình duyệt; phân biệt lỗi DNS/TCP/HTTP
- [ ] Viết SQL join/group by, hiểu index và transaction/isolation level
- [ ] Xây REST API với Spring Boot: CRUD, validate, phân trang, xử lý lỗi thống nhất
- [ ] Dùng JPA, biết vấn đề N+1 và cách xử lý
- [ ] Bảo mật API bằng JWT + role
- [ ] Log đúng mức, có request id; gọi API ngoài có timeout và xử lý lỗi
- [ ] Viết unit test + integration test (Testcontainers)
- [ ] Đóng gói Docker, chạy docker-compose, hiểu CI/CD
- [ ] Làm việc được trong terminal Linux; dùng Git theo quy trình Pull Request + code review
- [ ] Có 3 dự án trên GitHub kèm README tử tế

## Quy ước trong repo

```
<module>/
├── README.md      # bài giảng lý thuyết
├── bai-tap.md     # bài tập + tiêu chí đạt (bắt buộc)
├── luyen-tay.md   # bài nhỏ luyện phản xạ + đọc code đoán kết quả (Module 01–05)
└── src/           # code ví dụ chạy được
```

Chạy code thuần Java (JDK 21+ hỗ trợ chạy trực tiếp file .java):
```bash
java 01-java-core/src/HelloWorld.java
```
