package com.learn.playground;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Module 11 — gọi API bên ngoài và request id.
 *
 * Khác PlaygroundTests (MockMvc, không có server thật): ở đây RestClient phải gọi qua mạng thật,
 * nên khởi động Tomcat thật trên một cổng ngẫu nhiên.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@DisplayName("Module 11 — API bên ngoài & request id")
class ExternalApiTests {

    @Autowired TestRestTemplate rest;

    @Test
    @DisplayName("Mọi response có header X-Request-Id; gửi lên hợp lệ thì được giữ nguyên")
    void requestIdHeader() {
        ResponseEntity<String> generated = rest.getForEntity("/api/v1/books", String.class);
        assertThat(generated.getHeaders().getFirst("X-Request-Id")).hasSize(8);

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Request-Id", "tu-client-123");
        ResponseEntity<String> echoed = rest.exchange("/api/v1/books", HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertThat(echoed.getHeaders().getFirst("X-Request-Id")).isEqualTo("tu-client-123");
    }

    @Test
    @DisplayName("Header X-Request-Id chứa ký tự lạ bị thay bằng mã mới (chống log injection)")
    void requestIdKhongHopLe() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Request-Id", "abc FAKE LOG LINE");
        ResponseEntity<String> res = rest.exchange("/api/v1/books", HttpMethod.GET, new HttpEntity<>(headers), String.class);
        assertThat(res.getHeaders().getFirst("X-Request-Id")).doesNotContain("FAKE");
    }

    @Test
    @DisplayName("Lỗi 404 trả traceId TRÙNG với X-Request-Id để tra log")
    void traceIdTrungRequestId() {
        ResponseEntity<Map> res = rest.getForEntity("/api/v1/books/99999", Map.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(res.getBody()).containsEntry("traceId", res.getHeaders().getFirst("X-Request-Id"));
    }

    @Test
    @DisplayName("Đối tác trả lời nhanh -> 200")
    void goiDoiTacThanhCong() {
        ResponseEntity<Map> res = rest.getForEntity("/m11/external/rates?delayMs=50", Map.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).containsKey("rates");
    }

    @Test
    @DisplayName("Đối tác chậm 5s -> read timeout 2s -> 503 PARTNER_UNAVAILABLE, không chờ đủ 5s")
    void doiTacCham() {
        long start = System.currentTimeMillis();
        ResponseEntity<Map> res = rest.getForEntity("/m11/external/rates?delayMs=5000", Map.class);
        long elapsed = System.currentTimeMillis() - start;

        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(res.getBody()).containsEntry("errorCode", "PARTNER_UNAVAILABLE");
        assertThat(elapsed).isBetween(1_500L, 4_500L);
    }

    @Test
    @DisplayName("Đối tác lỗi 503 hai lần -> retry -> thành công ở lần thứ 3")
    void retry() {
        ResponseEntity<Map> res = rest.getForEntity("/m11/external/flaky", Map.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(res.getBody()).containsEntry("attempts", 3);
    }
}
