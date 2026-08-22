# Khoá học System Design cho Dev JavaScript

Giáo trình **15 buổi (~2h/buổi)** dạy System Design từ số 0, dành cho dev junior/fresher đã biết
JavaScript. Mỗi buổi gồm: lý thuyết có sơ đồ, **lab code chạy được bằng Node.js thuần**, bài tập về
nhà và bộ câu hỏi kiểm tra.

## Triết lý của khoá học

> System Design **không phải** là học thuộc tên công nghệ. Nó là kỹ năng **đánh đổi có lý do**.

Vì vậy mọi buổi học đều theo cùng một khuôn:

1. **Vấn đề đau** — hệ thống hỏng như thế nào nếu không có kỹ thuật này.
2. **Giải pháp** — ý tưởng cốt lõi, vẽ ra được trên giấy.
3. **Lab** — tự tay code lại phiên bản mini bằng JavaScript, nhìn thấy số liệu.
4. **Cái giá phải trả** — kỹ thuật này làm hệ thống phức tạp/chậm/sai ở đâu.

Học viên không cần cài Docker, Kafka, Redis hay Postgres. **Tất cả lab đều mô phỏng bằng Node.js
thuần** để nhìn rõ *cơ chế*, không bị che bởi thư viện.

## Yêu cầu môi trường

- Node.js **>= 18** (dùng `fetch`, `node:test`, `crypto.subtle` có sẵn)
- Không cần cài package nào (`npm install` không bắt buộc)
- Kiểm tra nhanh:

```bash
node --version   # v18.x trở lên
npm run check    # chạy thử 1 lab siêu ngắn
```

## Lộ trình

| Buổi | Chủ đề | Lab |
|---|---|---|
| [01](docs/01-nhap-mon-tu-duy-thiet-ke.md) | Nhập môn: tư duy đánh đổi & khung 4 bước | `labs/lab01-khung-thiet-ke` |
| [02](docs/02-client-server-http-api.md) | Client–Server, HTTP, thiết kế API | `labs/lab02-http-api` |
| [03](docs/03-do-luong-va-uoc-luong.md) | Latency, throughput, ước lượng dung lượng | `labs/lab03-do-luong` |
| [04](docs/04-scaling-va-load-balancer.md) | Scale ngang/dọc, stateless, load balancer | `labs/lab04-load-balancer` |
| [05](docs/05-caching.md) | Caching: LRU, cache-aside, CDN, stampede | `labs/lab05-cache` |
| [06](docs/06-database-1-quan-he-index-transaction.md) | Database I: quan hệ, index, transaction | `labs/lab06-index-transaction` |
| [07](docs/07-database-2-replication-sharding-nosql.md) | Database II: replication, sharding, NoSQL | `labs/lab07-sharding-replication` |
| [08](docs/08-bat-dong-bo-message-queue.md) | Bất đồng bộ: queue, worker, idempotency | `labs/lab08-message-queue` |
| [09](docs/09-do-tin-cay-retry-circuit-breaker.md) | Độ tin cậy: timeout, retry, circuit breaker, rate limit | `labs/lab09-resilience` |
| [10](docs/10-he-phan-tan-cap-consensus.md) | Hệ phân tán: CAP, đồng hồ, bầu leader | `labs/lab10-phan-tan` |
| [11](docs/11-luu-tru-file-va-tim-kiem.md) | Lưu trữ file, object storage, search engine | `labs/lab11-search` |
| [12](docs/12-observability-slo.md) | Observability: log, metric, trace, SLO | `labs/lab12-observability` |
| [13](docs/13-bao-mat-va-multi-tenant.md) | Bảo mật: authn/authz, JWT, multi-tenant | `labs/lab13-auth` |
| [14](docs/14-kien-truc-monolith-microservices.md) | Monolith → microservices, gateway, deploy | `labs/lab14-gateway` |
| [15](docs/15-case-study-va-phong-van.md) | Case study tổng hợp + mock interview | `labs/lab15-case-study` |

Phụ lục:

- [Hướng dẫn cho giảng viên](docs/00-huong-dan-giang-vien.md) — phân bổ thời gian, bẫy hay gặp khi dạy
- [Hướng dẫn chung cho lab](labs/README.md) — cách chạy, kết quả tham khảo để đối chiếu
- [Cheat sheet phỏng vấn](docs/98-cheatsheet.md) — in ra dán tường
- [Bảng thuật ngữ Việt–Anh](docs/99-thuat-ngu.md)

## Cách chạy lab

Mỗi lab là một thư mục độc lập, có `README.md` riêng và chạy bằng:

```bash
node labs/lab05-cache/01-lru.js
```

Một số lab có bài tập dạng "điền vào chỗ trống": file `*.todo.js` là bản cho học viên,
`*.solution.js` là đáp án cho giảng viên.

## Bản quyền & sử dụng lại

Tự do dùng lại để giảng dạy. Nếu chỉnh sửa, giữ nguyên phần "Cái giá phải trả" của mỗi buổi —
đó là phần khiến khoá này khác với việc đọc blog.
