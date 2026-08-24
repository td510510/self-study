package com.learn.blog.dto.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreatePostRequest(

        @NotBlank(message = "Tiêu đề không được để trống")
        @Size(min = 5, max = 200, message = "Tiêu đề phải từ 5 đến 200 ký tự")
        String title,

        @Size(max = 500, message = "Tóm tắt tối đa 500 ký tự")
        String summary,

        @NotBlank(message = "Nội dung không được để trống")
        @Size(min = 20, message = "Nội dung phải có ít nhất 20 ký tự")
        String content,

        @Size(max = 5, message = "Tối đa 5 thẻ cho mỗi bài viết")
        Set<String> tags
) { }
