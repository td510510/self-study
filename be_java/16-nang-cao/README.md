# Giai đoạn 6 — Từ Junior lên Mid/Senior

> Học **sau khi đã đi làm** (hoặc sau khi xong Dự án 3), song song với công việc, trong khoảng 6–12 tháng.
> Khác các module trước: đây không phải bài giảng đầy đủ mà là **bản đồ** — mỗi chủ đề có phần cốt lõi phải hiểu,
> bài thực hành cụ thể để tự kiểm chứng, và tài liệu gốc để đào sâu.

---

## 0. Junior, Mid, Senior khác nhau ở đâu?

Không phải ở số năm, cũng không phải ở số công nghệ biết tên. Khác ở **phạm vi mình chịu trách nhiệm được**:

| | Junior | Mid | Senior |
|---|---|---|---|
| Phạm vi | một task đã được chia nhỏ | một tính năng trọn vẹn | một hệ thống / nhiều team |
| Khi gặp vấn đề | hỏi ngay, hoặc bí rất lâu | tự điều tra, biết khi nào cần hỏi | lường trước vấn đề trước khi nó xảy ra |
| Thiết kế | theo thiết kế có sẵn | tự thiết kế một tính năng, viết được design doc | đưa ra đánh đổi ở mức hệ thống, nói "không" có lý do |
| Production | sợ | trực sự cố được, đọc được metrics/log/trace | thiết kế để sự cố ít xảy ra và dễ khoanh vùng |
| Code review | nhận review | review cho người khác | đặt chuẩn cho cả team |
| Giao tiếp | báo cáo tiến độ | giải thích kỹ thuật cho người không làm kỹ thuật | thuyết phục, ước lượng, quản lý rủi ro |

Vì thế lộ trình này có **cả kỹ năng không phải code** (mục 12).

Thứ tự gợi ý: **1 → 2 → 6 → 7 → 5 → 4**, các mục khác học khi công việc cần.

---

## 1. Thiết kế hệ thống (System Design)

**Vì sao**: vòng phỏng vấn Mid/Senior gần như luôn có một bài "thiết kế hệ thống X". Quan trọng hơn: đó là việc bạn làm thật khi được giao một tính năng lớn.

### Cốt lõi phải hiểu
- **Ước lượng nhanh (back-of-the-envelope)**: 10 triệu người dùng/ngày, mỗi người 20 request → ~2.300 request/giây trung bình, giờ cao điểm × 3–5. Mỗi bản ghi 1KB × 100 triệu = 100GB. Biết con số để biết có cần phân tán hay không — **đa số hệ thống không cần**.
- **Mở rộng**: theo chiều dọc (máy to hơn) trước, theo chiều ngang (nhiều máy) khi cần. Muốn mở rộng ngang thì service phải **stateless**.
- **Load balancer**: round-robin, least-connections; health check; sticky session (và vì sao nên tránh).
- **Cache**: cache-aside, write-through, write-behind; TTL; cache stampede; cache ở nhiều tầng (CDN → gateway → ứng dụng → DB).
- **Database nhân bản (replication)**: primary nhận ghi, replica phục vụ đọc; **độ trễ nhân bản** → người dùng vừa sửa xong đọc lại thấy dữ liệu cũ (read-your-writes).
- **Chia dữ liệu (sharding/partitioning)**: theo key nào? hotspot? truy vấn chéo shard?
- **CAP & PACELC**: khi mạng bị chia cắt phải chọn nhất quán hay sẵn sàng; khi mạng bình thường phải chọn độ trễ hay nhất quán.
- **Nhất quán cuối cùng (eventual consistency)**, idempotency, exactly-once là "gần như" (at-least-once + idempotent).
- **Hàng đợi** để làm phẳng tải, tách hệ thống, xử lý bất đồng bộ.
- **Rate limiting**: token bucket, sliding window; đặt ở gateway.
- **ID phân tán**: auto-increment không dùng được khi nhiều DB → UUID v7, Snowflake.

### Cách làm một bài thiết kế (45 phút phỏng vấn)
1. **Làm rõ yêu cầu** (5 phút): tính năng chính, số người dùng, tỷ lệ đọc/ghi, yêu cầu độ trễ, nhất quán.
2. **Ước lượng** (5 phút): QPS, dung lượng lưu trữ, băng thông.
3. **API và mô hình dữ liệu** (5 phút).
4. **Thiết kế tổng thể** (10 phút): vẽ các khối, luồng dữ liệu.
5. **Đi sâu** 1–2 điểm khó nhất (15 phút): điểm nghẽn, điểm lỗi, cách mở rộng.
6. **Đánh đổi** (5 phút): cái gì chưa làm, rủi ro còn lại, sẽ cải tiến gì nếu tải tăng 10 lần.

### Thực hành
- **SD1.** Thiết kế **rút gọn link** (bit.ly): tạo mã ngắn không trùng, 100 triệu link, tỷ lệ đọc/ghi 100:1, đếm lượt click. Viết design doc 2 trang theo 6 bước trên.
- **SD2.** Thiết kế **flash sale**: 10.000 sản phẩm, 1 triệu người vào cùng lúc lúc 0h. Chống bán quá tồn kho, chống bot, không sập DB. (Bạn đã có mảnh ghép ở product-service của Dự án 3 — giờ phải chịu tải gấp 1.000 lần.)
- **SD3.** Thiết kế **news feed** kiểu Facebook: fan-out on write hay fan-out on read? Người nổi tiếng 10 triệu follower thì sao?
- **SD4.** Thiết kế **hệ thống thông báo** (email, SMS, push) với ưu tiên, giới hạn tần suất, thử lại, và người dùng tắt nhận.

### Tài liệu
- Sách *Designing Data-Intensive Applications* (Martin Kleppmann) — **quan trọng nhất trong cả danh sách này**, đọc chậm, mỗi tuần một chương.
- *System Design Interview* tập 1, 2 (Alex Xu).
- github.com/donnemartin/system-design-primer.

---

## 2. Database nâng cao

**Vì sao**: phần lớn sự cố hiệu năng ở backend là do database. Mid phải tự tối ưu được query chậm mà không cần DBA.

### Cốt lõi phải hiểu
- **Index bên trong**: B+ tree, index nhiều cột và **thứ tự cột** (quy tắc tiền tố trái nhất), covering index (`INCLUDE`), partial index, index trên biểu thức (`LOWER(email)`), vì sao `LIKE '%abc'` không dùng được index.
- **Đọc `EXPLAIN (ANALYZE, BUFFERS)`**: Seq Scan vs Index Scan vs Bitmap Scan, Nested Loop vs Hash Join vs Merge Join, ước lượng số dòng sai → kế hoạch sai → `ANALYZE`.
- **MVCC**: PostgreSQL giữ nhiều phiên bản dòng; `UPDATE` = ghi dòng mới; vì sao cần `VACUUM`; table bloat.
- **Các hiện tượng theo mức cô lập**: dirty read, non-repeatable read, phantom read, **lost update**, **write skew**. Mức nào chặn được cái nào trong PostgreSQL (khác chuẩn SQL!).
- **Khóa**: row lock, `SELECT ... FOR UPDATE SKIP LOCKED` (làm hàng đợi công việc bằng DB), advisory lock, deadlock và cách đọc log deadlock.
- **Connection pool**: vì sao pool nhỏ (10–20) thường nhanh hơn pool lớn; công thức tham khảo `số_nhân_CPU × 2 + số_đĩa`.
- **Migration không downtime (expand/contract)**: đổi tên cột qua 3 lần deploy: thêm cột mới + ghi cả hai → chuyển đọc sang cột mới + chép dữ liệu cũ → bỏ cột cũ. Tạo index trên bảng lớn bằng `CREATE INDEX CONCURRENTLY`.
- **Phân vùng bảng (partitioning)** theo thời gian cho bảng log/sự kiện hàng trăm triệu dòng.
- **Phân trang theo con trỏ (keyset pagination)** thay cho `OFFSET` khi bảng lớn.

### Thực hành
- **DB1.** Sinh bảng `orders` 10 triệu dòng (`generate_series`). Viết 5 query báo cáo thường gặp, đo thời gian, đọc `EXPLAIN ANALYZE`, thêm index phù hợp, đo lại. Ghi lại trước/sau.
- **DB2.** Tái hiện **lost update** và **write skew** bằng hai phiên `psql` song song ở `READ COMMITTED`, rồi chặn chúng bằng: `SELECT FOR UPDATE`, optimistic locking, `SERIALIZABLE`. So sánh cái giá của từng cách.
- **DB3.** Thay `OFFSET` bằng keyset pagination cho `GET /api/v1/posts` của Dự án 2; đo ở trang 10.000.
- **DB4.** Làm hàng đợi công việc bằng bảng `jobs` + `FOR UPDATE SKIP LOCKED`, chạy 5 worker song song, chứng minh không job nào bị xử lý hai lần.

### Tài liệu
- use-the-index-luke.com (miễn phí, rất hay).
- Tài liệu chính thức PostgreSQL: chương *Concurrency Control* và *Performance Tips*.

---

## 3. NoSQL và công cụ lưu trữ chuyên dụng

**Vì sao**: không phải để thay PostgreSQL, mà để biết **khi nào** một công cụ khác giải quyết tốt hơn hẳn.

| Công cụ | Dùng khi | Không dùng khi |
|---|---|---|
| **Redis** (ngoài cache) | đếm, xếp hạng (sorted set), rate limit, khóa phân tán, session, pub/sub nhẹ | dữ liệu cần bền vững tuyệt đối, truy vấn phức tạp |
| **MongoDB** | tài liệu lồng nhau, cấu trúc thay đổi nhiều (CMS, danh mục sản phẩm nhiều thuộc tính), không cần join | dữ liệu quan hệ chặt, giao dịch tài chính nhiều bảng |
| **Elasticsearch / OpenSearch** | tìm kiếm toàn văn có dấu tiếng Việt, gợi ý, lọc nhiều chiều, phân tích log | nguồn dữ liệu chính (hãy đồng bộ từ DB sang) |
| **Cassandra / ScyllaDB** | ghi cực nhiều, truy vấn theo khóa biết trước (IoT, lịch sử tin nhắn) | truy vấn tùy ý, cần join |
| **S3 / MinIO** | file, ảnh, video, bản sao lưu | dữ liệu cần truy vấn |

Mẫu thường gặp: PostgreSQL là **nguồn sự thật**, đồng bộ sang Elasticsearch để tìm kiếm qua sự kiện (outbox → Kafka → consumer ghi vào ES), hoặc **CDC** bằng Debezium.

### Thực hành
- **NS1.** Thêm tìm kiếm bài viết cho Dự án 2 bằng Elasticsearch: tìm không dấu ("hoc java" ra "Học Java"), đánh trọng số tiêu đề cao hơn nội dung, gợi ý khi gõ. Đồng bộ qua sự kiện khi bài viết được tạo/sửa.
- **NS2.** Bảng xếp hạng top 100 người dùng theo điểm, cập nhật thời gian thực, bằng Redis sorted set. So sánh với `ORDER BY ... LIMIT 100` trên bảng 10 triệu dòng.
- **NS3.** Upload ảnh đại diện lên MinIO (S3 tự dựng bằng Docker) bằng **pre-signed URL**: client tải thẳng lên kho, server không phải nhận file.

---

## 4. Bảo mật nâng cao: OAuth2, OIDC, Keycloak

**Vì sao**: doanh nghiệp, ngân hàng hầu như không tự viết đăng nhập như Dự án 2 mà dùng một **Identity Provider** (Keycloak, Auth0, Azure AD, Cognito). Bạn cần biết tích hợp.

### Cốt lõi phải hiểu
- **OAuth2** là giao thức **ủy quyền** ("cho phép app X đọc lịch Google của tôi"); **OIDC** thêm lớp **xác thực** lên trên (ID token: "người này là ai").
- Các vai trò: Resource Owner (người dùng), Client (app), Authorization Server (Keycloak), Resource Server (API của bạn).
- Các luồng (grant):
  - **Authorization Code + PKCE**: web/mobile app đăng nhập người dùng — luồng mặc định hiện nay.
  - **Client Credentials**: service gọi service, không có người dùng.
  - ~~Implicit~~, ~~Password~~: đã lỗi thời, không dùng.
- Access token ngắn hạn, refresh token, **JWKS** (khóa công khai để API tự kiểm chữ ký, không cần gọi Keycloak mỗi request).
- Scope vs role; ánh xạ role của Keycloak vào `GrantedAuthority` của Spring.
- **OWASP Top 10** (bản mới nhất): broken access control, injection, SSRF, security misconfiguration...
- Quản lý bí mật: không để trong biến môi trường lộ ra ở `docker inspect` khi có thể dùng Vault / AWS Secrets Manager; xoay vòng khóa.
- Quét phụ thuộc có lỗ hổng: OWASP Dependency-Check, GitHub Dependabot, Trivy cho image Docker.

### Thực hành
- **SEC1.** Chạy Keycloak bằng Docker, tạo realm, client, 2 role. Biến Dự án 2 thành **Resource Server** (`spring-boot-starter-oauth2-resource-server`), bỏ phần tự phát JWT. Kiểm tra `@PreAuthorize` theo role của Keycloak.
- **SEC2.** Cho order-service gọi product-service bằng **client credentials** thay cho tin header của gateway.
- **SEC3.** Chạy OWASP ZAP (quét tự động) vào Dự án 2, đọc báo cáo và sửa ít nhất 3 cảnh báo.

---

## 5. Kubernetes và triển khai lên cloud

**Vì sao**: phần lớn công ty vừa và lớn chạy trên Kubernetes. Developer không cần quản trị cluster, nhưng phải **tự deploy và debug được service của mình**.

### Cốt lõi phải hiểu
- **Pod** (một hoặc vài container chạy cùng), **Deployment** (số bản sao, rolling update), **Service** (địa chỉ ổn định + cân bằng tải nội bộ), **Ingress** (cửa vào từ ngoài), **ConfigMap/Secret**, **Namespace**.
- **Probes**: liveness (chết thì khởi động lại), readiness (chưa sẵn sàng thì không nhận traffic), startup. Spring Boot Actuator đã có sẵn `/actuator/health/liveness|readiness`.
- **Resources**: `requests` (được đảm bảo) và `limits` (trần). Vượt limit bộ nhớ → **OOMKilled**. JVM phải biết giới hạn container: `-XX:MaxRAMPercentage=75`.
- **HPA**: tự tăng/giảm số pod theo CPU hoặc metric tùy chỉnh.
- **Rolling update không downtime** = readiness probe đúng + graceful shutdown + migration tương thích ngược (mục 2).
- Lệnh sống còn: `kubectl get pods`, `describe pod`, `logs -f`, `logs --previous` (log của lần chạy trước khi crash), `exec -it`, `port-forward`, `rollout undo`.
- **Helm** (đóng gói manifest), **GitOps** (Argo CD: Git là nguồn sự thật của cấu hình cluster).
- **Cloud (AWS làm ví dụ)**: EC2, RDS (PostgreSQL có sẵn backup), ElastiCache (Redis), S3, IAM (quyền tối thiểu), VPC (mạng riêng), ALB, EKS. Mỗi nhà cung cấp có tên riêng nhưng khái niệm giống nhau.
- **IaC**: Terraform để tạo hạ tầng bằng code, review được như code.

### Thực hành
- **K1.** Cài `kind` hoặc `minikube`. Viết manifest cho product-service + PostgreSQL + Redis (Deployment, Service, ConfigMap, Secret, probes, resources). Deploy, gọi qua `port-forward`.
- **K2.** Tăng lên 3 bản sao, chạy `k6` bắn tải liên tục, trong lúc đó deploy bản mới. Chứng minh **không có request lỗi** nào. Làm lại với readiness probe bị bỏ đi và quan sát lỗi.
- **K3.** Đặt `limits.memory: 256Mi` và heap mặc định, quan sát OOMKilled; sửa bằng `MaxRAMPercentage`.
- **K4.** Đóng gói thành Helm chart có `values-dev.yaml`, `values-prod.yaml`.
- **K5.** (có tài khoản AWS free tier) Deploy Dự án 2 lên EC2 + RDS, cấu hình HTTPS bằng Let's Encrypt; **nhớ tắt tài nguyên sau khi xong** để không mất tiền.

---

## 6. Observability chuyên sâu

**Vì sao**: "trên máy em chạy bình thường" không còn là câu trả lời. Mid phải tự trả lời được *chậm ở đâu, lỗi từ đâu* trong hệ thống nhiều service.

### Cốt lõi phải hiểu
- **Ba trụ cột**: log (chuyện gì đã xảy ra), metrics (bao nhiêu, nhanh chậm thế nào), trace (request đi qua đâu, mất bao lâu ở mỗi chặng).
- **OpenTelemetry**: chuẩn chung cho cả ba; Java agent tự gắn trace vào HTTP, JDBC, Kafka mà không sửa code. Trace ID truyền qua header `traceparent` (W3C).
- **Metrics nên đo**: phương pháp **RED** cho service (Rate, Errors, Duration) và **USE** cho tài nguyên (Utilization, Saturation, Errors). Dùng **percentile** (p95, p99), không dùng trung bình.
- **SLI / SLO / error budget**: "99.9% request trả lời dưới 300ms trong 30 ngày" → được phép "hỏng" 43 phút/tháng.
- **Cảnh báo theo triệu chứng** (người dùng bị ảnh hưởng), không theo nguyên nhân (CPU 80%).
- **Kiểm thử tải**: k6 / Gatling; kịch bản tăng dần; tìm điểm gãy; đo trước và sau khi tối ưu.

### Thực hành
- **OB1.** Gắn OpenTelemetry Java agent cho các service của Dự án 3, chạy Jaeger hoặc Grafana Tempo, xem một request đặt hàng đi qua gateway → order → product → Kafka → notification trên **một** trace.
- **OB2.** Dựng dashboard Grafana theo RED cho mỗi service; đặt cảnh báo khi tỷ lệ lỗi > 1% trong 5 phút.
- **OB3.** Viết kịch bản k6 cho luồng đặt hàng, tăng dần tới khi p95 > 1 giây. Tìm điểm nghẽn bằng trace + metrics, sửa, đo lại. Viết báo cáo 1 trang.

---

## 7. Kafka và hệ thống hướng sự kiện nâng cao

### Cốt lõi phải hiểu
- **Partition** là đơn vị song song và **đơn vị đảm bảo thứ tự**: cùng key → cùng partition → đúng thứ tự. Chọn key sai = mất thứ tự hoặc lệch tải.
- **Consumer group**, rebalance (và vì sao xử lý lâu làm consumer bị đá khỏi group: `max.poll.interval.ms`).
- **Offset commit**: commit trước khi xử lý = có thể mất tin; commit sau = có thể xử lý lặp → consumer phải idempotent.
- `acks=all`, `min.insync.replicas`, idempotent producer, transaction (exactly-once trong Kafka Streams).
- **Retry và Dead Letter Topic**: retry không chặn (retry topic có độ trễ tăng dần), tin hỏng vào DLT, công cụ phát lại.
- **Schema Registry** (Avro/Protobuf) và tiến hóa schema tương thích ngược.
- **Outbox** + **CDC** (Debezium đọc WAL của PostgreSQL) thay cho job quét bảng.
- **Event sourcing** và **CQRS**: khi nào đáng dùng (hiếm), cái giá phải trả.

### Thực hành
- **KF1.** Tạo topic 6 partition, 3 consumer; gửi 10.000 sự kiện đơn hàng với key = orderId; chứng minh các sự kiện của cùng một đơn luôn đúng thứ tự dù xử lý song song.
- **KF2.** Cho consumer ném lỗi với 1% tin; cấu hình retry topic + DLT; viết endpoint admin phát lại tin từ DLT.
- **KF3.** Thay job quét outbox của Dự án 3 bằng Debezium.

---

## 8. Hiệu năng JVM trong production

### Cốt lõi phải hiểu
- **Đo trước, tối ưu sau**: JFR (Java Flight Recorder — có sẵn, chi phí thấp, bật được trên production), async-profiler, flame graph.
- Chọn GC: G1 (mặc định, cân bằng), ZGC (độ trễ dưới 1ms, heap lớn), Parallel (throughput cho batch). Đọc GC log.
- **Virtual threads** trong Spring Boot (`spring.threads.virtual.enabled=true`): lợi ở đâu (nhiều I/O chờ), hại ở đâu (pinning khi `synchronized` quanh I/O ở JDK < 24, pool DB vẫn là giới hạn thật).
- Phân tích heap dump (Eclipse MAT) để tìm rò rỉ bộ nhớ; thread dump để tìm deadlock, thread bị treo.
- JMH để micro-benchmark đúng cách.

### Thực hành
- **JV1.** Chạy k6 vào Dự án 2, ghi JFR 60 giây, mở bằng JDK Mission Control; tìm 3 method tốn CPU nhất và nơi cấp phát bộ nhớ nhiều nhất.
- **JV2.** Bật virtual threads cho Dự án 2, đo lại với 500 người dùng đồng thời và endpoint gọi API ngoài chậm 200ms. Giải thích kết quả.

---

## 9. Lập trình reactive (WebFlux) — biết để chọn đúng

- Mô hình non-blocking, event loop, `Mono`/`Flux`, backpressure.
- Hợp khi: gateway (Spring Cloud Gateway chạy trên WebFlux), streaming, rất nhiều kết nối chờ lâu (SSE, WebSocket).
- Không hợp khi: CRUD thông thường với JDBC/JPA (JDBC là blocking), team chưa quen — debug và đọc stacktrace khó hơn nhiều.
- Từ Java 21, **virtual threads** giải quyết phần lớn bài toán "nhiều I/O chờ" với code đồng bộ quen thuộc → nhiều team không còn cần WebFlux cho service thường.

**Thực hành R1.** Viết endpoint SSE đẩy trạng thái đơn hàng thời gian thực bằng WebFlux, và bản tương đương bằng Spring MVC + virtual threads. So sánh độ phức tạp code.

---

## 10. Kiến trúc phần mềm

### Cốt lõi phải hiểu
- **Kiến trúc phân tầng** (bạn đang dùng) → **Hexagonal / Clean Architecture**: lõi nghiệp vụ không phụ thuộc framework; DB, HTTP, Kafka là "adapter" cắm vào "port".
- **DDD chiến thuật**: Entity, **Value Object** (`Money`, `Email`), **Aggregate** (ranh giới nhất quán — một transaction chỉ sửa một aggregate), Domain Event, Repository cho aggregate root.
- **DDD chiến lược**: Bounded Context, ngôn ngữ chung (ubiquitous language), context map — **đây mới là cơ sở đúng để chia microservices**, không phải chia theo bảng.
- **Modular monolith**: một ứng dụng, nhiều module có ranh giới rõ (Spring Modulith kiểm tra ranh giới tự động). Thường là lựa chọn tốt hơn microservices cho team dưới ~30 người.
- **Architecture Decision Record (ADR)**: ghi lại *vì sao* chọn A thay vì B.
- Kiểm tra kiến trúc bằng test: **ArchUnit** ("controller không được gọi thẳng repository").

### Thực hành
- **AR1.** Tái cấu trúc order-service của Dự án 3 theo hexagonal: package `domain` (không import Spring), `application` (use case), `adapter.in.web`, `adapter.out.persistence`, `adapter.out.product`. Viết ArchUnit test bảo vệ ranh giới.
- **AR2.** Viết 3 ADR cho Dự án 3: vì sao saga điều phối (orchestration) thay vì biên đạo (choreography); vì sao outbox; vì sao mỗi service một DB.
- **AR3.** Gộp Dự án 3 thành **modular monolith** bằng Spring Modulith. So sánh số dòng code, độ phức tạp vận hành, và thời gian chạy test với bản microservices.

### Tài liệu
- *Clean Architecture* (Robert C. Martin), *Domain-Driven Design Distilled* (Vaughn Vernon), *Building Microservices* bản 2 (Sam Newman), *Fundamentals of Software Architecture* (Richards & Ford).

---

## 11. Chất lượng code và kiểm thử nâng cao

- **Test pyramid** thực tế: nhiều unit test, vừa đủ integration test (Testcontainers), ít end-to-end.
- **Contract testing** giữa các service (Spring Cloud Contract, Pact): order-service và product-service thống nhất hợp đồng bằng test, không bằng tài liệu.
- **Mutation testing** (PIT): đo xem test có thật sự bắt được lỗi không — coverage 90% vẫn có thể vô dụng.
- **Property-based testing** (jqwik): sinh ngẫu nhiên hàng nghìn đầu vào để tìm trường hợp biên.
- Phân tích tĩnh: SonarQube, SpotBugs, Error Prone; formatter tự động (Spotless) trong CI.
- Refactoring an toàn trên code cũ không có test: viết **characterization test** chốt hành vi hiện tại trước (sách *Working Effectively with Legacy Code*).

**Thực hành Q1.** Chạy PIT trên Dự án 1, tìm các mutant "sống sót" và bổ sung test tiêu diệt chúng. **Q2.** Viết contract test cho API reserve giữa order-service và product-service.

---

## 12. Kỹ năng không phải code — thứ quyết định bạn lên Senior

- **Viết design doc / RFC** trước khi code tính năng lớn: bối cảnh, mục tiêu và *không phải mục tiêu*, các phương án, đánh đổi, kế hoạch triển khai và rollback. Cho người khác review.
- **Ước lượng**: chia nhỏ tới việc ≤ 1 ngày; nói khoảng ("3–5 ngày") kèm rủi ro, không nói một con số.
- **Trực sự cố (on-call)**: ưu tiên *khôi phục* trước *tìm nguyên nhân* (rollback trước, điều tra sau). Sau sự cố viết **postmortem không đổ lỗi**: dòng thời gian, nguyên nhân gốc, hành động phòng ngừa.
- **Review code có tâm** và **mentoring** người mới — cách nhanh nhất để chính mình hiểu sâu hơn.
- **Hiểu nghiệp vụ**: nói chuyện được với PO/BA bằng ngôn ngữ của họ; hỏi "vấn đề thật sự là gì" trước khi hỏi "làm bằng công nghệ gì".
- **Đọc code nguồn mở** và đóng góp: bắt đầu từ sửa tài liệu, rồi sửa bug nhỏ ở thư viện bạn dùng hằng ngày.

**Thực hành S1.** Trước tính năng lớn tiếp theo ở công ty (hoặc cho SD2 ở trên), viết design doc 2–4 trang và xin ít nhất 2 người review. **S2.** Chọn một sự cố từng gặp (kể cả trong dự án học), viết postmortem theo mẫu của Google SRE Book.

---

## Dự án tổng hợp giai đoạn 6 (chọn một)

1. **Flash sale** (từ SD2): chịu 5.000 request/giây trên máy cá nhân với k6, không bán quá tồn kho, có dashboard, có trace, có báo cáo tải trước/sau tối ưu.
2. **Hệ thống đặt vé** (phim/xe khách): giữ ghế có thời hạn (Redis TTL), thanh toán giả lập có callback, hủy tự động khi quá hạn, tìm kiếm chuyến bằng Elasticsearch, deploy lên Kubernetes bằng Helm.
3. **Đóng góp mã nguồn mở**: ít nhất 3 pull request được merge vào một dự án Java có trên 1.000 sao.

Mỗi dự án phải có: design doc, ADR, dashboard, báo cáo kiểm thử tải, README như hướng dẫn ở [interview/cv-va-du-an.md](../interview/cv-va-du-an.md).

---

## Checklist tự đánh giá lên Mid

- [ ] Đọc `EXPLAIN ANALYZE` và tự sửa được query chậm
- [ ] Giải thích và tái hiện được lost update, write skew; biết chọn cách chặn
- [ ] Tự thiết kế một tính năng trọn vẹn, viết design doc được team duyệt
- [ ] Trực sự cố được: từ cảnh báo → trace → log → nguyên nhân → khắc phục
- [ ] Deploy và debug service trên Kubernetes (`describe`, `logs --previous`, `port-forward`)
- [ ] Tích hợp đăng nhập qua Keycloak/OIDC
- [ ] Giải thích được thứ tự, commit offset, idempotency trong Kafka
- [ ] Làm được một bài system design 45 phút theo 6 bước
- [ ] Review code cho người khác với nhận xét có lý do, có ưu tiên

👉 Không có "xong" ở giai đoạn này. Mỗi quý chọn 1–2 chủ đề gắn với việc đang làm, học sâu, và **áp dụng thật** vào dự án.
