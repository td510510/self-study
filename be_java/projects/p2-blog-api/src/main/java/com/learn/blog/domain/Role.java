package com.learn.blog.domain;

/**
 * Vai trò người dùng.
 *
 * Tên hằng số có tiền tố ROLE_ để khớp trực tiếp với authority của Spring Security
 * (hasRole("ADMIN") kiểm tra authority "ROLE_ADMIN").
 */
public enum Role {
    ROLE_USER("Người dùng"),
    ROLE_AUTHOR("Tác giả"),
    ROLE_ADMIN("Quản trị viên");

    private final String label;

    Role(String label) { this.label = label; }

    public String getLabel() { return label; }

    /** Tên dùng trong @PreAuthorize("hasRole('ADMIN')") — không có tiền tố. */
    public String shortName() { return name().substring("ROLE_".length()); }
}
