package com.learn.blog.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learn.blog.dto.common.ErrorResponse;
import com.learn.blog.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

/**
 * Cấu hình bảo mật.
 *
 * Nguyên tắc: MẶC ĐỊNH CẤM (anyRequest().authenticated()), chỉ mở ra đúng những gì công khai.
 * Thứ tự requestMatchers quan trọng — quy tắc khớp đầu tiên sẽ thắng.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity            // bật @PreAuthorize
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ObjectMapper objectMapper;

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                // API stateless dùng JWT trong header -> không có cookie phiên -> CSRF không áp dụng
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // --- công khai ---
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/posts/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/tags/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        // --- chỉ admin ---
                        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        // --- còn lại phải đăng nhập ---
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(this::writeUnauthorized)   // 401
                        .accessDeniedHandler(this::writeForbidden))          // 403
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    /** BCrypt cost 12: đủ chậm để chống dò, đủ nhanh cho người dùng thật. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);          // KHÔNG dùng "*" ở production
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-Id"));
        config.setExposedHeaders(List.of("Location"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    // ---- Trả lỗi 401/403 theo đúng định dạng ErrorResponse của toàn hệ thống ----
    private void writeUnauthorized(jakarta.servlet.http.HttpServletRequest request,
                                   HttpServletResponse response,
                                   org.springframework.security.core.AuthenticationException ex)
            throws IOException {
        write(response, HttpServletResponse.SC_UNAUTHORIZED, "UNAUTHORIZED",
                "Bạn cần đăng nhập để thực hiện thao tác này", request.getRequestURI());
    }

    private void writeForbidden(jakarta.servlet.http.HttpServletRequest request,
                                HttpServletResponse response,
                                org.springframework.security.access.AccessDeniedException ex)
            throws IOException {
        write(response, HttpServletResponse.SC_FORBIDDEN, "FORBIDDEN",
                "Bạn không có quyền thực hiện thao tác này", request.getRequestURI());
    }

    private void write(HttpServletResponse response, int status, String code, String message, String path)
            throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        ErrorResponse body = new ErrorResponse(
                Instant.now(), status,
                status == 401 ? "Unauthorized" : "Forbidden",
                code, message, path, null, null);
        objectMapper.writeValue(response.getWriter(), body);
    }
}
