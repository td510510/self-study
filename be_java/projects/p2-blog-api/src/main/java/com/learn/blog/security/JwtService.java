package com.learn.blog.security;

import com.learn.blog.domain.Role;
import com.learn.blog.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Sinh và kiểm tra JWT.
 *
 * Nhắc lại điều quan trọng nhất: payload của JWT chỉ được mã hoá base64,
 * AI CŨNG ĐỌC ĐƯỢC. Chỉ đặt vào đây dữ liệu không nhạy cảm (id, email, roles).
 */
@Service
@Slf4j
public class JwtService {

    private final SecretKey key;
    private final long accessMinutes;
    private final long refreshDays;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.access-minutes:15}") long accessMinutes,
                      @Value("${app.jwt.refresh-days:7}") long refreshDays) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                    "app.jwt.secret phải có ít nhất 32 ký tự. Hãy đặt biến môi trường JWT_SECRET.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessMinutes = accessMinutes;
        this.refreshDays = refreshDays;
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("roles", user.getRoles().stream().map(Role::name).toList())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    /** Refresh token chỉ là chuỗi ngẫu nhiên — giá trị thật nằm ở bản ghi trong DB. */
    public String generateRefreshTokenValue() {
        return UUID.randomUUID() + "-" + UUID.randomUUID();
    }

    public Instant refreshTokenExpiry() {
        return Instant.now().plus(refreshDays, ChronoUnit.DAYS);
    }

    public long accessTokenExpiresInSeconds() { return accessMinutes * 60; }

    /** Ném JwtException nếu sai chữ ký, hết hạn, hoặc sai định dạng. */
    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }

    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Token không hợp lệ: {}", e.getMessage());
            return false;
        }
    }

    public Long extractUserId(String token) { return Long.valueOf(parse(token).getSubject()); }

    public String extractEmail(String token) { return parse(token).get("email", String.class); }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) { return parse(token).get("roles", List.class); }
}
