package com.learn.blog.service;

import com.learn.blog.domain.RefreshToken;
import com.learn.blog.domain.Role;
import com.learn.blog.domain.User;
import com.learn.blog.dto.auth.AuthResponse;
import com.learn.blog.dto.auth.LoginRequest;
import com.learn.blog.dto.auth.RegisterRequest;
import com.learn.blog.dto.common.UserSummary;
import com.learn.blog.exception.ConflictException;
import com.learn.blog.exception.UnauthorizedException;
import com.learn.blog.repository.RefreshTokenRepository;
import com.learn.blog.repository.UserRepository;
import com.learn.blog.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Đăng ký, đăng nhập, refresh, đăng xuất.
 *
 * Các quyết định bảo mật trong class này:
 *  - Mật khẩu băm BCrypt, không bao giờ log hay trả về.
 *  - Thông báo đăng nhập sai luôn GIỐNG NHAU cho "email không tồn tại" và "sai mật khẩu"
 *    (nếu khác nhau, kẻ tấn công dò được email nào đã đăng ký).
 *  - Refresh token lưu DB để có thể thu hồi; mỗi lần refresh thì xoay vòng token mới.
 *  - Chặn brute force bằng bộ đếm số lần sai.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCK_MINUTES = 15;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    /**
     * Bộ đếm đăng nhập sai. ConcurrentHashMap vì bean là singleton, nhiều request chạy song song
     * (Module 06). Chạy nhiều instance thì phải chuyển sang Redis — xem Module 14.
     */
    private final ConcurrentHashMap<String, AtomicInteger> failedAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Instant> lockedUntil = new ConcurrentHashMap<>();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().toLowerCase().trim();

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email đã được sử dụng: " + email);
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));   // BĂM, không lưu thô
        user.setFullName(request.fullName().trim());
        user.addRole(Role.ROLE_USER);        // vai trò do SERVER quyết định, không nhận từ client

        User saved = userRepository.save(user);
        log.info("Đăng ký tài khoản mới: {}", email);

        return issueTokens(saved);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email().toLowerCase().trim();
        checkNotLocked(email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    recordFailure(email);
                    return new UnauthorizedException("Email hoặc mật khẩu không đúng");
                });

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            recordFailure(email);
            throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
        }
        if (!user.isEnabled()) {
            throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
        }

        failedAttempts.remove(email);
        lockedUntil.remove(email);
        log.info("Đăng nhập thành công: {}", email);

        return issueTokens(user);
    }

    /** Xoay vòng refresh token: cấp cặp token mới và thu hồi token cũ. */
    @Transactional
    public AuthResponse refresh(String refreshTokenValue) {
        RefreshToken stored = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new UnauthorizedException("Refresh token không hợp lệ"));

        if (!stored.isUsable()) {
            throw new UnauthorizedException("Refresh token đã hết hạn hoặc bị thu hồi");
        }

        stored.revoke();
        refreshTokenRepository.save(stored);

        return issueTokens(stored.getUser());
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenRepository.findByToken(refreshTokenValue).ifPresent(token -> {
            token.revoke();
            refreshTokenRepository.save(token);
            log.info("Đăng xuất user id={}", token.getUser().getId());
        });
        // Không báo lỗi nếu token không tồn tại: logout phải luôn "thành công" với client.
    }

    /** Đổi mật khẩu -> thu hồi TOÀN BỘ phiên đăng nhập trên mọi thiết bị. */
    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Phiên đăng nhập không hợp lệ"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new UnauthorizedException("Mật khẩu hiện tại không đúng");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        int revoked = refreshTokenRepository.revokeAllByUser(userId);
        log.info("Đổi mật khẩu user id={}, thu hồi {} refresh token", userId, revoked);
    }

    // ------------------------------------------------------------ nội bộ
    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user);

        RefreshToken refreshToken = new RefreshToken(
                jwtService.generateRefreshTokenValue(), user, jwtService.refreshTokenExpiry());
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.of(accessToken, refreshToken.getToken(),
                jwtService.accessTokenExpiresInSeconds(), UserSummary.from(user));
    }

    private void checkNotLocked(String email) {
        Instant until = lockedUntil.get(email);
        if (until != null) {
            if (until.isAfter(Instant.now())) {
                throw new UnauthorizedException(
                        "Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau ít phút.");
            }
            lockedUntil.remove(email);
            failedAttempts.remove(email);
        }
    }

    private void recordFailure(String email) {
        int count = failedAttempts.computeIfAbsent(email, k -> new AtomicInteger()).incrementAndGet();
        if (count >= MAX_FAILED_ATTEMPTS) {
            lockedUntil.put(email, Instant.now().plusSeconds(LOCK_MINUTES * 60));
            log.warn("Khóa tạm tài khoản {} sau {} lần đăng nhập sai", email, count);
        }
    }
}
