package com.learn.blog.dto.post;

import jakarta.validation.constraints.Size;

import java.util.Set;

/** Cập nhật một phần: field nào null thì giữ nguyên giá trị cũ. */
public record UpdatePostRequest(
        @Size(min = 5, max = 200) String title,
        @Size(max = 500) String summary,
        @Size(min = 20) String content,
        @Size(max = 5) Set<String> tags
) { }
