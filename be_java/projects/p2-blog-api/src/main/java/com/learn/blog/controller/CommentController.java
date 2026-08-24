package com.learn.blog.controller;

import com.learn.blog.dto.comment.CommentResponse;
import com.learn.blog.dto.comment.CreateCommentRequest;
import com.learn.blog.dto.common.PageResponse;
import com.learn.blog.security.CustomUserDetails;
import com.learn.blog.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Bình luận", description = "Bình luận và trả lời trên bài viết")
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/posts/{postId}/comments")
    @Operation(summary = "Danh sách bình luận của bài viết (kèm trả lời)")
    public PageResponse<CommentResponse> list(@PathVariable Long postId,
                                              @PageableDefault(size = 20) Pageable pageable) {
        return commentService.listByPost(postId, pageable);
    }

    @PostMapping("/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Thêm bình luận (phải đăng nhập)")
    public CommentResponse create(@PathVariable Long postId,
                                  @Valid @RequestBody CreateCommentRequest request,
                                  @AuthenticationPrincipal CustomUserDetails user) {
        return commentService.create(postId, request, user.getId());
    }

    @PatchMapping("/comments/{id}")
    @Operation(summary = "Sửa bình luận (chỉ chủ bình luận hoặc admin)")
    public CommentResponse update(@PathVariable Long id,
                                  @Valid @RequestBody UpdateCommentRequest request,
                                  @AuthenticationPrincipal CustomUserDetails user) {
        return commentService.update(id, request.content(), user.getId(), user.isAdmin());
    }

    @DeleteMapping("/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Xóa bình luận (chỉ chủ bình luận hoặc admin)")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails user) {
        commentService.delete(id, user.getId(), user.isAdmin());
    }

    public record UpdateCommentRequest(
            @NotBlank(message = "Nội dung không được để trống")
            @Size(max = 2000, message = "Bình luận tối đa 2000 ký tự")
            String content
    ) { }
}
