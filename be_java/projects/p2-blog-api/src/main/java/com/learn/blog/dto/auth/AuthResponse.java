package com.learn.blog.dto.auth;

import com.learn.blog.dto.common.UserSummary;

/** Trả về sau khi đăng nhập/đăng ký. Không bao giờ chứa mật khẩu. */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresInSeconds,
        UserSummary user
) {
    public static AuthResponse of(String access, String refresh, long expiresInSeconds, UserSummary user) {
        return new AuthResponse(access, refresh, "Bearer", expiresInSeconds, user);
    }
}
