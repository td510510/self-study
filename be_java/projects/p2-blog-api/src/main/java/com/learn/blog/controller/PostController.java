package com.learn.blog.controller;

import com.learn.blog.dto.common.PageResponse;
import com.learn.blog.dto.post.CreatePostRequest;
import com.learn.blog.dto.post.PostResponse;
import com.learn.blog.dto.post.PostSummaryResponse;
import com.learn.blog.dto.post.UpdatePostRequest;
import com.learn.blog.security.CustomUserDetails;
import com.learn.blog.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

/**
 * REST API bài viết.
 *
 * Controller CHỈ làm 3 việc: nhận input, gọi service, trả DTO.
 * Không có quy tắc nghiệp vụ nào ở đây.
 */
@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
@Tag(name = "Bài viết", description = "Quản lý bài viết blog")
public class PostController {

    private final PostService postService;

    @GetMapping
    @Operation(summary = "Danh sách bài viết đã xuất bản (công khai, có phân trang)")
    public PageResponse<PostSummaryResponse> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tag,
            @PageableDefault(size = 20, sort = "publishedAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return postService.search(keyword, tag, pageable);
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Chi tiết bài viết theo slug (tăng lượt xem)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thành công"),
            @ApiResponse(responseCode = "404", description = "Không tìm thấy bài viết")
    })
    public PostResponse getBySlug(@PathVariable String slug,
                                  @AuthenticationPrincipal CustomUserDetails user) {
        // user có thể null vì endpoint này công khai
        return postService.getBySlug(slug,
                user == null ? null : user.getId(),
                user != null && user.isAdmin());
    }

    @GetMapping("/me")
    @Operation(summary = "Bài viết của tôi (gồm cả bản nháp)")
    public PageResponse<PostSummaryResponse> myPosts(
            @AuthenticationPrincipal CustomUserDetails user,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return postService.findByAuthor(user.getId(), pageable);
    }

    @PostMapping
    @Operation(summary = "Tạo bài viết mới (trạng thái DRAFT)")
    public ResponseEntity<PostResponse> create(@Valid @RequestBody CreatePostRequest request,
                                               @AuthenticationPrincipal CustomUserDetails user) {
        PostResponse created = postService.create(request, user.getId());
        return ResponseEntity
                .created(URI.create("/api/v1/posts/" + created.slug()))   // header Location
                .body(created);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Cập nhật một phần bài viết (chỉ tác giả hoặc admin)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cập nhật thành công"),
            @ApiResponse(responseCode = "403", description = "Không phải bài viết của bạn"),
            @ApiResponse(responseCode = "409", description = "Bài viết vừa bị người khác sửa")
    })
    public PostResponse update(@PathVariable Long id,
                               @Valid @RequestBody UpdatePostRequest request,
                               @AuthenticationPrincipal CustomUserDetails user) {
        return postService.update(id, request, user.getId(), user.isAdmin());
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Xuất bản bài viết")
    public PostResponse publish(@PathVariable Long id,
                                @AuthenticationPrincipal CustomUserDetails user) {
        return postService.publish(id, user.getId(), user.isAdmin());
    }

    @PostMapping("/{id}/archive")
    @Operation(summary = "Lưu trữ bài viết")
    public PostResponse archive(@PathVariable Long id,
                                @AuthenticationPrincipal CustomUserDetails user) {
        return postService.archive(id, user.getId(), user.isAdmin());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Xóa bài viết (chỉ tác giả hoặc admin)")
    public void delete(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails user) {
        postService.delete(id, user.getId(), user.isAdmin());
    }
}
