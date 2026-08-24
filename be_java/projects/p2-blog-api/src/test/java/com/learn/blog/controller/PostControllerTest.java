package com.learn.blog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.learn.blog.config.SecurityConfig;
import com.learn.blog.dto.common.PageResponse;
import com.learn.blog.dto.common.UserSummary;
import com.learn.blog.dto.post.PostResponse;
import com.learn.blog.exception.ForbiddenException;
import com.learn.blog.exception.NotFoundException;
import com.learn.blog.security.CustomUserDetails;
import com.learn.blog.security.JwtAuthenticationFilter;
import com.learn.blog.service.PostService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.willThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * @WebMvcTest chỉ nạp tầng web (controller + filter + exception handler) nên chạy rất nhanh.
 * Service được thay bằng mock — ta chỉ kiểm tra: định tuyến, validate, status code, JSON trả về.
 */
@WebMvcTest(PostController.class)
@Import(SecurityConfig.class)
@DisplayName("PostController")
class PostControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockBean PostService postService;
    @MockBean JwtAuthenticationFilter jwtAuthenticationFilter;   // không cần token thật trong test này

    private PostResponse samplePost() {
        return new PostResponse(1L, "hoc-java", "Học Java", "Tóm tắt", "Nội dung",
                "PUBLISHED", new UserSummary(1L, "An", null), Set.of("java"),
                10, Instant.now(), Instant.now(), null);
    }

    private CustomUserDetails principal(Long id, String role) {
        com.learn.blog.domain.User u = new com.learn.blog.domain.User();
        u.setId(id);
        u.setEmail("test@blog.com");
        u.setFullName("Người dùng test");
        u.setPassword("x");
        u.addRole(com.learn.blog.domain.Role.valueOf(role));
        return new CustomUserDetails(u);
    }

    @Test
    @DisplayName("GET danh sách — công khai, không cần token")
    void list_congKhai() throws Exception {
        given(postService.search(any(), any(), any()))
                .willReturn(new PageResponse<>(List.of(), 0, 20, 0, 0, true, true));

        mockMvc.perform(get("/api/v1/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.page").value(0));
    }

    @Test
    @DisplayName("GET chi tiết — trả đúng JSON")
    void getBySlug() throws Exception {
        given(postService.getBySlug(eq("hoc-java"), any(), anyBoolean())).willReturn(samplePost());

        mockMvc.perform(get("/api/v1/posts/hoc-java"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Học Java"))
                .andExpect(jsonPath("$.author.fullName").value("An"))
                .andExpect(jsonPath("$.tags[0]").value("java"));
    }

    @Test
    @DisplayName("GET slug không tồn tại — 404 với ErrorResponse thống nhất")
    void getBySlug_khongTonTai() throws Exception {
        willThrow(new NotFoundException("bài viết", "khong-co"))
                .given(postService).getBySlug(eq("khong-co"), any(), anyBoolean());

        mockMvc.perform(get("/api/v1/posts/khong-co"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"))
                .andExpect(jsonPath("$.path").value("/api/v1/posts/khong-co"));
    }

    @Test
    @DisplayName("POST không đăng nhập — 401")
    void create_khongToken() throws Exception {
        mockMvc.perform(post("/api/v1/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Tiêu đề hợp lệ","content":"Nội dung đủ dài để qua validate"}"""))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST dữ liệu thiếu — 400 kèm fieldErrors")
    void create_thieuTruong() throws Exception {
        mockMvc.perform(post("/api/v1/posts")
                        .with(user(principal(1L, "ROLE_USER")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"abc","content":""}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.title").exists())
                .andExpect(jsonPath("$.fieldErrors.content").exists());
    }

    @Test
    @DisplayName("POST hợp lệ — 201 kèm header Location")
    void create_thanhCong() throws Exception {
        given(postService.create(any(), anyLong())).willReturn(samplePost());

        mockMvc.perform(post("/api/v1/posts")
                        .with(user(principal(1L, "ROLE_USER")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Học Java từ đâu","summary":"Tóm tắt",
                                 "content":"Nội dung bài viết đủ dài để qua validate","tags":["java"]}"""))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/posts/hoc-java"))
                .andExpect(jsonPath("$.slug").value("hoc-java"));
    }

    @Test
    @DisplayName("DELETE bài của người khác — 403")
    void delete_khongPhaiCuaMinh() throws Exception {
        willThrow(new ForbiddenException("Bạn chỉ có thể thao tác trên bài viết của chính mình"))
                .given(postService).delete(anyLong(), anyLong(), anyBoolean());

        mockMvc.perform(delete("/api/v1/posts/1").with(user(principal(2L, "ROLE_USER"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("ACCESS_DENIED"));
    }

    @Test
    @DisplayName("DELETE bài của mình — 204 không body")
    void delete_thanhCong() throws Exception {
        mockMvc.perform(delete("/api/v1/posts/1").with(user(principal(1L, "ROLE_USER"))))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("id sai kiểu (/posts/abc dùng cho DELETE) — 400")
    void idSaiKieu() throws Exception {
        mockMvc.perform(delete("/api/v1/posts/abc").with(user(principal(1L, "ROLE_USER"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("TYPE_MISMATCH"));
    }
}
