package com.learn.blog.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/** Tiện ích lấy người dùng đang đăng nhập ở tầng service. */
public final class CurrentUser {

    public static Optional<CustomUserDetails> get() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return Optional.empty();
        if (auth.getPrincipal() instanceof CustomUserDetails details) return Optional.of(details);
        return Optional.empty();
    }

    public static Optional<Long> id() { return get().map(CustomUserDetails::getId); }

    public static boolean isAdmin() {
        return get().map(u -> u.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")))
                .orElse(false);
    }

    private CurrentUser() { }
}
