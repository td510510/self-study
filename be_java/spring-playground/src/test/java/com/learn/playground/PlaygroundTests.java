package com.learn.playground;

import com.learn.playground.m12jpa.M12Service;
import com.learn.playground.m14cache.CachedProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test cho sân tập: mỗi test kiểm chứng đúng một bài học của module tương ứng.
 * Chạy: mvn test
 */
@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("Spring Playground")
class PlaygroundTests {

    @Autowired MockMvc mockMvc;
    @Autowired M12Service m12Service;
    @Autowired CachedProductService cachedProductService;

    // ------------------------------------------------------ Module 11
    @Test
    @DisplayName("M11: tạo sách hợp lệ -> 201 kèm header Location")
    void taoSachHopLe() throws Exception {
        mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"isbn":"978-7777","title":"Sách test","author":"Tác giả","copies":2}"""))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.isbn").value("978-7777"));
    }

    @Test
    @DisplayName("M11: dữ liệu sai -> 400 kèm fieldErrors tiếng Việt")
    void validateHong() throws Exception {
        mockMvc.perform(post("/api/v1/books")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"isbn":"sai-dinh-dang","title":"x","author":"","copies":0}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.isbn").exists())
                .andExpect(jsonPath("$.fieldErrors.title").exists())
                .andExpect(jsonPath("$.fieldErrors.copies").exists());
    }

    @Test
    @DisplayName("M11: id không tồn tại -> 404 đúng định dạng ErrorResponse")
    void khongTimThay() throws Exception {
        mockMvc.perform(get("/api/v1/books/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("BOOK_NOT_FOUND"))
                .andExpect(jsonPath("$.traceId").exists());
    }

    @Test
    @DisplayName("M11: lỗi 500 KHÔNG lộ stacktrace ra client")
    void khongLoStacktrace() throws Exception {
        mockMvc.perform(get("/api/v1/books/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.errorCode").value("INTERNAL_ERROR"))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    // ------------------------------------------------------ Module 12
    @Test
    @DisplayName("M12: JOIN FETCH sinh ÍT query hơn hẳn cách gây N+1")
    void nPlusOne() {
        var bad = m12Service.countQueries(m12Service::listBad);
        var good = m12Service.countQueries(m12Service::listJoinFetch);

        assertThat(good.result()).isEqualTo(bad.result());      // cùng dữ liệu
        assertThat(good.queryCount()).isLessThan(bad.queryCount());
        assertThat(good.queryCount()).isEqualTo(1);             // đúng 1 query
    }

    @Test
    @DisplayName("M12: 100 luồng cùng mua 10 sản phẩm -> UPDATE nguyên tử bán đúng 10")
    void tonKhoAnToan() throws Exception {
        mockMvc.perform(get("/m12/atomic-stock?stock=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.safe_atomic_update.don_thanh_cong").value(10))
                .andExpect(jsonPath("$.safe_atomic_update.ton_kho_con_lai").value(0));
    }

    // ------------------------------------------------------ Module 13
    @Test
    @DisplayName("M13: không token -> 401, sai quyền -> 403, đủ quyền -> 200")
    void phanQuyen() throws Exception {
        mockMvc.perform(get("/m13/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.errorCode").value("UNAUTHORIZED"));

        String tokenUser = layToken("an");
        mockMvc.perform(get("/m13/me").header("Authorization", "Bearer " + tokenUser))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("an"));

        mockMvc.perform(get("/m13/admin").header("Authorization", "Bearer " + tokenUser))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));

        mockMvc.perform(get("/m13/admin").header("Authorization", "Bearer " + layToken("admin")))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("M13: không xem được đơn hàng của người khác (chống IDOR)")
    void chongIdor() throws Exception {
        String tokenAn = layToken("an");     // an có id = 1, đơn số 2 thuộc về binh

        mockMvc.perform(get("/m13/orders/1").header("Authorization", "Bearer " + tokenAn))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.don_hang").exists());

        mockMvc.perform(get("/m13/orders/2").header("Authorization", "Bearer " + tokenAn))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.don_hang").doesNotExist());
    }

    @Test
    @DisplayName("M13: token sai chữ ký bị từ chối")
    void tokenGiaMao() throws Exception {
        mockMvc.perform(get("/m13/me").header("Authorization", "Bearer a.b.c"))
                .andExpect(status().isUnauthorized());
    }

    // ------------------------------------------------------ Module 14
    @Test
    @DisplayName("M14: lần gọi thứ hai lấy từ cache, method không chạy lại")
    void cacheHoatDong() {
        cachedProductService.evict(42L);
        cachedProductService.resetHits();

        cachedProductService.findById(42L);
        cachedProductService.findById(42L);
        cachedProductService.findById(42L);

        assertThat(cachedProductService.getDbHits()).isEqualTo(1);
    }

    @Test
    @DisplayName("M14: gọi nội bộ khiến @Cacheable vô hiệu (bẫy proxy)")
    void bayProxy() {
        cachedProductService.evict(43L);
        cachedProductService.resetHits();

        cachedProductService.goiNoiBoKhongCache(43L);
        cachedProductService.goiNoiBoKhongCache(43L);

        // Lần 1 vào cache; nhưng vì gọi nội bộ nên proxy bị bỏ qua -> method chạy lại
        assertThat(cachedProductService.getDbHits()).isGreaterThan(1);
    }

    private String layToken(String username) throws Exception {
        String json = mockMvc.perform(post("/m13/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"%s","password":"123456"}""".formatted(username)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        return new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(json).get("accessToken").asText();
    }
}
