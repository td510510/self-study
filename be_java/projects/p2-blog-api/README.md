# Dự án 2 — Blog REST API

> Làm sau Module 13. Đây là dự án bạn sẽ đưa vào CV: một REST API hoàn chỉnh, có xác thực,
> phân quyền, migration, test tự động và đóng gói Docker.

## Công nghệ

| Thành phần | Lựa chọn | Vì sao |
|---|---|---|
| Framework | Spring Boot 3.3 | chuẩn công nghiệp |
| Java | 21 (LTS) | virtual threads, record, pattern matching |
| DB | PostgreSQL 16 | mạnh, miễn phí, phổ biến ở dự án mới |
| ORM | Spring Data JPA / Hibernate | giảm code lặp, nhưng ta vẫn kiểm soát SQL |
| Migration | Flyway | schema có phiên bản, không dùng `ddl-auto=update` |
| Bảo mật | Spring Security 6 + JWT | stateless, scale ngang được |
| Tài liệu | springdoc-openapi | Swagger UI gọi thử API ngay |
| Test | JUnit 5, Mockito, Testcontainers | DB thật khi test tích hợp |

## Chạy trong 1 phút

```bash
cd projects/p2-blog-api
cp .env.example .env          # rồi sửa JWT_SECRET
docker compose up --build
```
- API: http://localhost:8080/api/v1/posts
- Swagger UI: http://localhost:8080/swagger-ui.html
- Health: http://localhost:8080/actuator/health

**Chạy khi đang phát triển** (chỉ DB trong Docker, ứng dụng chạy trong IDE):
```bash
docker compose up -d db
export JWT_SECRET="chuoi-bi-mat-that-dai-it-nhat-32-ky-tu"
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Chạy test**:
```bash
mvn test                       # cần Docker đang chạy cho test tích hợp
mvn test -Dtest=PostServiceTest       # chỉ unit test, không cần Docker
```

> **Chưa có Maven?** Dự án này chưa kèm sẵn Maven Wrapper (`mvnw`). Chọn một trong ba cách:
> 1. Cài Maven: `winget install Apache.Maven` (Windows) hoặc tải tại https://maven.apache.org/download.cgi
> 2. Mở thư mục này bằng **IntelliJ IDEA** — IDE có sẵn Maven, bấm ▶ là chạy.
> 3. Sinh wrapper một lần rồi commit vào repo (sau khi đã có Maven): `mvn wrapper:wrapper`
>    — từ đó về sau cả team dùng `./mvnw` mà không cần cài gì.

> ⚠ **Lưu ý trung thực về mã nguồn**: toàn bộ code ở đây được viết theo chuẩn Spring Boot 3.3
> nhưng **chưa từng được biên dịch/chạy** (lúc tạo dự án máy chưa cài Maven).
> Lần `mvn test` đầu tiên có thể phát sinh vài lỗi nhỏ (thiếu import, lệch version thư viện).
> Hãy coi đó là bài tập đầu tiên: đọc thông báo lỗi và tự sửa — đúng như công việc thật.

## Kiến trúc

```
com.learn.blog
├── BlogApiApplication
├── config/       SecurityConfig, OpenApiConfig
├── controller/   AuthController, PostController, CommentController   ← chỉ nhận/trả dữ liệu
├── service/      AuthService, PostService, CommentService            ← toàn bộ nghiệp vụ
├── repository/   *Repository (Spring Data JPA)                       ← truy cập dữ liệu
├── domain/       User, Post, Comment, Tag, RefreshToken, enum        ← entity + hành vi
├── dto/          request/response tách theo nhóm                     ← hợp đồng với client
├── security/     JwtService, JwtAuthenticationFilter, UserDetails
├── exception/    cây exception + GlobalExceptionHandler
└── util/         PasswordHashGenerator
```
Phụ thuộc một chiều: `controller → service → repository → domain`.
So với Dự án 1, cấu trúc **giống hệt** — chỉ thay `ConsoleUI` bằng `Controller` và `InMemoryRepository` bằng JPA.

## API

| Method | Endpoint | Quyền | Mô tả |
|---|---|---|---|
| POST | `/api/v1/auth/register` | công khai | Đăng ký (server luôn gán `ROLE_USER`) |
| POST | `/api/v1/auth/login` | công khai | Trả access token + refresh token |
| POST | `/api/v1/auth/refresh` | công khai | Cấp token mới, xoay vòng refresh token |
| POST | `/api/v1/auth/logout` | công khai | Thu hồi refresh token |
| POST | `/api/v1/auth/change-password` | đăng nhập | Đổi mật khẩu, thu hồi mọi phiên |
| GET | `/api/v1/auth/me` | đăng nhập | Thông tin bản thân |
| GET | `/api/v1/posts` | công khai | Danh sách bài đã xuất bản, phân trang + lọc |
| GET | `/api/v1/posts/{slug}` | công khai | Chi tiết (bản nháp chỉ tác giả/admin thấy) |
| GET | `/api/v1/posts/me` | đăng nhập | Bài của tôi, gồm cả nháp |
| POST | `/api/v1/posts` | đăng nhập | Tạo bài (DRAFT) |
| PATCH | `/api/v1/posts/{id}` | tác giả/admin | Cập nhật một phần |
| POST | `/api/v1/posts/{id}/publish` | tác giả/admin | Xuất bản |
| DELETE | `/api/v1/posts/{id}` | tác giả/admin | Xóa |
| GET | `/api/v1/posts/{id}/comments` | công khai | Bình luận kèm trả lời |
| POST | `/api/v1/posts/{id}/comments` | đăng nhập | Bình luận / trả lời |
| PATCH/DELETE | `/api/v1/comments/{id}` | chủ bình luận/admin | Sửa / xóa |

Thử nhanh bằng curl:
```bash
# 1. Đăng ký
curl -X POST localhost:8080/api/v1/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"a@blog.com","password":"MatKhau123","fullName":"Học Viên"}'

# 2. Lưu token rồi tạo bài viết
TOKEN=<accessToken vừa nhận>
curl -X POST localhost:8080/api/v1/posts -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Bài viết đầu tiên","content":"Nội dung đủ dài để qua validate","tags":["java"]}'
```

## Những điểm kỹ thuật đáng chú ý (đọc kỹ phần này)

1. **DTO tách khỏi Entity.** `RegisterRequest` không có trường `role` → client không thể tự phong mình làm admin (*mass assignment*). Response không bao giờ chứa `password`.
2. **Lỗi thống nhất.** Mọi lỗi đi qua `GlobalExceptionHandler`, trả về cùng cấu trúc `ErrorResponse` có `errorCode` và `traceId`. Lỗi 500 chỉ trả mã tra cứu, chi tiết nằm trong log.
3. **Kiểm tra quyền sở hữu ở server.** `PostService.loadOwned()` là chỗ duy nhất quyết định ai được sửa bài — controller không tự quyết. Bản nháp của người khác trả **404 chứ không phải 403** để không tiết lộ sự tồn tại.
4. **Chống N+1.** `@EntityGraph` cho danh sách, `JOIN FETCH` cho chi tiết, và bình luận + trả lời nạp bằng 2 query cố định thay vì N query.
5. **`JOIN FETCH` không đi cùng `Pageable`** — đó là lý do danh sách dùng `@EntityGraph` (xem comment trong `PostRepository`).
6. **Tăng lượt xem bằng UPDATE nguyên tử** ở DB, không đọc-cộng-ghi trong Java (tránh race condition — Module 06).
7. **Refresh token lưu DB** nên thu hồi được; access token ngắn hạn 15 phút. Mỗi lần refresh là xoay vòng token mới, dùng lại token cũ bị từ chối (*chống replay*).
8. **`open-in-view: false`** — bắt lỗi lazy loading lộ ra ngay lúc dev thay vì âm thầm sinh query trong lúc render.
9. **Flyway** giữ schema; `ddl-auto=validate` chỉ kiểm tra entity khớp bảng.
10. **Dockerfile 2 giai đoạn**, chạy bằng user không phải root, `MaxRAMPercentage` thay cho `-Xmx` cố định (Module 07).

## Checklist tự chấm

**Chức năng**
- [ ] Đăng ký / đăng nhập / refresh / logout / đổi mật khẩu chạy đúng
- [ ] CRUD bài viết + luồng trạng thái DRAFT → PUBLISHED → ARCHIVED
- [ ] Bình luận 1 cấp, chỉ trên bài đã xuất bản
- [ ] Phân trang, tìm kiếm theo từ khóa và theo tag

**Chất lượng**
- [ ] Không endpoint nào trả về entity
- [ ] Mọi lỗi trả về đúng status code và đúng cấu trúc `ErrorResponse`
- [ ] Không lỗi N+1 (kiểm chứng bằng `show-sql`, đếm số câu SQL)
- [ ] Test: ≥ 15 unit test + ≥ 8 integration test, đều xanh
- [ ] Swagger mô tả đủ mọi endpoint

**Bảo mật**
- [ ] Không token → 401; sai quyền → 403
- [ ] Không sửa/xóa được dữ liệu của người khác (thử bằng 2 tài khoản)
- [ ] Gửi `role: ADMIN` khi đăng ký vẫn chỉ ra `ROLE_USER`
- [ ] Response không chứa chuỗi `password` ở bất kỳ đâu
- [ ] Secret nằm trong biến môi trường, `.env` đã bị `.gitignore`

## Nâng cấp tiếp (chọn 3–4 cái làm)

1. Tải ảnh đại diện / ảnh bìa bài viết (lưu local hoặc S3/MinIO).
2. Tìm kiếm toàn văn bằng `tsvector` của PostgreSQL.
3. Cache danh sách bài viết bằng Redis (Module 14).
4. Gửi email xác thực tài khoản qua hàng đợi (Module 14).
5. Rate limit 100 request/phút/IP.
6. Soft delete + endpoint khôi phục.
7. Endpoint thống kê cho tác giả (lượt xem theo ngày) — tính bằng SQL, không tính trong Java.
8. CI GitHub Actions chạy test + build image (Module 15).

Xong dự án này bạn đã đủ khả năng nhận việc Junior Java Backend.
👉 Tiếp: [Module 14 — Cache & Messaging](../../14-cache-redis-messaging/)
