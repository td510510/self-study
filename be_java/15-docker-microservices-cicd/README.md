# Module 15 — Docker, Microservices & CI/CD

> Mục tiêu: đóng gói và vận hành ứng dụng như một kỹ sư backend thật sự — Docker, quan sát hệ thống, CI/CD, và biết **khi nào nên (và không nên)** tách microservices.
> Thời lượng: 2 tuần.

---

## Phần 1 — Docker

### 1.1 Vấn đề Docker giải quyết
"Máy tôi chạy được mà" — câu nói kinh điển. Docker đóng gói **ứng dụng + thư viện + môi trường** thành một image chạy giống hệt nhau ở mọi nơi.

| Khái niệm | Nghĩa |
|---|---|
| **Image** | bản đóng gói bất biến (như file `.iso`) |
| **Container** | một tiến trình đang chạy từ image |
| **Dockerfile** | công thức tạo image |
| **Registry** | kho chứa image (Docker Hub, GHCR) |
| **Volume** | vùng lưu dữ liệu tồn tại lâu hơn container |

Container **không phải máy ảo**: nó dùng chung nhân hệ điều hành, nên nhẹ hơn và khởi động trong vài trăm mili giây.

### 1.2 Dockerfile chuẩn cho Spring Boot

```dockerfile
# ---------- Giai đoạn build ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom TRƯỚC để tận dụng cache: chỉ tải lại thư viện khi pom.xml thay đổi
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ---------- Giai đoạn chạy ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app
USER app                                    # không chạy bằng root

COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-XX:+HeapDumpOnOutOfMemoryError", "-jar", "app.jar"]
```

Bốn điều quan trọng trong file trên:
1. **Multi-stage**: image cuối chỉ có JRE + jar (~200MB) thay vì cả Maven và mã nguồn (~800MB).
2. **Thứ tự COPY**: mỗi lệnh là một layer được cache. Copy `pom.xml` trước → sửa code không phải tải lại thư viện.
3. **Không chạy bằng root**: nếu ứng dụng bị chiếm quyền, kẻ tấn công không có quyền root trong container.
4. **`MaxRAMPercentage` thay cho `-Xmx` cố định**: JVM tự tính heap theo giới hạn RAM của container. Đặt `-Xmx2g` trong container 1GB là cách chắc chắn để bị hệ điều hành giết (OOMKilled) — liên hệ Module 07.

```bash
docker build -t blog-api:1.0 .
docker run -p 8080:8080 -e JWT_SECRET=... blog-api:1.0
docker logs -f <container>
docker exec -it <container> sh
docker stats                 # xem CPU/RAM đang dùng
```

### 1.3 Docker Compose

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: blogdb
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data       # dữ liệu sống lâu hơn container
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 10

  redis:
    image: redis:7-alpine

  api:
    build: .
    depends_on:
      db: { condition: service_healthy }      # chờ DB SẴN SÀNG, không chỉ "đã khởi động"
    environment:
      DB_URL: jdbc:postgresql://db:5432/blogdb   # "db" là tên service = tên host
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
    ports: ["8080:8080"]

volumes:
  pgdata:
```
```bash
docker compose up -d --build
docker compose logs -f api
docker compose down          # giữ volume
docker compose down -v       # XÓA cả dữ liệu
```

> `depends_on` trần chỉ đảm bảo **thứ tự khởi động**, không đảm bảo DB đã sẵn sàng nhận kết nối. Luôn dùng kèm `healthcheck` + `condition: service_healthy`.

## Phần 2 — Quan sát hệ thống (Observability)

Ba trụ cột, mỗi cái trả lời một câu hỏi khác nhau:

| Trụ cột | Trả lời câu hỏi | Công cụ |
|---|---|---|
| **Logs** | *Chuyện gì đã xảy ra?* | Logback → ELK / Loki |
| **Metrics** | *Hệ thống đang khỏe không?* | Micrometer → Prometheus → Grafana |
| **Traces** | *Request này chậm ở đâu?* | Micrometer Tracing → Zipkin/Jaeger |

### 2.1 Log cho production

```java
@Slf4j
public class PostService {
    public void create(...) {
        log.info("Tạo bài viết slug={} authorId={}", slug, authorId);   // dùng {} chứ đừng nối chuỗi
        log.error("Không gửi được email cho {}", email, e);              // exception là tham số CUỐI
    }
}
```

Quy tắc:
- **Không bao giờ log**: mật khẩu, token, số thẻ, thông tin cá nhân nhạy cảm.
- Dùng `{}` thay vì nối chuỗi (không tốn chi phí format khi mức log bị tắt).
- Mức log: `ERROR` (cần người xử lý) → `WARN` (bất thường) → `INFO` (mốc nghiệp vụ) → `DEBUG` (chi tiết dev).
- **Log dạng JSON ở production** để hệ thống thu thập phân tích được theo trường.

**Correlation ID** — thứ giúp bạn lần vết một request qua nhiều lớp:
```java
@Component
public class TraceIdFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String traceId = Optional.ofNullable(req.getHeader("X-Trace-Id"))
                .orElse(UUID.randomUUID().toString().substring(0, 8));
        MDC.put("traceId", traceId);
        res.setHeader("X-Trace-Id", traceId);
        try {
            chain.doFilter(req, res);
        } finally {
            MDC.clear();          // BẮT BUỘC: MDC dùng ThreadLocal, thread pool tái sử dụng thread (Module 07)
        }
    }
}
```
Người dùng báo lỗi kèm traceId → bạn lọc log theo traceId đó và thấy toàn bộ hành trình request.

### 2.2 Metrics với Actuator

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      probes:
        enabled: true            # /health/liveness và /health/readiness
  metrics:
    tags:
      application: ${spring.application.name}
```

```java
@Service
@RequiredArgsConstructor
public class PostService {
    private final MeterRegistry meterRegistry;

    public PostResponse create(...) {
        meterRegistry.counter("blog.posts.created").increment();
        ...
    }

    @Timed(value = "blog.posts.search", percentiles = {0.5, 0.95, 0.99})
    public PageResponse<PostSummaryResponse> search(...) { ... }
}
```

Bốn chỉ số cần theo dõi đầu tiên (RED + tài nguyên):
- **Rate**: request/giây
- **Errors**: tỷ lệ 5xx
- **Duration**: p95, p99 (đừng nhìn trung bình — nó giấu mất các request chậm)
- **Tài nguyên**: heap, CPU, số connection trong pool

### 2.3 Liveness vs Readiness
- **Liveness**: "tiến trình còn sống không?" — hỏng thì **khởi động lại** container.
- **Readiness**: "sẵn sàng nhận request chưa?" — chưa sẵn sàng thì **ngừng gửi traffic tới** (nhưng không restart).

Nhầm hai cái này gây hậu quả thật: đặt kiểm tra DB vào liveness → DB chập chờn 10 giây → toàn bộ container bị restart liên tục, hệ thống sập hẳn.

### 2.4 Graceful shutdown
```yaml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
```
Khi deploy phiên bản mới, container cũ cần **xử lý nốt** request đang chạy rồi mới tắt — nếu không, người dùng nhận lỗi giữa chừng mỗi lần bạn deploy.

## Phần 3 — CI/CD

**CI** (Continuous Integration): mỗi lần push, tự động build + test → phát hiện lỗi sớm.
**CD** (Continuous Delivery/Deployment): tự động đóng gói và triển khai.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: maven                    # cache ~/.m2, build nhanh hơn nhiều

      - name: Chạy test (gồm cả Testcontainers)
        run: mvn -B verify

      - name: Lưu báo cáo test
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-reports
          path: target/surefire-reports/

  build-image:
    needs: test                            # chỉ chạy khi test xanh
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
```

Thực hành tốt:
- Bảo vệ nhánh `main`: bắt buộc CI xanh mới merge.
- Gắn tag image bằng **commit SHA**, không dùng `latest` cho production (không biết `latest` là bản nào).
- Secret nằm trong GitHub Secrets, không nằm trong file yml.
- Thêm quét bảo mật (Trivy/OWASP dependency-check) vào pipeline.

Chiến lược triển khai:
- **Rolling**: thay dần từng instance (mặc định của Kubernetes).
- **Blue-Green**: dựng môi trường mới song song, chuyển traffic một lần, lỗi thì chuyển ngược lại.
- **Canary**: cho 5% traffic vào bản mới, ổn thì tăng dần.

## Phần 4 — Microservices

### 4.1 Sự thật quan trọng nhất về microservices
> **Đừng bắt đầu bằng microservices.**

Microservices giải quyết **vấn đề tổ chức** (nhiều team cần deploy độc lập), không phải vấn đề kỹ thuật. Chúng đổi sự phức tạp *trong tiến trình* lấy sự phức tạp *qua mạng*:

| Monolith | Microservices |
|---|---|
| gọi method (nano giây, luôn thành công) | gọi HTTP (mili giây, **có thể lỗi**) |
| transaction ACID | saga, nhất quán sau cùng |
| debug bằng stacktrace | cần distributed tracing |
| deploy 1 lần | deploy N lần, N cấu hình |
| 1 database | N database, đồng bộ khó |

Lời khuyên thực tế cho người mới: viết **monolith module hóa tốt** (đúng như Dự án 2) — tách rõ tầng và module, phụ thuộc một chiều. Khi thật sự cần, tách ra dịch vụ riêng sẽ dễ. Học microservices vì **phỏng vấn hỏi** và vì bạn sẽ gặp ở công ty, nhưng đừng bê nó vào mọi dự án.

### 4.2 Các thành phần của một hệ microservices

```
                    ┌─────────────┐
    Client ────────►│ API Gateway │  định tuyến, xác thực, rate limit
                    └──────┬──────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐   ┌────────────┐   ┌──────────────┐
   │auth-service│   │post-service│   │notif-service │
   └─────┬──────┘   └─────┬──────┘   └──────┬───────┘
         │                │                 │
      auth_db          post_db            (Kafka)
```

Quy tắc nền tảng: **mỗi service sở hữu database riêng**. Service khác muốn dữ liệu thì gọi API hoặc nghe sự kiện — **không bao giờ** truy cập thẳng DB của nhau. Chung database = không phải microservices, chỉ là monolith bị chia nhỏ và khó hơn.

### 4.3 Giao tiếp

**Đồng bộ (HTTP)** — khi cần câu trả lời ngay:
```java
@Bean
RestClient orderServiceClient(RestClient.Builder builder) {
    return builder.baseUrl("http://order-service").build();
}
```
Bắt buộc: **timeout** (không có timeout = một service chậm làm sập cả hệ thống), **retry** có giới hạn, và **circuit breaker**.

**Bất đồng bộ (Kafka)** — khi không cần chờ (Module 14). Tách rời tốt hơn, chịu lỗi tốt hơn, nhưng dữ liệu chỉ nhất quán sau cùng.

### 4.4 Circuit Breaker (Resilience4j)
```java
@CircuitBreaker(name = "notificationService", fallbackMethod = "fallback")
@Retry(name = "notificationService")
@TimeLimiter(name = "notificationService")
public CompletableFuture<Void> notify(Long userId) { ... }

private CompletableFuture<Void> fallback(Long userId, Throwable t) {
    log.warn("notification-service không phản hồi, bỏ qua thông báo cho {}", userId);
    return CompletableFuture.completedFuture(null);
}
```
Ba trạng thái: **CLOSED** (bình thường) → lỗi vượt ngưỡng → **OPEN** (từ chối ngay, không gọi nữa) → sau một khoảng → **HALF_OPEN** (thử vài request) → ổn thì về CLOSED.

Mục đích: ngăn **lỗi lan dây chuyền**. Không có nó, một service chậm sẽ làm cạn thread pool của service gọi nó, rồi lan ra toàn hệ thống.

### 4.5 Giao dịch phân tán — Saga
Không có transaction ACID xuyên service. Thay vào đó là chuỗi bước, mỗi bước có **hành động bù trừ**:
```
Đặt hàng: tạo đơn → trừ tồn kho → thanh toán → giao hàng
Nếu thanh toán lỗi → hoàn tồn kho → hủy đơn
```
Hệ quả bắt buộc chấp nhận: có những khoảnh khắc dữ liệu **chưa nhất quán**. Nghiệp vụ phải được thiết kế để chịu được điều đó.

---

## Tổng kết
- Dockerfile: multi-stage, non-root, cache layer đúng thứ tự, `MaxRAMPercentage`.
- Compose: healthcheck + `service_healthy`, volume, secret qua biến môi trường.
- Observability: log JSON có traceId, metrics RED, tracing; phân biệt liveness/readiness.
- CI/CD: test → build → push image có tag SHA; bảo vệ nhánh.
- Microservices: mỗi service một DB; timeout + circuit breaker; saga thay cho transaction; và **chỉ tách khi thật sự cần**.

## Bài tập
👉 [bai-tap.md](bai-tap.md), sau đó làm **[Dự án 3 — Shop Microservices](../projects/p3-shop-microservices/)**.
