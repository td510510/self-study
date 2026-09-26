# Giáo án chi tiết — 55 buổi

Mỗi file giáo án gồm: **dòng thời gian 180 phút**, lý thuyết giảng giải, kịch bản thực hành từng bước, bài tập về nhà, checklist kết thúc buổi, và các mục **📝 Ghi chú giảng viên** chỉ ra chỗ học viên hay hiểu sai.

---

## Phase 0 — Cầu nối tư duy Frontend → Backend *(tuần 1)*

| Buổi | Chủ đề | Code |
|---|---|---|
| [01](./phase-0/buoi-01-http-lifecycle.md) | Client–Server & vòng đời một HTTP request | [`buoi-01-raw-http/`](../code/buoi-01-raw-http/) |
| [02](./phase-0/buoi-02-event-loop.md) | Node.js runtime & Event Loop chuyên sâu | [`buoi-02-event-loop/`](../code/buoi-02-event-loop/) |
| [03](./phase-0/buoi-03-module-npm-cli.md) | Module, npm, biến môi trường + **Project 0** | [`buoi-03-order-cli/`](../code/buoi-03-order-cli/) |

## Phase 1 — Node.js Core *(tuần 2–3)*

| Buổi | Chủ đề | Code |
|---|---|---|
| [04](./phase-1/buoi-04-http-server.md) | Dựng HTTP server bằng tay | [`buoi-04-http-server/`](../code/buoi-04-http-server/) |
| [05](./phase-1/buoi-05-router-body.md) | Router thủ công & parse body | [`buoi-05-router-body/`](../code/buoi-05-router-body/) |
| [06](./phase-1/buoi-06-stream-buffer.md) | Stream & Buffer | [`buoi-06-stream-buffer/`](../code/buoi-06-stream-buffer/) |
| [07](./phase-1/buoi-07-async.md) | Async patterns & xử lý lỗi bất đồng bộ | [`buoi-07-async/`](../code/buoi-07-async/) |
| [08](./phase-1/buoi-08-process-shutdown.md) | fs/promises, process & graceful shutdown | [`buoi-08-process-shutdown/`](../code/buoi-08-process-shutdown/) |
| [09](./phase-1/buoi-09-project-1.md) | **Project 1** — Todo REST API Node thuần | [`project-01-todo-api/`](../code/project-01-todo-api/) |

## Phase 2 — Express.js *(tuần 4–6)*

| Buổi | Chủ đề | Code |
|---|---|---|
| [10](./phase-2/buoi-10-express-co-ban.md) | Express cơ bản: app, Router, middleware chain | [`buoi-10-express-basic/`](../code/buoi-10-express-basic/) |
| [11](./phase-2/buoi-11-middleware-zod.md) | Middleware nâng cao & validation với zod | [`buoi-11-middleware-zod/`](../code/buoi-11-middleware-zod/) |
| [12](./phase-2/buoi-12-prisma-postgres.md) | PostgreSQL & Prisma: schema và migration | [`buoi-12-prisma-postgres/`](../code/buoi-12-prisma-postgres/) |
| [13](./phase-2/buoi-13-prisma-crud-relations.md) | Prisma CRUD & Relations, vấn đề N+1 | [`buoi-12-prisma-postgres/`](../code/buoi-12-prisma-postgres/) |
| [14](./phase-2/buoi-14-mongodb-mongoose.md) | MongoDB & Mongoose: tư duy NoSQL | [`buoi-14-mongodb/`](../code/buoi-14-mongodb/) |
| [15](./phase-2/buoi-15-auth-jwt.md) | Authentication: JWT & bcrypt | [`buoi-15-auth-jwt/`](../code/buoi-15-auth-jwt/) |
| [16](./phase-2/buoi-16-rbac.md) | Authorization & RBAC, lỗ hổng IDOR | [`buoi-16-rbac/`](../code/buoi-16-rbac/) |
| [17](./phase-2/buoi-17-upload-testing.md) | File upload an toàn & Kim tự tháp test | [`buoi-17-upload-testing/`](../code/buoi-17-upload-testing/) |
| [18](./phase-2/buoi-18-logging-project2.md) | Logging, phân loại lỗi & **Project 2** | [`project-02-ecommerce/`](../code/project-02-ecommerce/) |

## Phase 3 — Backend chuyên sâu *(tuần 7–9)*

| Buổi | Chủ đề | Code |
|---|---|---|
| [19](./phase-3/buoi-19-transaction-index.md) | Transaction, tranh chấp & Index | [`project-02-ecommerce/`](../code/project-02-ecommerce/) |
| [20](./phase-3/buoi-20-pool-phan-trang.md) | Connection pooling & phân trang cursor | [`project-02-ecommerce/`](../code/project-02-ecommerce/) |
| [21](./phase-3/buoi-21-redis-cache.md) | Redis: cache-aside, rate limit, session | [`project-02-ecommerce/`](../code/project-02-ecommerce/) |
| [22](./phase-3/buoi-22-owasp.md) | OWASP Top 10 thực chiến — tự khai thác & vá | [`project-02-ecommerce/`](../code/project-02-ecommerce/) |
| [23](./phase-3/buoi-23-cors-helmet-ratelimit.md) | CORS, Helmet & Rate limiting | [`project-02-ecommerce/`](../code/project-02-ecommerce/) |
| [24](./phase-3/buoi-24-thiet-ke-api.md) | Thiết kế API chuẩn REST & Idempotency | [`project-02-ecommerce/`](../code/project-02-ecommerce/) |
| [25](./phase-3/buoi-25-websocket.md) | Realtime với WebSocket / Socket.IO | [`project-02-ecommerce/`](../code/project-02-ecommerce/) |
| [26](./phase-3/buoi-26-bullmq.md) | Background jobs với BullMQ | [`project-02-ecommerce/`](../code/project-02-ecommerce/) |
| [27](./phase-3/buoi-27-docker.md) | Docker hoá toàn bộ dự án | [`project-02-ecommerce/`](../code/project-02-ecommerce/) |

## Phase 4 — NestJS *(tuần 10–13)*

| Buổi | Chủ đề | Code |
|---|---|---|
| [28](./phase-4/buoi-28-vi-sao-nestjs.md) | Vì sao NestJS & Dependency Injection | [`project-04-nestjs/`](../code/project-04-nestjs/) |
| [29](./phase-4/buoi-29-module-controller-provider.md) | Module, Controller, Provider | ↑ |
| [30](./phase-4/buoi-30-request-lifecycle.md) | Request lifecycle: Guard → Pipe → Filter | ↑ |
| [31](./phase-4/buoi-31-dto-validation.md) | DTO & Validation với class-validator | ↑ |
| [32](./phase-4/buoi-32-prisma-trong-nest.md) | Prisma trong Nest & Repository pattern | ↑ |
| [33](./phase-4/buoi-33-pipe-guard-decorator.md) | Custom Pipe, Guard & Decorator | ↑ |
| [34](./phase-4/buoi-34-exception-filter.md) | Exception Filter & xử lý lỗi tập trung | ↑ |
| [35](./phase-4/buoi-35-passport-jwt.md) | Auth trong Nest: Passport JWT | ↑ |
| [36](./phase-4/buoi-36-rbac-guard.md) | RBAC bằng Guard + metadata | ↑ |
| [37](./phase-4/buoi-37-unit-test-mock-di.md) | Unit test với mock DI | ↑ |
| [38](./phase-4/buoi-38-e2e-config.md) | E2E test & Config module | ↑ |
| [39](./phase-4/buoi-39-swagger-tong-ket.md) | Swagger & **tổng kết Project 4** | ↑ |

## Phase 5 — Production-ready *(tuần 14–16)*

| Buổi | Chủ đề | Tài nguyên |
|---|---|---|
| [40](./phase-5/buoi-40-ci-github-actions.md) | CI với GitHub Actions | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| [41](./phase-5/buoi-41-cd-deploy-tu-dong.md) | CD, migration & rollback | [`.github/workflows/cd.yml`](../.github/workflows/cd.yml) |
| [42](./phase-5/buoi-42-nginx-pm2.md) | Nginx reverse proxy & PM2 cluster | [`deploy/`](../code/project-02-ecommerce/deploy/) |
| [43](./phase-5/buoi-43-monitoring.md) | Monitoring, health check & bốn tín hiệu vàng | [`project-02-ecommerce/`](../code/project-02-ecommerce/) |
| [44](./phase-5/buoi-44-load-testing.md) | Performance & Load testing | [`benchmark/do-tai.mjs`](../code/project-02-ecommerce/benchmark/do-tai.mjs) |
| [45](./phase-5/buoi-45-system-design.md) | System Design nhập môn | — |
| [46](./phase-5/buoi-46-code-review.md) | Code review & API contract | — |
| [47](./phase-5/buoi-47-capstone-thiet-ke.md) | **Capstone** — thiết kế | — |
| [48](./phase-5/buoi-48-capstone-bao-ve.md) | **Capstone** — bảo vệ & tổng kết khoá học | — |

## Phase 6 — Hero *(tuần 17–19)*

Dành cho người đã xong capstone và muốn vượt mức junior. Thêm **58 test** (13 + 15 + 18 + 12), tất cả đã chạy thật.

| Buổi | Chủ đề | Code |
|---|---|---|
| [49](./phase-6/buoi-49-design-pattern-solid.md) | Design pattern & SOLID trong backend Node | [`buoi-49-design-patterns/`](../code/buoi-49-design-patterns/) |
| [50](./phase-6/buoi-50-oauth2-oidc.md) | Đăng nhập bằng OAuth2 / OpenID Connect (PKCE) | [`buoi-50-oauth2-oidc/`](../code/buoi-50-oauth2-oidc/) |
| [51](./phase-6/buoi-51-thanh-toan-webhook.md) | Thanh toán & webhook: chữ ký, trùng, sai thứ tự, đối soát | [`buoi-51-webhook-thanh-toan/`](../code/buoi-51-webhook-thanh-toan/) |
| [52](./phase-6/buoi-52-rabbitmq.md) | Message broker: RabbitMQ (và khi nào cần Kafka) | [`project-05-microservices/`](../code/project-05-microservices/) |
| [53](./phase-6/buoi-53-microservices-outbox-saga.md) | Microservices: tách dịch vụ, Outbox, Saga | ↑ |
| [54](./phase-6/buoi-54-observability.md) | Observability: OpenTelemetry, Prometheus, Grafana | ↑ |
| [55](./phase-6/buoi-55-dien-tap-su-co.md) | **Diễn tập sự cố**, postmortem & tổng kết | ↑ |

---

## Mạch kiến thức xuyên suốt

Các buổi được thiết kế để **tham chiếu chéo lẫn nhau**. Một khái niệm xuất hiện lần đầu ở buổi này sẽ được gọi lại ở buổi sau:

| Khái niệm | Gieo ở | Thu hoạch ở |
|---|---|---|
| `Buffer.byteLength` vs `.length` | 01 | 06 (cắt ký tự UTF-8), Project 1 |
| Chặn Event Loop | 02 | 26 (background job) |
| Fail fast khi thiếu config | 03 | 38 (validate env trong Nest) |
| Bảng "framework không làm hộ" | 04 | 09 (retrospective), 10 (Express) |
| Thứ tự route | 05 | 10 (Express hành xử y hệt) |
| Xử lý lỗi tập trung | 05 | 11 (error middleware), 35 (Exception Filter) |
| Tách tầng service/repository | 09 | 34 (NestJS Service), 36 (mock DI) |
| Mass assignment | 09 | 22 (OWASP Top 10) |
| Graceful shutdown | 08 | 42 (deploy), 43 (health check) |
| Mã thoát (exit code) | 03 | 40 (CI đỏ/xanh), 41 (rollback) |
| Đo rồi mới kết luận | 02, 19 | 44 (ba lần đo sai) |
| Rate limit bằng `Map` | 11 | 21 (Redis), 44–45 (vì sao phải đẩy trạng thái ra ngoài) |
| Cache-aside | 21 | 44 (3.8× throughput), 45 (khi nào KHÔNG cache) |
| Transaction + khoá dòng | 19 | 45 (vì sao microservices làm nó khó) |
| Mã lỗi ổn định (`ma`) | 18 | 24, 46 (API contract), 47 (Capstone) |
| Toàn bộ khoá học | 01–47 | **48 (bảo vệ Capstone)** |
| Tách tầng, DI | 09, 28 | 49 (tự viết composition root — mở hộp NestJS) |
| JWT HS256 | 15 | 50 (RS256 + JWKS của nhà cung cấp) |
| Idempotency key | 24 | 26 (job), 51 (webhook), 53 (inbox) — **bốn lần, bốn tên** |
| Giới hạn song song | 07 | 20 (pool), 26 (concurrency), 52 (prefetch), 55 (pool bão hoà) |
| Observer / sự kiện | 49 (trong bộ nhớ) | 52 (RabbitMQ), 53 (outbox — sống sót khi chết) |
| `requestId` xuyên service | 43 | 54 (trace W3C xuyên RabbitMQ và outbox) |
| Đo rồi mới kết luận | 02, 19, 44 | **55 (một kết luận sai được trace và đo lại chặn đứng)** |

> **Lời khuyên khi dạy:** mỗi khi gặp một ô trong bảng trên, hãy nói rõ *"cái này ta đã gặp ở buổi X"* hoặc *"cái này sẽ quay lại ở buổi Y"*. Học viên nhớ theo mạch liên kết chứ không nhớ theo danh sách rời rạc.
