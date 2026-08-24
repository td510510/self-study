package com.learn.blog;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test toàn luồng, chạy trên PostgreSQL thật (Testcontainers).
 *
 * Kịch bản kiểm chứng đúng những gì người dùng thật sẽ làm:
 *   đăng ký -> đăng nhập -> tạo bài -> xuất bản -> bình luận -> phân quyền -> refresh -> logout
 */
@DisplayName("Luồng nghiệp vụ đầu-cuối")
class AuthFlowIT extends AbstractIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    private record Tokens(String accessToken, String refreshToken) { }

    private Tokens register(String email) throws Exception {
        String body = """
                {"email": "%s", "password": "MatKhau123", "fullName": "Người Dùng Test"}
                """.formatted(email);

        String json = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                // Không bao giờ được lộ mật khẩu trong response
                .andExpect(jsonPath("$.user.password").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        JsonNode node = objectMapper.readTree(json);
        return new Tokens(node.get("accessToken").asText(), node.get("refreshToken").asText());
    }

    private String createPost(String token, String title) throws Exception {
        String body = """
                {"title": "%s", "summary": "Tóm tắt bài viết",
                 "content": "Nội dung bài viết đủ dài để vượt qua validate", "tags": ["java"]}
                """.formatted(title);

        String json = mockMvc.perform(post("/api/v1/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(json).get("id").asText();
    }

    @Test
    @DisplayName("đăng ký -> tạo bài -> xuất bản -> đọc công khai")
    void luongChinh() throws Exception {
        Tokens tokens = register("flow1@test.com");
        String postId = createPost(tokens.accessToken(), "Bài viết luồng chính");

        // Bản nháp: khách vãng lai không thấy
        mockMvc.perform(get("/api/v1/posts/bai-viet-luong-chinh"))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/posts/" + postId + "/publish")
                        .header("Authorization", "Bearer " + tokens.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.publishedAt").isNotEmpty());

        // Sau khi xuất bản: đọc được mà không cần token
        mockMvc.perform(get("/api/v1/posts/bai-viet-luong-chinh"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Bài viết luồng chính"))
                .andExpect(jsonPath("$.tags[0]").value("java"));
    }

    @Test
    @DisplayName("không có token -> 401; token hỏng -> 401")
    void chuaDangNhap() throws Exception {
        mockMvc.perform(post("/api/v1/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Bài viết", "content": "Nội dung đủ dài để qua validate"}"""))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("UNAUTHORIZED"));

        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer token.gia.mao"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("sửa bài của người khác -> 403 (chống IDOR)")
    void khongSuaDuocBaiNguoiKhac() throws Exception {
        Tokens tacGia = register("owner@test.com");
        Tokens keLa = register("intruder@test.com");

        String postId = createPost(tacGia.accessToken(), "Bài viết của tác giả");

        mockMvc.perform(patch("/api/v1/posts/" + postId)
                        .header("Authorization", "Bearer " + keLa.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Tiêu đề bị chiếm quyền"}"""))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("validate hỏng -> 400 kèm fieldErrors tiếng Việt")
    void validateHong() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "khong-phai-email", "password": "ngan", "fullName": ""}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.email").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors.password").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors.fullName").isNotEmpty());
    }

    @Test
    @DisplayName("email trùng -> 409")
    void emailTrung() throws Exception {
        register("trung@test.com");

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "trung@test.com", "password": "MatKhau123", "fullName": "Người khác"}"""))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("refresh cấp token mới; token cũ bị thu hồi")
    void xoayVongRefreshToken() throws Exception {
        Tokens tokens = register("refresh@test.com");

        String json = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken": "%s"}""".formatted(tokens.refreshToken())))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String refreshTokenMoi = objectMapper.readTree(json).get("refreshToken").asText();
        assertThat(refreshTokenMoi).isNotEqualTo(tokens.refreshToken());

        // Dùng lại token cũ -> bị từ chối
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken": "%s"}""".formatted(tokens.refreshToken())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("logout -> refresh token không dùng được nữa")
    void dangXuat() throws Exception {
        Tokens tokens = register("logout@test.com");

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken": "%s"}""".formatted(tokens.refreshToken())))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken": "%s"}""".formatted(tokens.refreshToken())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("bình luận: chỉ trên bài đã xuất bản, và phải đăng nhập")
    void binhLuan() throws Exception {
        Tokens tacGia = register("commenter-owner@test.com");
        Tokens docGia = register("commenter@test.com");

        String postId = createPost(tacGia.accessToken(), "Bài viết để bình luận");

        // Chưa xuất bản -> không cho bình luận
        mockMvc.perform(post("/api/v1/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + docGia.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content": "Bình luận thử"}"""))
                .andExpect(status().isUnprocessableEntity());

        mockMvc.perform(post("/api/v1/posts/" + postId + "/publish")
                        .header("Authorization", "Bearer " + tacGia.accessToken()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + docGia.accessToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content": "Bài viết rất hữu ích!"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("Bài viết rất hữu ích!"));

        mockMvc.perform(get("/api/v1/posts/" + postId + "/comments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(1));
    }
}
