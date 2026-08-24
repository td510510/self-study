package com.learn.blog.dto.common;

import com.learn.blog.domain.User;

/** Thông tin công khai của người dùng — KHÔNG có password, không có email khi hiển thị công khai. */
public record UserSummary(Long id, String fullName, String bio) {
    public static UserSummary from(User u) {
        return new UserSummary(u.getId(), u.getFullName(), u.getBio());
    }
}
