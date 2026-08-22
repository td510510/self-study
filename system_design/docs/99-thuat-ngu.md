# Bảng thuật ngữ Việt–Anh

> Khi giảng, hãy nói **tiếng Việt trước, tiếng Anh sau** — học viên cần hiểu khái niệm, nhưng cũng
> cần nhận ra từ tiếng Anh khi đọc tài liệu và đi phỏng vấn.

## Nền tảng

| Tiếng Anh | Tiếng Việt | Ghi chú |
|---|---|---|
| Latency | Độ trễ | Một request mất bao lâu |
| Throughput | Thông lượng | Bao nhiêu request/giây |
| QPS / RPS | Số truy vấn/giây | |
| Percentile (p50, p99) | Phân vị | p99 = 99% request nhanh hơn mức này |
| Tail latency | Độ trễ đuôi | Nhóm request chậm nhất |
| Bottleneck | Nút thắt cổ chai | |
| Saturation | Mức bão hoà | Tài nguyên đã dùng bao nhiêu % |
| Back-of-the-envelope | Ước lượng nhanh | |

## Mở rộng

| Tiếng Anh | Tiếng Việt |
|---|---|
| Vertical scaling / Scale up | Mở rộng theo chiều dọc (máy to hơn) |
| Horizontal scaling / Scale out | Mở rộng theo chiều ngang (nhiều máy hơn) |
| Stateless | Không giữ trạng thái |
| Sticky session | Phiên dính (luôn về cùng một server) |
| Load balancer | Bộ cân bằng tải |
| Health check | Kiểm tra sức khoẻ |
| Liveness / Readiness | Còn sống / Sẵn sàng nhận traffic |
| Auto-scaling | Tự động mở rộng |

## Cache

| Tiếng Anh | Tiếng Việt |
|---|---|
| Cache hit / miss | Trúng / trượt cache |
| Cache-aside | Ứng dụng tự quản cache |
| Write-through / Write-behind | Ghi xuyên / Ghi trễ |
| Eviction (LRU, LFU) | Loại bỏ khỏi cache |
| TTL (Time To Live) | Thời gian sống |
| Cache stampede / Thundering herd | Đàn bò húc cache |
| Cache invalidation | Vô hiệu hoá cache |
| Hot key | Khoá nóng |
| Stale data | Dữ liệu cũ |

## Database

| Tiếng Anh | Tiếng Việt |
|---|---|
| Index | Chỉ mục |
| Composite index | Chỉ mục tổ hợp |
| Covering index | Chỉ mục bao phủ |
| Selectivity | Độ chọn lọc |
| Full table scan | Quét toàn bảng |
| Transaction | Giao dịch |
| Isolation level | Mức cô lập |
| Dirty read / Phantom read | Đọc bẩn / Đọc bóng ma |
| Lost update | Mất cập nhật |
| Optimistic / Pessimistic lock | Khoá lạc quan / bi quan |
| Deadlock | Khoá chết |
| N+1 query | Truy vấn N+1 |
| Connection pool | Bể kết nối |
| Replication | Nhân bản |
| Replication lag | Độ trễ nhân bản |
| Primary / Replica | Bản chính / Bản sao |
| Failover | Chuyển đổi dự phòng |
| Sharding | Phân mảnh |
| Shard key | Khoá phân mảnh |
| Consistent hashing | Băm nhất quán |
| Virtual node (vnode) | Nút ảo |
| Hot spot | Điểm nóng |

## Bất đồng bộ

| Tiếng Anh | Tiếng Việt |
|---|---|
| Message queue | Hàng đợi tin nhắn |
| Producer / Consumer | Bên gửi / Bên nhận |
| Pub/Sub | Xuất bản / Đăng ký |
| At-least-once / At-most-once | Ít nhất một lần / Nhiều nhất một lần |
| Idempotent | Luỹ đẳng (làm nhiều lần cũng như một lần) |
| Dead Letter Queue (DLQ) | Hàng đợi thư chết |
| Poison message | Tin nhắn độc |
| Visibility timeout | Thời gian ẩn |
| Backpressure | Áp lực ngược |
| Transactional Outbox | Hộp thư đi giao dịch |
| Saga | Chuỗi giao dịch có bù trừ |
| Compensating action | Hành động bù trừ |
| Eventual consistency | Nhất quán cuối cùng |

## Độ tin cậy

| Tiếng Anh | Tiếng Việt |
|---|---|
| Timeout | Hết giờ chờ |
| Retry storm | Bão thử lại |
| Exponential backoff | Lùi theo cấp số nhân |
| Jitter | Nhiễu ngẫu nhiên |
| Circuit breaker | Cầu dao ngắt mạch |
| Bulkhead | Vách ngăn khoang |
| Rate limiting | Giới hạn tốc độ |
| Token bucket | Xô token |
| Load shedding | Xả tải |
| Graceful degradation | Suy giảm êm ái |
| Cascading failure | Sập dây chuyền |
| SPOF (Single Point of Failure) | Điểm chết đơn lẻ |
| Blast radius | Bán kính ảnh hưởng |

## Hệ phân tán

| Tiếng Anh | Tiếng Việt |
|---|---|
| Network partition | Phân vùng mạng |
| Split-brain | Não chẻ đôi (hai leader cùng lúc) |
| Quorum | Số lượng tối thiểu (đa số) |
| Consensus | Đồng thuận |
| Leader election | Bầu chọn leader |
| Clock skew | Lệch đồng hồ |
| Lamport / Vector clock | Đồng hồ logic / véc-tơ |
| Last Write Wins (LWW) | Ghi sau thắng |
| CRDT | Kiểu dữ liệu tự hội tụ |
| Linearizability | Tuyến tính hoá |
| Read-your-own-writes | Đọc được cái mình vừa ghi |
| Monotonic reads | Đọc đơn điệu (không thấy lùi) |

## Observability

| Tiếng Anh | Tiếng Việt |
|---|---|
| Structured logging | Ghi log có cấu trúc |
| Correlation ID / Request ID | Mã liên kết request |
| Distributed tracing | Truy vết phân tán |
| Span | Đoạn (một bước trong trace) |
| Cardinality | Số giá trị khác nhau (của nhãn metric) |
| Sampling | Lấy mẫu |
| SLI / SLO / SLA | Chỉ số / Mục tiêu / Cam kết mức dịch vụ |
| Error budget | Ngân sách lỗi |
| Alert fatigue | Mệt mỏi vì cảnh báo |
| Post-mortem | Báo cáo hậu sự cố |
| On-call | Trực hệ thống |

## Kiến trúc & Deploy

| Tiếng Anh | Tiếng Việt |
|---|---|
| Monolith / Modular monolith | Khối đơn / Khối đơn có module |
| Microservices | Vi dịch vụ |
| Distributed monolith | Khối đơn phân tán (phản mẫu) |
| Bounded context | Ngữ cảnh giới hạn |
| API Gateway | Cổng API |
| BFF (Backend for Frontend) | Backend riêng cho từng loại client |
| Service discovery | Khám phá dịch vụ |
| Service mesh | Lưới dịch vụ |
| Sidecar | Container phụ trợ |
| Rolling / Blue-Green / Canary | Cuốn chiếu / Xanh-Lam / Chim hoàng yến |
| Feature flag | Cờ tính năng |
| Expand/Contract migration | Di trú mở rộng rồi thu hẹp |
| Backward compatible | Tương thích ngược |

## Bảo mật

| Tiếng Anh | Tiếng Việt |
|---|---|
| Authentication (AuthN) | Xác thực (bạn là ai) |
| Authorization (AuthZ) | Phân quyền (bạn được làm gì) |
| IDOR | Tham chiếu đối tượng không an toàn |
| SSRF | Giả mạo request từ phía server |
| RBAC / ABAC / ReBAC | Phân quyền theo vai trò / thuộc tính / quan hệ |
| Least privilege | Đặc quyền tối thiểu |
| Defense in depth | Phòng thủ nhiều lớp |
| Multi-tenant | Đa khách hàng |
| Row Level Security | Bảo mật mức dòng |
| Redact | Che dữ liệu nhạy cảm |
