package com.learn.playground.m13security;

import com.learn.playground.m13security.JwtAuthFilter.AppUser;
import io.jsonwebtoken.Claims;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Module 13 — demo xác thực, phân quyền và lỗ hổng IDOR.
 *
 * Thử theo đúng thứ tự này:
 *   1. GET  /m13/me                       -> 401 (chưa có token)
 *   2. POST /m13/login {"username":"an","password":"123456"}
 *   3. GET  /m13/me       kèm header Authorization: Bearer <token>
 *   4. GET  /m13/admin    với token của 'an' -> 403 (không đủ quyền)
 *   5. Đăng nhập bằng 'admin'/'123456' rồi gọi lại /m13/admin -> 200
 *   6. GET  /m13/orders/2 bằng token của 'an' -> 404 (đơn của người khác)
 *   7. GET  /m13/decode?token=... -> thấy payload JWT ai cũng đọc được
 */
@RestController
@RequestMapping("/m13")
public class M13Controller {

    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    /** "DB" người dùng giả lập: mật khẩu đều là 123456, đã băm BCrypt lúc khởi động. */
    private final Map<String, DemoUser> users;

    public M13Controller(JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.users = Map.of(
                "an", new DemoUser(1L, "an", passwordEncoder.encode("123456"), List.of("ROLE_USER")),
                "binh", new DemoUser(2L, "binh", passwordEncoder.encode("123456"), List.of("ROLE_USER")),
                "admin", new DemoUser(9L, "admin", passwordEncoder.encode("123456"),
                        List.of("ROLE_USER", "ROLE_ADMIN")));
    }

    record DemoUser(Long id, String username, String passwordHash, List<String> roles) { }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) { }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest request) {
        DemoUser user = users.get(request.username());

        // ⚠ Thông báo lỗi PHẢI GIỐNG NHAU cho "sai tên" và "sai mật khẩu".
        // Nếu khác nhau, kẻ tấn công dò được tài khoản nào đang tồn tại.
        if (user == null || !passwordEncoder.matches(request.password(), user.passwordHash())) {
            Map<String, Object> r = new LinkedHashMap<>();
            r.put("error", "Tên đăng nhập hoặc mật khẩu không đúng");
            r.put("goi_y", "Tài khoản demo: an / binh / admin — mật khẩu đều là 123456");
            return r;
        }

        String token = jwtService.generate(user.id(), user.username(), user.roles());

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("accessToken", token);
        r.put("tokenType", "Bearer");
        r.put("expiresInSeconds", jwtService.expiresInSeconds());
        r.put("roles", user.roles());
        r.put("cach_dung", "Thêm header:  Authorization: Bearer " + token.substring(0, 20) + "...");
        return r;
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal AppUser me) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("userId", me.id());
        r.put("username", me.username());
        r.put("roles", me.roles());
        r.put("ghi_chu", "Principal này do JwtAuthFilter đặt vào SecurityContextHolder");
        return r;
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")     // lớp bảo vệ thứ 2, ngoài cấu hình theo URL
    public Map<String, Object> admin(@AuthenticationPrincipal AppUser me) {
        return Map.of(
                "message", "Chào admin " + me.username(),
                "ghi_chu", "hasRole('ADMIN') tìm authority 'ROLE_ADMIN' — Spring tự thêm tiền tố. "
                        + "Lưu DB là 'ADMIN' mà dùng hasRole('ADMIN') sẽ luôn 403.");
    }

    /**
     * Demo IDOR — lỗ hổng phổ biến nhất trong API thực tế.
     *
     * Xác thực đúng người VẪN CHƯA ĐỦ: phải kiểm tra quyền sở hữu TỪNG BẢN GHI.
     * Ở đây trả 404 thay vì 403 để không tiết lộ rằng đơn hàng đó có tồn tại.
     */
    @GetMapping("/orders/{id}")
    public Map<String, Object> getOrder(@PathVariable Long id, @AuthenticationPrincipal AppUser me) {
        Optional<DemoOrder> order = DEMO_ORDERS.stream().filter(o -> o.id().equals(id)).findFirst();

        Map<String, Object> r = new LinkedHashMap<>();
        if (order.isEmpty() || (!order.get().ownerId().equals(me.id()) && !me.isAdmin())) {
            r.put("status", 404);
            r.put("message", "Không tìm thấy đơn hàng " + id);
            r.put("bai_hoc", "Đơn này có thể TỒN TẠI nhưng thuộc người khác. "
                    + "Trả 404 thay vì 403 để không tiết lộ sự tồn tại của nó.");
            return r;
        }
        r.put("don_hang", order.get());
        r.put("bai_hoc", "Server tự xác định chủ sở hữu từ token, KHÔNG tin userId client gửi lên.");
        return r;
    }

    record DemoOrder(Long id, Long ownerId, String product, long amount) { }

    private static final List<DemoOrder> DEMO_ORDERS = List.of(
            new DemoOrder(1L, 1L, "Laptop Dell", 22_000_000),
            new DemoOrder(2L, 2L, "MacBook Air", 35_000_000),
            new DemoOrder(3L, 1L, "Bàn phím cơ", 1_200_000));

    /** Giải mã payload JWT KHÔNG cần secret — để bạn tự thấy nó không hề bí mật. */
    @GetMapping("/decode")
    public Map<String, Object> decode(@RequestParam String token) {
        Map<String, Object> r = new LinkedHashMap<>();
        try {
            String[] parts = token.split("\\.");
            r.put("header (base64 giải mã)", new String(Base64.getUrlDecoder().decode(parts[0])));
            r.put("payload (base64 giải mã)", new String(Base64.getUrlDecoder().decode(parts[1])));
            r.put("chu_ky", parts[2].substring(0, Math.min(16, parts[2].length())) + "...");
            r.put("KET_LUAN", "Payload đọc được mà KHÔNG cần secret. "
                    + "Chữ ký chỉ chống SỬA, không chống ĐỌC. "
                    + "Tuyệt đối không để mật khẩu / số thẻ / dữ liệu nhạy cảm trong JWT.");

            Claims claims = jwtService.parse(token);
            r.put("het_han_luc", claims.getExpiration().toString());
        } catch (Exception e) {
            r.put("loi", "Token không hợp lệ: " + e.getMessage());
        }
        return r;
    }
}
