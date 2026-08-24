# Bài tập Module 13 — Spring Security & JWT

## Nhóm A — Làm quen Spring Security

**A1.** Thêm `spring-boot-starter-security` vào Library API. Khởi động và quan sát: mọi endpoint bị chặn, console in ra mật khẩu tạm. Đăng nhập bằng form mặc định.

**A2.** Cấu hình `SecurityFilterChain` cho phép `GET /api/v1/books/**` công khai, còn lại phải xác thực.

**A3.** Tạo 2 user in-memory (`user`/`admin`) bằng `InMemoryUserDetailsManager`, thử gọi API với từng user.

**A4.** In ra toàn bộ filter chain lúc khởi động (`logging.level.org.springframework.security: DEBUG`) và chỉ ra vị trí filter JWT của bạn sẽ chèn vào.

## Nhóm B — Mật khẩu & người dùng trong DB

**B1.** Tạo entity `User(id, email, password, fullName, roles, enabled, createdAt)` và `Role` (enum).

**B2.** Cài `UserDetailsService` nạp user từ DB, ánh xạ role sang `GrantedAuthority` (nhớ tiền tố `ROLE_`).

**B3.** Viết API đăng ký: validate email chưa tồn tại, băm mật khẩu bằng BCrypt, trả về `UserResponse` **không chứa** mật khẩu.

**B4.** Chứng minh BCrypt có salt: băm cùng một mật khẩu 3 lần, in ra 3 hash khác nhau, nhưng `matches()` vẫn đúng cả 3.

**B5.** Thêm quy tắc mật khẩu mạnh (≥ 8 ký tự, có chữ hoa, số, ký tự đặc biệt) bằng validator riêng.

## Nhóm C — JWT

**C1.** Viết `JwtService`: `generateAccessToken`, `generateRefreshToken`, `parse`, `isValid`, `extractUserId`.

**C2.** Viết `JwtAuthenticationFilter` extends `OncePerRequestFilter`, đặt trước `UsernamePasswordAuthenticationFilter`.

**C3.** Viết `POST /api/v1/auth/login` trả về `{ accessToken, refreshToken, expiresIn, tokenType: "Bearer" }`.

**C4.** Gọi API có token và không token, xác nhận trả về 200 / 401.

**C5.** Dán token vào https://jwt.io, đọc payload. **Rút ra kết luận**: viết vào README của bạn 3 loại dữ liệu tuyệt đối không được để trong JWT.

**C6.** Sửa một ký tự trong token rồi gọi API — xác nhận bị từ chối vì sai chữ ký.

**C7.** Đặt `access-minutes: 1`, chờ token hết hạn, xác nhận trả về 401 với thông báo rõ ràng.

**C8.** Viết `POST /api/v1/auth/refresh`: kiểm tra refresh token trong DB, cấp access token mới.

**C9.** Viết `POST /api/v1/auth/logout`: thu hồi refresh token (xóa/đánh dấu revoked trong DB). Giải thích vì sao không thể "hủy" access token đang còn hạn, và cách giảm thiểu rủi ro.

## Nhóm D — Phân quyền

**D1.** Cấu hình theo URL: `/api/v1/admin/**` chỉ `ADMIN`; `POST/PUT/DELETE /api/v1/books/**` chỉ `ADMIN` và `LIBRARIAN`; `GET` công khai.

**D2.** Dùng `@PreAuthorize` ở tầng service cho các thao tác nhạy cảm.

**D3.** Viết rule "chỉ sửa được hồ sơ của chính mình hoặc là admin":
```java
@PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
```

**D4.** Tái hiện lỗ hổng **IDOR**: user A xem được lượt mượn của user B qua id. Sau đó sửa lại cho đúng và viết test chứng minh đã chặn.

**D5.** Cấu hình trả về đúng **401** khi chưa đăng nhập và **403** khi thiếu quyền, với body theo định dạng `ErrorResponse` thống nhất của Module 11.

**D6.** Lấy user hiện tại bằng `@AuthenticationPrincipal`, ghi `createdBy` khi tạo bản ghi mới.

## Nhóm E — Bảo mật thực chiến

**E1.** Cấu hình CORS chỉ cho `http://localhost:3000`; chứng minh domain khác bị chặn.

**E2.** Thông báo đăng nhập sai: đảm bảo trả về **cùng một** thông báo cho "email không tồn tại" và "sai mật khẩu". Giải thích lỗ hổng liệt kê tài khoản.

**E3.** Giới hạn đăng nhập sai: 5 lần sai trong 15 phút thì khóa tạm. Cài bằng `ConcurrentHashMap` (hoặc Redis ở Module 14).

**E4.** Ẩn `password`, `refreshToken` khỏi mọi response bằng `@JsonIgnore`; viết test khẳng định response JSON không chứa chuỗi `"password"`.

**E5.** Đưa `app.jwt.secret` ra biến môi trường; chứng minh ứng dụng **không khởi động** nếu thiếu.

**E6.** Ghi log sự kiện bảo mật: đăng nhập thành công/thất bại, đổi mật khẩu, thay đổi quyền. Không được log mật khẩu hay token.

**E7.** Đọc **OWASP Top 10** và đối chiếu: API của bạn đã xử lý được bao nhiêu mục? Ghi lại danh sách.

## Nhóm F — Test

**F1.** Test 401 khi không có token, 403 khi sai quyền, 200 khi đủ quyền (dùng `@WithMockUser`).

**F2.** Test `JwtService`: token hợp lệ, token hết hạn, token sai chữ ký, token rỗng.

**F3.** Integration test toàn luồng: đăng ký → đăng nhập → gọi API có token → refresh → logout → token cũ bị từ chối.

**F4.** Viết `@WithMockUser` tùy chỉnh để test rule "chỉ sửa hồ sơ của mình".

## Nhóm G — Tổng hợp (bắt buộc)

**G1. Bảo mật hoàn chỉnh cho Library API:**
- Đăng ký / đăng nhập / refresh / logout / đổi mật khẩu.
- 3 vai trò: `USER` (xem sách, xem lượt mượn của mình), `LIBRARIAN` (quản lý sách, xử lý mượn/trả), `ADMIN` (toàn quyền + quản lý user).
- Kiểm tra quyền sở hữu bản ghi ở mọi endpoint có id.
- Đủ 12 mục trong danh sách kiểm tra bảo mật ở README.
- Swagger có nút "Authorize" để nhập Bearer token.
- Ít nhất 12 test bảo mật.

*Đạt khi*: bạn nhờ một người khác cố tình phá (gọi API không token, sửa token, xem dữ liệu người khác, gửi role ADMIN khi đăng ký) mà **không** lấy được gì.

---

## Câu hỏi phỏng vấn
1. Authentication khác Authorization? 401 khác 403?
2. Spring Security hoạt động thế nào (filter chain)?
3. JWT gồm mấy phần? Payload có được mã hóa không?
4. Vì sao access token nên ngắn hạn? Refresh token giải quyết gì?
5. Làm sao thu hồi một JWT đã cấp?
6. Vì sao dùng BCrypt mà không dùng SHA-256?
7. Salt là gì, dùng để làm gì?
8. CSRF là gì? Vì sao API dùng JWT thường tắt CSRF?
9. `hasRole("ADMIN")` khác `hasAuthority("ADMIN")` thế nào?
10. IDOR là gì? Chống bằng cách nào?
11. Session-based và token-based auth khác nhau ra sao? Ưu nhược điểm?
12. Kể 5 mục trong OWASP Top 10 và cách bạn xử lý trong Spring Boot.
