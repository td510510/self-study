package com.learn.playground.m13security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Module 13 — cấu hình bảo mật.
 *
 * Trong sân tập này, các endpoint /m10, /m11, /m12, /m14 để mở cho dễ thử.
 * Chỉ /m13/** là được bảo vệ thật, để bạn thấy rõ 401 và 403 khác nhau ra sao.
 *
 * Ở dự án thật thì ngược lại: MẶC ĐỊNH CẤM, chỉ mở đúng những gì công khai
 * (xem SecurityConfig của Dự án 2).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity          // bật @PreAuthorize
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, ObjectMapper objectMapper) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.objectMapper = objectMapper;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                // API stateless dùng JWT trong header -> không có cookie phiên -> CSRF không áp dụng.
                // (Nếu bạn lưu JWT trong COOKIE thì CSRF quay lại thành vấn đề — đừng tắt mù quáng.)
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/m10/**", "/m11/**", "/m12/**", "/m14/**",
                                         "/api/v1/books/**", "/actuator/**", "/h2-console/**").permitAll()
                        .requestMatchers("/m13/login", "/m13/decode").permitAll()
                        .requestMatchers("/m13/admin").hasRole("ADMIN")   // hasRole tự thêm tiền tố ROLE_
                        .requestMatchers("/m13/**").authenticated()
                        .anyRequest().permitAll())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(this::unauthorized)     // 401: chưa đăng nhập
                        .accessDeniedHandler(this::forbidden))            // 403: thiếu quyền
                .headers(h -> h.frameOptions(f -> f.disable()))           // cho h2-console hiển thị
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    /** BCrypt: cố tình CHẬM và có salt riêng mỗi mật khẩu. Không bao giờ dùng SHA/MD5 cho mật khẩu. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    private void unauthorized(HttpServletRequest req, HttpServletResponse res,
                              org.springframework.security.core.AuthenticationException ex) throws IOException {
        write(res, 401, "UNAUTHORIZED",
                "Chưa đăng nhập hoặc token không hợp lệ. Lấy token ở POST /m13/login.", req.getRequestURI());
    }

    private void forbidden(HttpServletRequest req, HttpServletResponse res,
                           org.springframework.security.access.AccessDeniedException ex) throws IOException {
        write(res, 403, "FORBIDDEN",
                "Đã đăng nhập nhưng KHÔNG đủ quyền cho tài nguyên này.", req.getRequestURI());
    }

    private void write(HttpServletResponse res, int status, String code, String message, String path)
            throws IOException {
        res.setStatus(status);
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.setCharacterEncoding("UTF-8");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status);
        body.put("errorCode", code);
        body.put("message", message);
        body.put("path", path);
        body.put("ghi_chu", status == 401
                ? "401 = TÔI KHÔNG BIẾT BẠN LÀ AI"
                : "403 = TÔI BIẾT BẠN LÀ AI, NHƯNG BẠN KHÔNG ĐƯỢC PHÉP");
        objectMapper.writeValue(res.getWriter(), body);
    }
}
