# notification-service

Service này **bạn tự viết** — xem đặc tả trong:
- [../docs/api-contracts.md](../docs/api-contracts.md) — endpoint, request/response, mã lỗi
- [../docs/events.md](../docs/events.md) — sự kiện Kafka phát/nhận
- [../docs/saga-order-flow.md](../docs/saga-order-flow.md) — luồng saga (nếu liên quan)

## Bắt đầu

1. Tạo project tại https://start.spring.io (Maven, Java 21, Spring Boot 3.3.x).
2. Copy cấu trúc package từ Dự án 2 (`controller / service / repository / domain / dto / exception`).
3. `Dockerfile` đã có sẵn trong thư mục này (multi-stage, chạy non-root).
4. Cấu hình đọc từ biến môi trường — xem phần `environment` của service này trong `../docker-compose.yml`.

## Yêu cầu chung cho mọi service

- `spring-boot-starter-actuator` với `/actuator/health` và `/actuator/prometheus`
- Flyway quản lý schema, `ddl-auto: validate`
- `GlobalExceptionHandler` trả `ErrorResponse` thống nhất
- Log JSON có `traceId` lấy từ header `X-Trace-Id`
- Graceful shutdown: `server.shutdown: graceful`
