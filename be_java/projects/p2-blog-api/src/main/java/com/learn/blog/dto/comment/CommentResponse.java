package com.learn.blog.dto.comment;

import com.learn.blog.domain.Comment;
import com.learn.blog.dto.common.UserSummary;

import java.time.Instant;
import java.util.List;

public record CommentResponse(
        Long id,
        String content,
        UserSummary author,
        Long parentId,
        List<CommentResponse> replies,
        Instant createdAt
) {
    public static CommentResponse from(Comment c, List<CommentResponse> replies) {
        return new CommentResponse(
                c.getId(), c.getContent(), UserSummary.from(c.getAuthor()),
                c.getParent() == null ? null : c.getParent().getId(),
                replies == null ? List.of() : replies,
                c.getCreatedAt());
    }

    public static CommentResponse from(Comment c) { return from(c, List.of()); }
}
