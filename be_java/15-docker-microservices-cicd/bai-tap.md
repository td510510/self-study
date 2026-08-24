# Bài tập Module 15 — Docker, Microservices & CI/CD

## Nhóm A — Docker cơ bản

**A1.** Cài Docker Desktop. Chạy `docker run hello-world`, `docker run -it alpine sh`.

**A2.** Chạy PostgreSQL và Redis bằng Docker, kết nối được từ DBeaver / redis-cli.

**A3.** Viết Dockerfile cho Blog API (Dự án 2), build và chạy. Ghi lại kích thước image.

**A4.** Chuyển sang **multi-stage build**, so sánh kích thước image trước/sau. Giải thích chênh lệch.

**A5.** Chứng minh tác dụng của thứ tự `COPY`: sửa 1 dòng code rồi build lại — bước tải dependency có chạy lại không? Đảo thứ tự COPY và thử lại.

**A6.** Thêm `.dockerignore`, so sánh thời gian build và kích thước context.

**A7.** Chạy container với `--memory=256m`. Thử với `-Xmx1g` cố định và với `MaxRAMPercentage=75`, quan sát trường hợp nào bị OOMKilled.

**A8.** Chứng minh container **không** chạy bằng root: `docker exec -it api whoami`.

## Nhóm B — Docker Compose

**B1.** Viết `docker-compose.yml` gồm: api + postgres + redis. `docker compose up` là chạy được toàn bộ.

**B2.** Thêm `healthcheck` cho postgres và `depends_on: condition: service_healthy`. Chứng minh API không còn lỗi "connection refused" lúc khởi động.

**B3.** Dùng named volume cho dữ liệu Postgres. Chứng minh `docker compose down` rồi `up` lại vẫn còn dữ liệu; `down -v` thì mất.

**B4.** Đưa toàn bộ secret vào file `.env`, thêm `.env` vào `.gitignore`, commit `.env.example`.

**B5.** Chạy 3 instance API (`docker compose up --scale api=3`) sau một nginx làm cân bằng tải. Kiểm chứng: cái gì hỏng? (Gợi ý: bộ đếm trong bộ nhớ, job `@Scheduled`.)

## Nhóm C — Observability

**C1.** Bật Actuator, gọi `/actuator/health`, `/actuator/metrics`, `/actuator/prometheus`.

**C2.** Cấu hình liveness/readiness probe, giải thích khác nhau.

**C3.** Viết `CorrelationIdFilter` với MDC; kiểm chứng mọi dòng log của cùng một request đều có cùng id, và id được trả về trong response header.
*Chú ý*: phải `MDC.clear()` trong `finally` — nếu không sẽ rò rỉ ThreadLocal trong thread pool (Module 07).

**C4.** Chuyển log sang định dạng JSON (logstash-logback-encoder).

**C5.** Thêm `@Timed` cho các endpoint chính, xem số liệu trong `/actuator/metrics`.

**C6.** Chạy Prometheus + Grafana bằng Docker Compose, vẽ dashboard: số request/giây, độ trễ p95, tỷ lệ lỗi.

**C7.** Thêm custom metric: đếm số bài viết được tạo, số lần đăng nhập thất bại.

**C8.** Cấu hình `graceful shutdown`, chứng minh request đang chạy vẫn hoàn tất khi tắt ứng dụng.

## Nhóm D — Tách microservice

**D1.** Từ Blog API monolith, tách `auth-service` thành service riêng với DB riêng. Liệt kê những gì bị vỡ và cách xử lý.

**D2.** Viết `FeignClient` cho blog-service gọi auth-service lấy thông tin người dùng.

**D3.** Thêm timeout + retry + circuit breaker (Resilience4j). **Tắt** auth-service và chứng minh blog-service vẫn trả lời (bằng fallback) thay vì treo.

**D4.** Quan sát trạng thái circuit breaker (CLOSED → OPEN → HALF_OPEN) qua Actuator.

**D5.** Thay lời gọi đồng bộ bằng sự kiện Kafka ở chỗ có thể (ví dụ: gửi thông báo). So sánh 2 cách.

**D6.** Dựng API Gateway (Spring Cloud Gateway) định tuyến tới 2 service, xác thực JWT tập trung tại gateway.

**D7.** Viết một đoạn giải thích (5–10 dòng): khi nào bạn **không** nên tách microservice.

## Nhóm E — CI/CD

**E1.** Viết `.github/workflows/ci.yml`: checkout → JDK 21 → `mvn verify`. Push và xem kết quả trên GitHub.

**E2.** Bật cache Maven, so sánh thời gian build lần 1 và lần 2.

**E3.** Cho một test fail có chủ đích, chứng minh CI đỏ và **chặn merge** PR (bật branch protection).

**E4.** Thêm job build và push Docker image lên Docker Hub / GHCR, gắn tag theo commit SHA.

**E5.** Thêm bước quét lỗ hổng (`dependency-check` hoặc Trivy), xem báo cáo.

**E6.** Thêm badge trạng thái CI vào README.

**E7.** Viết quy trình rollback: nếu bản deploy mới lỗi, làm gì trong 5 phút? Viết thành checklist.

## Nhóm F — Tổng hợp (bắt buộc)

**F1. Đưa Blog API lên chuẩn production:**
- Multi-stage Dockerfile, image < 250MB, chạy bằng user thường.
- `docker compose up` khởi động: api + postgres + redis + prometheus + grafana.
- Health check, graceful shutdown, log JSON có correlation id.
- Dashboard Grafana theo dõi 4 chỉ số vàng.
- CI chạy test + build image, có badge trong README.
- Tài liệu vận hành: cách deploy, cách rollback, cách xem log, cách đọc chỉ số.

*Đạt khi*: một người khác clone repo, chạy đúng 1 lệnh, có ngay hệ thống chạy được kèm dashboard.

---

## Câu hỏi phỏng vấn
1. Container khác máy ảo thế nào?
2. Multi-stage build giải quyết vấn đề gì?
3. Vì sao trong container nên dùng `MaxRAMPercentage` thay cho `-Xmx`?
4. `CMD` khác `ENTRYPOINT`?
5. Volume dùng để làm gì?
6. Khi nào **không** nên dùng microservices?
7. Vì sao mỗi microservice cần DB riêng?
8. Circuit breaker là gì? Ba trạng thái của nó?
9. Saga pattern giải quyết vấn đề gì?
10. Ba trụ cột của observability?
11. Correlation id để làm gì?
12. Liveness khác readiness probe ở điểm nào?
13. CI/CD mang lại lợi ích cụ thể gì?
14. Làm sao deploy mà không gián đoạn dịch vụ?
15. Thay đổi schema DB tương thích ngược nghĩa là gì?
