# Module 13 — Spring Security & JWT

> Mục tiêu: bảo vệ API bằng xác thực và phân quyền đúng cách, hiểu luồng chạy của Spring Security thay vì copy-paste cấu hình.
> Thời lượng: 1 tuần.

---

## 1. Hai khái niệm luôn bị nhầm

| | Authentication (xác thực) | Authorization (phân quyền) |
|---|---|---|
| Câu hỏi | **Bạn là ai?** | **Bạn được làm gì?** |
| Kiểm tra | email + mật khẩu, token | vai trò, quyền hạn |
| Lỗi trả về | **401** Unauthorized | **403** Forbidden |

## 2. Spring Security hoạt động thế nào

Spring Security là một **chuỗi filter** đứng trước Controller:

```
HTTP request
    ↓
[ SecurityFilterChain ]
    ├─ CorsFilter
    ├─ CsrfFilter
    ├─ JwtAuthenticationFilter        ← filter bạn tự viết
    ├─ UsernamePasswordAuthenticationFilter
    ├─ ExceptionTranslationFilter     ← đổi exception thành 401/403
    └─ AuthorizationFilter            ← kiểm tra quyền
    ↓
DispatcherServlet → Controller
```

Ba đối tượng cốt lõi:
- **`Authentication`**: thông tin người đang đăng nhập (principal, credentials, authorities).
- **`SecurityContextHolder`**: nơi lưu `Authentication` — bên trong là một `ThreadLocal` (nhớ Module 07: `ThreadLocal` trong thread pool phải được dọn — Spring tự làm việc đó).
- **`UserDetailsService`**: nạp thông tin người dùng từ DB.

## 3. Mã hóa mật khẩu

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);      // 12 = độ mạnh, càng cao càng chậm
}

// Đăng ký
user.setPassword(passwordEncoder.encode(rawPassword));

// Đăng nhập
passwordEncoder.matches(rawPassword, user.getPassword());
```

Ba điều bắt buộc:
1. **Không bao giờ lưu mật khẩu dạng thô** — kể cả "chỉ để test".
2. **Không dùng MD5/SHA-1/SHA-256 trần** — chúng được thiết kế để *nhanh*, nghĩa là kẻ tấn công cũng dò nhanh. BCrypt/Argon2 cố tình chậm và có salt.
3. BCrypt tự sinh salt riêng cho mỗi mật khẩu — cùng một mật khẩu, hai người dùng có hash khác nhau.

## 4. JWT là gì

JSON Web Token gồm 3 phần ngăn bằng dấu chấm:
```
eyJhbGciOiJIUzI1NiJ9  .  eyJzdWIiOiIxIiwicm9sZSI6IlVTRVIifQ  .  chu_ky
     Header                        Payload                        Signature
   (thuật toán)               (dữ liệu, KHÔNG mã hóa)       (chống sửa đổi)
```

> ⚠ **Payload chỉ được mã hóa base64, ai cũng đọc được.** Dán token vào https://jwt.io là thấy hết nội dung. **Không bao giờ để mật khẩu, số thẻ, hay dữ liệu nhạy cảm trong JWT.** Chữ ký chỉ đảm bảo *không sửa được*, không đảm bảo *bí mật*.

**Vì sao dùng JWT?** Server không cần lưu session → mọi instance đều xác thực được token → scale ngang dễ dàng (nhớ nguyên tắc stateless ở Module 11).

**Nhược điểm**: đã phát hành thì không thu hồi được cho tới khi hết hạn. Vì vậy:
- Access token **thời hạn ngắn** (15 phút).
- Refresh token thời hạn dài (7–30 ngày), **lưu trong DB/Redis** để có thể thu hồi.

## 5. Luồng xác thực JWT

```
1. POST /api/v1/auth/login {email, password}
        ↓ kiểm tra mật khẩu bằng BCrypt
2. Server trả { accessToken (15 phút), refreshToken (7 ngày) }
        ↓
3. Client gửi mọi request kèm header:
   Authorization: Bearer <accessToken>
        ↓
4. JwtAuthenticationFilter: kiểm tra chữ ký + hạn dùng
        ↓ hợp lệ
5. Đưa Authentication vào SecurityContextHolder
        ↓
6. Controller chạy, biết được người dùng là ai

Khi access token hết hạn:
7. POST /api/v1/auth/refresh {refreshToken} → cấp access token mới
```

## 6. Cài đặt

### 6.1 Dependency
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

### 6.2 JwtService
```java
@Service
public class JwtService {

    private final SecretKey key;
    private final long accessMinutes;
    private final long refreshDays;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.access-minutes:15}") long accessMinutes,
                      @Value("${app.jwt.refresh-days:7}") long refreshDays) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));  // >= 32 ký tự
        this.accessMinutes = accessMinutes;
        this.refreshDays = refreshDays;
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("roles", user.getRoles().stream().map(Role::name).toList())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {          // ném JwtException nếu sai chữ ký/hết hạn
        return Jwts.parser().verifyWith(key).build()
                   .parseSignedClaims(token).getPayload();
    }

    public boolean isValid(String token) {
        try { parse(token); return true; }
        catch (JwtException | IllegalArgumentException e) { return false; }
    }
}
```

### 6.3 Filter
```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);          // không có token -> để filter sau xử lý
            return;
        }

        String token = header.substring(7);
        try {
            Claims claims = jwtService.parse(token);
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails user = userDetailsService.loadUserByUsername(claims.get("email", String.class));
                var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (JwtException e) {
            // Không ném ra ngoài: để request đi tiếp và bị chặn ở AuthorizationFilter -> 401
            logger.debug("Token không hợp lệ: " + e.getMessage());
        }
        chain.doFilter(request, response);
    }
}
```

### 6.4 SecurityConfig
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity                        // bật @PreAuthorize
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())                      // API stateless dùng JWT -> không cần CSRF
            .cors(Customizer.withDefaults())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**", "/actuator/health").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/books/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())                  // mặc định: phải đăng nhập
            .exceptionHandling(e -> e
                .authenticationEntryPoint(this::unauthorized)   // 401 khi chưa xác thực
                .accessDeniedHandler(this::forbidden))          // 403 khi thiếu quyền
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }

    @Bean public AuthenticationManager authenticationManager(AuthenticationConfiguration c) throws Exception {
        return c.getAuthenticationManager();
    }
}
```

> Thứ tự khai báo `requestMatchers` **rất quan trọng** — quy tắc đầu tiên khớp sẽ thắng. Luôn đặt `anyRequest().authenticated()` ở cuối, và mặc định là **cấm**, chỉ mở ra những gì thật sự công khai.

### 6.5 Phân quyền ở mức method
```java
@PreAuthorize("hasRole('ADMIN')")
public void deleteBook(Long id) { }

@PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
public void updateBook(Long id) { }

// Chỉ cho sửa hồ sơ của chính mình
@PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
public void updateProfile(Long userId, UpdateRequest req) { }
```

Lấy người dùng hiện tại trong controller:
```java
@GetMapping("/me")
public UserResponse me(@AuthenticationPrincipal UserDetails principal) {
    return userService.getByEmail(principal.getUsername());
}
```

## 7. `ROLE_` và authority — nguồn nhầm lẫn kinh điển

```java
hasRole("ADMIN")        // Spring TỰ THÊM tiền tố -> tìm authority "ROLE_ADMIN"
hasAuthority("ROLE_ADMIN")   // tương đương dòng trên
hasAuthority("book:delete")  // quyền chi tiết, không có tiền tố
```
Trong DB nên lưu `ROLE_ADMIN`, `ROLE_USER`. Nếu lưu `ADMIN` mà dùng `hasRole("ADMIN")` thì sẽ luôn bị 403 mà không hiểu vì sao.

## 8. Danh sách kiểm tra bảo mật

- [ ] Mật khẩu băm bằng BCrypt (chi phí ≥ 10)
- [ ] JWT secret ≥ 32 ký tự, nằm trong **biến môi trường**, không nằm trong git
- [ ] Access token ngắn hạn + refresh token thu hồi được
- [ ] HTTPS ở production (JWT trên HTTP là gửi token dạng trần)
- [ ] **Không** để dữ liệu nhạy cảm trong payload JWT
- [ ] CORS chỉ mở cho domain cụ thể, không dùng `*`
- [ ] Không lộ thông tin qua thông báo lỗi: đăng nhập sai luôn trả "Email hoặc mật khẩu không đúng" (đừng nói "email không tồn tại" — đó là lỗ hổng liệt kê tài khoản)
- [ ] Giới hạn số lần đăng nhập sai (rate limit / khóa tạm)
- [ ] Validate mọi đầu vào (Module 11), dùng `PreparedStatement`/JPA (Module 08) chống SQL Injection
- [ ] `@PreAuthorize` cho mọi endpoint nhạy cảm, kiểm tra cả **quyền sở hữu dữ liệu** (user A không được xem đơn hàng của user B)
- [ ] Ghi log các sự kiện bảo mật (đăng nhập thất bại, đổi mật khẩu, cấp quyền)
- [ ] Không trả về `password`, `refreshToken` trong bất kỳ response nào (`@JsonIgnore`)

### Lỗi phổ biến: IDOR
```java
// ❌ Ai biết id là xem được đơn của người khác
@GetMapping("/orders/{id}")
public OrderResponse get(@PathVariable Long id) { return service.findById(id); }

// ✅ Kiểm tra quyền sở hữu
@GetMapping("/orders/{id}")
public OrderResponse get(@PathVariable Long id, @AuthenticationPrincipal AppUser me) {
    return service.findByIdForUser(id, me.getId());     // không phải của mình -> 404/403
}
```
Đây là lỗ hổng phổ biến nhất trong các API thực tế. Xác thực đúng vẫn chưa đủ — phải kiểm tra **quyền trên từng bản ghi**.

## 9. Test bảo mật

```java
@SpringBootTest
@AutoConfigureMockMvc
class SecurityIT {

    @Autowired MockMvc mockMvc;

    @Test
    void khongCoToken_tra401() throws Exception {
        mockMvc.perform(get("/api/v1/loans")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    void userThuong_goiApiAdmin_tra403() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/users/1")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_goiApiAdmin_tra200() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")).andExpect(status().isOk());
    }
}
```

---

## Tổng kết
- Authentication (401) khác Authorization (403).
- Spring Security là chuỗi filter; bạn chèn `JwtAuthenticationFilter` vào đúng chỗ.
- BCrypt cho mật khẩu; JWT payload **không bí mật**.
- Access token ngắn + refresh token thu hồi được.
- Mặc định cấm, chỉ mở endpoint công khai; `@PreAuthorize` cho quyền chi tiết.
- Luôn kiểm tra quyền sở hữu bản ghi (chống IDOR).

## Bài tập
👉 [bai-tap.md](bai-tap.md), sau đó bắt tay vào **[Dự án 2 — Blog REST API](../projects/p2-blog-api/)**.
