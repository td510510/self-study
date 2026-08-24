package com.learn.blog.dto.post;

import com.learn.blog.domain.Post;
import com.learn.blog.dto.common.UserSummary;

import java.time.Instant;

/** Bản rút gọn dùng cho DANH SÁCH — không kèm content để giảm dữ liệu truyền. */
public record PostSummaryResponse(
        Long id,
        String slug,
        String title,
        String summary,
        String status,
        UserSummary author,
        long viewCount,
        Instant publishedAt
) {
    public static PostSummaryResponse from(Post p) {
        return new PostSummaryResponse(
                p.getId(), p.getSlug(), p.getTitle(), p.getSummary(),
                p.getStatus().name(), UserSummary.from(p.getAuthor()),
                p.getViewCount(), p.getPublishedAt());
    }
}
