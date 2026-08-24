package com.learn.blog.dto.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotBlank(message = "Nội dung bình luận không được để trống")
        @Size(min = 1, max = 2000, message = "Bình luận tối đa 2000 ký tự")
        String content,

        /** null nếu là bình luận gốc, có giá trị nếu là trả lời. */
        Long parentId
) { }
