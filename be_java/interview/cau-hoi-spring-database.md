# Câu hỏi phỏng vấn — Spring, Database & Hệ thống

> ~60 câu, kèm **gợi ý trả lời**. Đừng học thuộc: hãy trả lời bằng ví dụ từ dự án của bạn.
> Ký hiệu: ⭐ = câu gần như buổi nào cũng hỏi.

---

## A. Spring Core & Spring Boot

**A1. ⭐ IoC và DI là gì? Quan hệ giữa chúng?**
IoC = đảo ngược quyền điều khiển: framework tạo và quản lý object thay vì code của bạn gọi `new`. DI là **cách hiện thực** IoC — framework tiêm phụ thuộc vào. Lợi ích thực tế: đổi cài đặt không phải sửa code phụ thuộc, và **test được bằng mock**. Ví dụ: `LibraryService` nhận `BookRepository` qua constructor nên test thay được bằng bản in-memory.

**A2. ⭐ Vì sao constructor injection tốt hơn field injection?**
1. Field `final` → bất biến, an toàn đa luồng. 2. Thiếu phụ thuộc thì **lỗi ngay lúc khởi động**, không phải NPE lúc chạy. 3. Test được bằng `new Service(mock)` mà không cần Spring. 4. Constructor 7 tham số là tín hiệu class làm quá nhiều việc — field injection giấu mất tín hiệu đó.

**A3. `@Component`, `@Service`, `@Repository`, `@Controller` khác nhau?**
Về kỹ thuật đều là `@Component`. Khác ở ngữ nghĩa (đọc code biết tầng nào) và một số xử lý riêng: `@Repository` dịch exception của nhà cung cấp DB sang `DataAccessException` của Spring; `@Controller`/`@RestController` được `DispatcherServlet` xử lý.

**A4. ⭐ Bean scope mặc định là gì? Rủi ro?**
`singleton` — **một** instance dùng chung cho mọi request, tức là nhiều thread chạy trên cùng object. Vì vậy bean **không được có state thay đổi được**. Bug kinh điển: để `List` hoặc biến đếm làm field của `@Service` → sai dữ liệu chỉ khi tải cao.

**A5. Có nhiều bean cùng kiểu thì xử lý thế nào?**
`@Qualifier("tên")`, `@Primary`, hoặc tiêm cả `List<T>`/`Map<String,T>` (rất hợp cho mẫu strategy — thêm cài đặt mới không phải sửa code cũ).

**A6. Circular dependency là gì?**
A cần B, B cần A. Với constructor injection thì Spring **báo lỗi lúc khởi động** (tốt). Cách sửa đúng là thiết kế lại: tách phần dùng chung ra class thứ ba, hoặc dùng sự kiện. `@Lazy` chỉ là băng dán.

**A7. ⭐ AOP là gì? Spring cài bằng cách nào?**
Tách các mối quan tâm cắt ngang (log, transaction, cache, security) ra khỏi logic nghiệp vụ. Spring dùng **proxy** (JDK dynamic proxy hoặc CGLIB).

**A8. ⭐ Vì sao `@Transactional` không hoạt động khi gọi method trong cùng class?**
Vì lời gọi nội bộ **không đi qua proxy** — nó gọi thẳng `this.method()`. Giống hệt với `@Cacheable`, `@Async`. Cách sửa: tách sang bean khác, hoặc dùng `TransactionTemplate`. (Kể luôn rằng bạn đã gặp lỗi này trong dự án nào.)

**A9. Spring Boot khác Spring thường ở đâu?**
Auto-configuration (thấy thư viện trong classpath thì tự cấu hình), starter dependencies, server nhúng, Actuator, cấu hình mặc định hợp lý.

**A10. `@Value` khác `@ConfigurationProperties`?**
`@Value` cho một giá trị lẻ; `@ConfigurationProperties` gom cả nhóm, type-safe, validate được, dễ test hơn. Ưu tiên cái sau.

**A11. Profile dùng để làm gì?**
Cấu hình khác nhau theo môi trường (`application-dev.yml`, `application-prod.yml`), bean khác nhau theo `@Profile`. Secret **không** nằm trong file cấu hình mà lấy từ biến môi trường.

---

## B. REST API

**B1. ⭐ REST là gì? Stateless nghĩa là gì và vì sao quan trọng?**
Kiểu kiến trúc: tài nguyên là danh từ, thao tác ở HTTP method, biểu diễn bằng JSON. Stateless = server không giữ trạng thái giữa các request → mọi instance xử lý được mọi request → **scale ngang** dễ, đó cũng là lý do dùng JWT thay session.

**B2. ⭐ PUT khác PATCH? Idempotent là gì?**
PUT thay thế toàn bộ tài nguyên, PATCH sửa một phần. Idempotent = gọi 1 lần hay N lần cho cùng kết quả: GET/PUT/DELETE idempotent, POST/PATCH thì không. Quan trọng vì client hay retry khi mạng lỗi.

**B3. ⭐ 401 khác 403?**
401 = **chưa xác thực** (chưa đăng nhập/token sai/hết hạn). 403 = **đã xác thực nhưng không đủ quyền**.

**B4. ⭐ Vì sao phải tách DTO khỏi Entity?**
Bảo mật (không lộ `password`, không cho client tự set `role` — mass assignment), tách rời (đổi cột DB không vỡ hợp đồng API), rõ ràng (request tạo và cập nhật khác nhau), tránh vòng lặp vô hạn khi serialize quan hệ hai chiều.

**B5. `@Valid` hoạt động thế nào? Quên thì sao?**
Kích hoạt Bean Validation trên tham số. Quên `@Valid` thì các annotation trong DTO **không có tác dụng gì cả** — dữ liệu rác đi thẳng vào service.

**B6. `@RestControllerAdvice` để làm gì?**
Bắt exception toàn cục, biến mọi lỗi thành response JSON thống nhất. Nguyên tắc: client nhận thông báo hữu ích nhưng không lộ stacktrace/SQL/tên bảng; chi tiết ghi vào log kèm traceId.

**B7. Phân trang hiệu quả với bảng 10 triệu dòng?**
`Pageable` dùng `LIMIT/OFFSET` — offset lớn thì chậm vì DB vẫn phải quét qua. Với dữ liệu rất lớn dùng **keyset pagination** (`WHERE id < :lastId ORDER BY id DESC LIMIT 20`). Luôn giới hạn `size` tối đa.

**B8. Versioning API có mấy cách?**
URL (`/api/v1/`) — phổ biến nhất, dễ nhìn; header (`Accept: application/vnd.app.v2+json`) — sạch URL nhưng khó test; query param — không khuyến khích.

**B9. CORS là gì?**
Cơ chế của **trình duyệt** chặn request từ origin khác. Server phải trả header `Access-Control-Allow-Origin`. Ở production không dùng `*`, chỉ khai báo domain cụ thể.

---

## C. JPA & Hibernate

**C1. ⭐ JPA, Hibernate, Spring Data JPA khác nhau?**
JPA = đặc tả; Hibernate = bản cài đặt (thứ sinh SQL thật); Spring Data JPA = lớp bọc sinh repository tự động từ tên method.

**C2. ⭐⭐ N+1 là gì? Phát hiện và xử lý ra sao?**
Lấy N bản ghi rồi mỗi bản ghi lại thêm 1 query để nạp quan hệ → 1+N query. Phát hiện: bật `show-sql` và **đếm số câu SQL** (hoặc Hibernate Statistics/p6spy). Xử lý: `JOIN FETCH`, `@EntityGraph`, `default_batch_fetch_size`, hoặc DTO projection. Lưu ý `JOIN FETCH` + `Pageable` trên collection sẽ phân trang trong bộ nhớ (cảnh báo `HHH90003004`) → dùng `@EntityGraph` hoặc query 2 bước.

**C3. ⭐ LAZY và EAGER? Mặc định của từng loại?**
`@ManyToOne`, `@OneToOne` mặc định EAGER — **luôn phải đổi sang LAZY**. `@OneToMany`, `@ManyToMany` mặc định LAZY. EAGER kéo theo cả cây quan hệ mỗi lần load.

**C4. `LazyInitializationException` xảy ra khi nào?**
Truy cập quan hệ lazy sau khi session đã đóng (thường là ở tầng controller/view). Sửa: nạp sẵn bằng fetch join/`@EntityGraph`, hoặc chuyển sang DTO trong service. Không nên bật `open-in-view` để "chữa" — nó chỉ giấu vấn đề và giữ connection lâu.

**C5. ⭐ Dirty checking là gì?**
Trong transaction, Hibernate theo dõi entity đang quản lý; khi commit nó tự so sánh và sinh `UPDATE`. Vì vậy sửa field xong **không cần gọi `save()`**.

**C6. Vòng đời entity?**
Transient (mới `new`, chưa quản lý) → Persistent (được quản lý, có dirty checking) → Detached (session đóng) → Removed.

**C7. `save()` khác `saveAndFlush()`? `findById` khác `getReferenceById`?**
`saveAndFlush` đẩy SQL xuống DB ngay thay vì chờ commit. `getReferenceById` trả **proxy**, chưa query — hợp khi chỉ cần gán khóa ngoại; chạm vào field mới query, và ném exception nếu không tồn tại.

**C8. ⭐ `@Transactional` rollback khi nào?**
Mặc định chỉ rollback với **unchecked exception** (`RuntimeException`, `Error`). Checked exception thì không, trừ khi khai báo `rollbackFor`.

**C9. ⭐ Optimistic vs pessimistic locking?**
Optimistic: cột `@Version`, không khóa, va chạm thì ném `OptimisticLockException` — hợp khi tranh chấp hiếm. Pessimistic (`SELECT ... FOR UPDATE`): khóa dòng ngay — hợp khi tranh chấp thường xuyên (trừ tồn kho), nhưng giảm thông lượng và có nguy cơ deadlock.

**C10. ⭐ Vì sao không dùng `ddl-auto=update` ở production?**
Nó có thể âm thầm đổi schema, không bao giờ xóa cột thừa, không có lịch sử và không rollback được. Dùng **Flyway/Liquibase** + `ddl-auto=validate`.

**C11. Khi nào không nên dùng JPA?**
Báo cáo phức tạp, truy vấn gom nhóm nhiều tầng, thao tác hàng loạt (bulk), hoặc cần tính năng riêng của DB → viết SQL thuần / native query / jOOQ.

---

## D. SQL & Database

**D1. ⭐ INNER JOIN khác LEFT JOIN?**
INNER chỉ lấy bản ghi khớp cả hai bên; LEFT giữ toàn bộ bên trái, bên phải thiếu thì NULL. Mẹo tìm "bản ghi không có quan hệ": `LEFT JOIN ... WHERE b.id IS NULL`.

**D2. WHERE khác HAVING?**
`WHERE` lọc **trước** khi gom nhóm, `HAVING` lọc **sau** khi gom nhóm (dùng được hàm tổng hợp).

**D3. ⭐ Index hoạt động thế nào? Khi nào bị vô hiệu?**
Cấu trúc B-tree giúp tìm nhanh thay vì quét toàn bảng. Bị vô hiệu khi: bọc hàm quanh cột (`LOWER(email) = ?`), `LIKE '%abc'`, tính toán trên cột, hoặc kiểu dữ liệu không khớp. Kiểm chứng bằng `EXPLAIN ANALYZE`: thấy `Seq Scan` trên bảng lớn là dấu hiệu xấu.

**D4. Index tổ hợp `(a, b)` dùng được cho query nào?**
`WHERE a = ?`, `WHERE a = ? AND b = ?`, `WHERE a = ? ORDER BY b`. **Không** dùng được cho `WHERE b = ?` (quy tắc tiền tố trái).

**D5. Index có nhược điểm gì?**
Làm chậm `INSERT/UPDATE/DELETE` và tốn dung lượng. Đừng đánh index bừa; đánh cho khóa ngoại, cột lọc/sắp xếp thường dùng.

**D6. ⭐ ACID là gì?**
Atomicity (toàn bộ hoặc không), Consistency (luôn thỏa ràng buộc), Isolation (không giẫm chân nhau), Durability (commit rồi thì còn mãi).

**D7. ⭐ Các mức isolation và hiện tượng tương ứng?**
READ UNCOMMITTED (dirty read) → READ COMMITTED (mặc định Postgres; còn non-repeatable read) → REPEATABLE READ (còn phantom) → SERIALIZABLE (an toàn nhất, chậm nhất).

**D8. ⭐ SQL Injection và cách chống?**
Nối chuỗi dữ liệu người dùng vào câu SQL → kẻ tấn công đổi được ý nghĩa câu lệnh. Chống bằng **PreparedStatement**/JPA parameter binding — dữ liệu không bao giờ được coi là mã lệnh. Kèm nguyên tắc quyền tối thiểu cho tài khoản DB.

**D9. Vì sao cần connection pool? Pool lớn có tốt hơn không?**
Mở kết nối tốn ~50–100ms. Pool **quá lớn lại chậm hơn** (tranh chấp tài nguyên ở DB). Điểm khởi đầu hợp lý: `số nhân CPU × 2`.

**D10. Tiền tệ lưu kiểu gì?**
`NUMERIC/DECIMAL` trong DB, `BigDecimal` trong Java. **Không bao giờ** dùng `float/double` — sai số nhị phân.

**D11. `DELETE`, `TRUNCATE`, `DROP` khác nhau?**
DELETE xóa theo điều kiện, ghi log, rollback được. TRUNCATE xóa sạch nhanh, không theo điều kiện. DROP xóa cả bảng.

---

## E. Bảo mật

**E1. ⭐ Authentication khác Authorization?**
Xác thực = *bạn là ai* (401). Phân quyền = *bạn được làm gì* (403).

**E2. ⭐ Spring Security hoạt động thế nào?**
Một chuỗi filter đứng trước `DispatcherServlet`. Filter JWT của bạn đọc header, xác thực, đặt `Authentication` vào `SecurityContextHolder` (bên trong là `ThreadLocal`), sau đó `AuthorizationFilter` kiểm tra quyền.

**E3. ⭐ JWT gồm mấy phần? Payload có được mã hóa không?**
Header.Payload.Signature. Payload chỉ **base64**, ai cũng đọc được — chữ ký chỉ chống *sửa*, không chống *đọc*. Không bao giờ để dữ liệu nhạy cảm trong đó.

**E4. ⭐ Làm sao thu hồi một JWT đã cấp?**
Bản chất là **không thu hồi được**. Giảm thiểu bằng: access token ngắn hạn (15 phút), refresh token lưu DB để thu hồi, và nếu bắt buộc thì dùng blacklist trong Redis với TTL bằng thời hạn còn lại (đánh đổi: mất tính stateless).

**E5. ⭐ Vì sao dùng BCrypt mà không dùng SHA-256?**
SHA thiết kế để **nhanh** → kẻ tấn công dò hàng tỷ lần/giây. BCrypt cố tình chậm, có salt riêng mỗi mật khẩu, và tăng chi phí được theo thời gian.

**E6. ⭐ IDOR là gì?**
Truy cập dữ liệu người khác bằng cách đổi id trong URL. Chống bằng cách kiểm tra **quyền sở hữu từng bản ghi** ở server. Mẹo hay dùng: trả 404 thay vì 403 để không tiết lộ sự tồn tại của bản ghi.

**E7. CSRF là gì? Vì sao API JWT thường tắt?**
CSRF lợi dụng cookie được trình duyệt tự gửi kèm. API stateless đọc token từ header `Authorization` (không tự động gửi) nên không bị — do đó tắt CSRF là hợp lý. Nhưng nếu bạn lưu JWT trong **cookie** thì CSRF quay lại thành vấn đề.

**E8. `hasRole("ADMIN")` khác `hasAuthority("ADMIN")`?**
`hasRole` tự thêm tiền tố → tìm authority `ROLE_ADMIN`. Lưu trong DB là `ADMIN` mà dùng `hasRole("ADMIN")` sẽ luôn 403.

**E9. Kể vài mục OWASP Top 10 và cách xử lý trong Spring Boot.**
Broken Access Control (kiểm tra quyền sở hữu, `@PreAuthorize`), Injection (PreparedStatement/JPA), Cryptographic Failures (BCrypt, HTTPS, không log secret), Security Misconfiguration (không lộ stacktrace, tắt endpoint Actuator nhạy cảm), Vulnerable Components (quét dependency).

---

## F. Hiệu năng, cache & messaging

**F1. ⭐ API chậm — bạn xử lý theo thứ tự nào?**
Đo trước: xác định chậm ở đâu (log thời gian, APM, traceId). Thứ tự nguyên nhân theo xác suất: **query DB** (N+1, thiếu index, `SELECT *`, `findAll` không phân trang) → gọi mạng tuần tự/thiếu timeout → thuật toán O(n²) → GC/bộ nhớ. Cache là bước sau cùng, không phải bước đầu.

**F2. Khi nào nên cache, khi nào không?**
Nên: đọc nhiều, ghi ít, chấp nhận cũ vài giây. Không: dữ liệu phải chính xác tuyệt đối (số dư, tồn kho lúc thanh toán).

**F3. Cache penetration / avalanche / stampede?**
Penetration: hỏi key không tồn tại → cache cả giá trị rỗng. Avalanche: nhiều key hết hạn cùng lúc → TTL ngẫu nhiên. Stampede: một key nóng hết hạn, nghìn request cùng dựng lại → khóa hoặc làm mới sớm.

**F4. Vì sao không cache entity JPA?**
Có proxy lazy → serialize lỗi hoặc kéo cả cây dữ liệu. Cache **DTO**.

**F5. ⭐ Kafka khác RabbitMQ?**
Kafka: nhật ký phân vùng, giữ lại tin nhắn, đọc lại được, thông lượng rất cao — hợp cho luồng sự kiện, nhiều consumer độc lập. RabbitMQ: hàng đợi, tin nhắn xóa sau khi xử lý, định tuyến linh hoạt — hợp cho tác vụ nền.

**F6. ⭐ Vì sao consumer phải idempotent?**
Vì hệ thống tin nhắn đảm bảo **at-least-once** — tin nhắn có thể tới hai lần. Không idempotent thì một lần lặp = trừ tiền khách hai lần. Cài bằng bảng `processed_events` theo `eventId`.

**F7. ⭐ Outbox pattern giải quyết vấn đề gì?**
"Hai nguồn ghi": lưu DB thành công nhưng gửi Kafka lỗi (hoặc ngược lại) → dữ liệu và sự kiện lệch nhau. Outbox ghi sự kiện vào DB **cùng transaction**, một job riêng đọc và publish.

**F8. Job `@Scheduled` khi chạy nhiều instance thì sao?**
Chạy N lần. Dùng **ShedLock** (khóa qua DB/Redis) để chỉ một instance thực thi.

---

## G. Hệ thống & vận hành

**G1. ⭐ Khi nào KHÔNG nên dùng microservices?**
Team nhỏ, sản phẩm chưa rõ ranh giới nghiệp vụ, chưa có hạ tầng CI/CD và giám sát. Microservices giải quyết vấn đề **tổ chức**, đổi độ phức tạp trong tiến trình lấy độ phức tạp qua mạng. Lời khuyên: bắt đầu bằng monolith module hóa tốt. *(Trả lời được câu này cho thấy bạn có phán đoán kỹ thuật, không chạy theo trào lưu.)*

**G2. Vì sao mỗi microservice cần DB riêng?**
Chung DB = ràng buộc chặt qua schema, không deploy độc lập được, một service sửa bảng làm vỡ service khác. Chung DB thì đó chỉ là monolith bị chia nhỏ.

**G3. ⭐ Circuit breaker là gì? Ba trạng thái?**
CLOSED (bình thường) → vượt ngưỡng lỗi → OPEN (từ chối ngay, không gọi service đang hỏng) → sau một khoảng → HALF_OPEN (thử vài request) → ổn thì về CLOSED. Mục đích: ngăn **lỗi lan dây chuyền** làm cạn thread pool.

**G4. Saga pattern?**
Chuỗi giao dịch cục bộ, mỗi bước có hành động bù trừ, thay cho transaction phân tán. Đánh đổi: chấp nhận nhất quán sau cùng.

**G5. Ba trụ cột observability?**
Logs (chuyện gì đã xảy ra), Metrics (hệ thống có khỏe không), Traces (request chậm ở đâu). Correlation/trace id nối cả ba lại.

**G6. Liveness khác readiness probe?**
Liveness hỏng → **restart** container. Readiness hỏng → **ngừng gửi traffic** nhưng không restart. Đặt kiểm tra DB vào liveness là sai lầm phổ biến: DB chập chờn sẽ khiến toàn bộ container restart liên tục.

**G7. Vì sao container cần `MaxRAMPercentage` thay cho `-Xmx`?**
Để JVM tính heap theo giới hạn RAM thật của container. Đặt `-Xmx2g` trong container 1GB → bị OOMKilled.

**G8. Deploy không gián đoạn?**
Rolling/blue-green/canary + graceful shutdown + thay đổi schema **tương thích ngược** (thêm cột trước, đọc/ghi cả hai, rồi mới bỏ cột cũ).

**G9. Multi-stage Docker build giải quyết gì?**
Image cuối chỉ chứa JRE + jar (~200MB) thay vì cả Maven, dependency và mã nguồn (~800MB) → nhẹ hơn, ít lỗ hổng hơn, deploy nhanh hơn.

**G10. Bạn làm gì khi production báo 500 hàng loạt lúc 2 giờ sáng?**
Quy trình: (1) xác nhận phạm vi ảnh hưởng qua dashboard, (2) xem có thay đổi gì vừa deploy không → cân nhắc **rollback trước, điều tra sau**, (3) đọc log theo traceId của request lỗi, (4) kiểm tra phụ thuộc (DB, Redis, service ngoài), (5) khắc phục tạm để hệ thống hoạt động, (6) hôm sau viết post-mortem không đổ lỗi cá nhân.

---

## Cách trả lời khi bạn không biết

Đừng đoán bừa. Nói theo hướng này:
> "Em chưa làm trực tiếp phần này. Theo em hiểu thì nó giải quyết vấn đề X, gần giống với Y mà em đã làm trong dự án của em. Nếu gặp thực tế em sẽ tìm hiểu theo hướng Z."

Người phỏng vấn đánh giá **cách bạn tư duy khi gặp cái chưa biết** cao hơn là số lượng thuật ngữ bạn thuộc lòng.
