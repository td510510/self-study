package com.learn.blog.dto.post;

import com.learn.blog.domain.Post;
import com.learn.blog.domain.Tag;
import com.learn.blog.dto.common.UserSummary;

import java.time.Instant;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

/** Bản đầy đủ dùng cho CHI TIẾT bài viết. */
public record PostResponse(
        Long id,
        String slug,
        String title,
        String summary,
        String content,
        String status,
        UserSummary author,
        Set<String> tags,
        long viewCount,
        Instant publishedAt,
        Instant createdAt,
        Instant updatedAt
) {
    /** Chỉ gọi khi tags đã được nạp (JOIN FETCH), nếu không sẽ sinh thêm query. */
    public static PostResponse from(Post p) {
        return new PostResponse(
                p.getId(), p.getSlug(), p.getTitle(), p.getSummary(), p.getContent(),
                p.getStatus().name(), UserSummary.from(p.getAuthor()),
                p.getTags().stream().map(Tag::getName).collect(Collectors.toCollection(TreeSet::new)),
                p.getViewCount(), p.getPublishedAt(), p.getCreatedAt(), p.getUpdatedAt());
    }
}
