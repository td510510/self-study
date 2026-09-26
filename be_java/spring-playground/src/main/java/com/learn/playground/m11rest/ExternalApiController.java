package com.learn.playground.m11rest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Module 11 — gọi API bên ngoài bằng RestClient (Spring 6.1+), đúng cách:
 *
 *  1. LUÔN đặt timeout. Mặc định của JDK là CHỜ VÔ HẠN: đối tác treo -> thread của bạn treo theo
 *     -> hết thread Tomcat (mặc định 200) -> cả ứng dụng ngừng phản hồi dù chỉ một API ngoài bị chậm.
 *  2. Dịch lỗi của bên ngoài thành lỗi CỦA MÌNH (PartnerUnavailableException -> 503),
 *     không để ResourceAccessException lọt ra thành 500 khó hiểu.
 *  3. Chỉ retry lỗi TẠM THỜI (timeout, 503), có giới hạn số lần và chờ tăng dần.
 *     Không retry 400/404 (gọi lại vẫn sai) và cẩn thận với POST không idempotent.
 *  4. Chuyển tiếp X-Request-Id để lần vết request qua nhiều hệ thống.
 *
 * Thử:
 *   curl localhost:8080/m11/external/rates                 # ~200ms, thành công
 *   curl -i "localhost:8080/m11/external/rates?delayMs=5000"  # quá read-timeout 2s -> 503 sau ~2s
 *   curl localhost:8080/m11/external/flaky                 # lỗi 2 lần, lần 3 thành công nhờ retry
 */
@RestController
@RequestMapping("/m11/external")
public class ExternalApiController {

    private static final Logger log = LoggerFactory.getLogger(ExternalApiController.class);
    private static final int MAX_ATTEMPTS = 3;

    private final RestClient partnerClient;

    public ExternalApiController(RestClient partnerClient) {
        this.partnerClient = partnerClient;
    }

    @GetMapping("/rates")
    public Map<String, Object> rates(@RequestParam(defaultValue = "200") long delayMs) {
        long start = System.nanoTime();
        try {
            Map<String, Object> rates = partnerClient.get()
                    .uri(baseUrl() + "/m11/partner/rates?delayMs={d}", delayMs)
                    .header(RequestIdFilter.HEADER, RequestIdFilter.currentRequestId())
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() { });
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("elapsedMs", (System.nanoTime() - start) / 1_000_000);
            result.put("rates", rates);
            result.put("bai-hoc", "Xem console: dòng log của 'đối tác' có CÙNG X-Request-Id với request của bạn.");
            return result;
        } catch (ResourceAccessException e) {
            // Timeout hoặc không kết nối được. Log đủ chi tiết cho mình, trả thông báo gọn cho client.
            log.warn("Gọi đối tác tỷ giá thất bại sau {} ms: {}", (System.nanoTime() - start) / 1_000_000, e.getMessage());
            throw new PartnerUnavailableException("Dịch vụ tỷ giá đang chậm, vui lòng thử lại sau");
        }
    }

    @GetMapping("/flaky")
    public Map<String, Object> flaky() {
        for (int attempt = 1; ; attempt++) {
            try {
                Map<String, Object> body = partnerClient.get()
                        .uri(baseUrl() + "/m11/partner/flaky")
                        .retrieve()
                        .body(new ParameterizedTypeReference<>() { });
                log.info("Lần thử {} thành công", attempt);
                return Map.of("attempts", attempt, "partnerResponse", body);
            } catch (HttpServerErrorException.ServiceUnavailable | ResourceAccessException e) {
                if (attempt == MAX_ATTEMPTS) {
                    throw new PartnerUnavailableException("Đối tác lỗi sau " + MAX_ATTEMPTS + " lần thử");
                }
                long backoffMs = 100L * (1L << (attempt - 1));      // 100, 200, 400... (exponential backoff)
                log.warn("Lần thử {} lỗi ({}), chờ {} ms rồi thử lại", attempt, e.getClass().getSimpleName(), backoffMs);
                sleep(backoffMs);
            }
        }
    }

    /**
     * Ở dự án thật base URL đọc từ cấu hình (app.partner.base-url).
     * Ở đây đối tác nằm chung app nên lấy chính địa chỉ của app — chạy đúng với mọi cổng.
     */
    private static String baseUrl() {
        return ServletUriComponentsBuilder.fromCurrentContextPath().toUriString();
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new PartnerUnavailableException("Bị ngắt khi đang chờ thử lại");
        }
    }

    public static class PartnerUnavailableException extends RuntimeException {
        public PartnerUnavailableException(String message) {
            super(message);
        }
    }

    @Configuration
    static class PartnerClientConfig {

        /** Mỗi đối tác một RestClient riêng với timeout riêng — đừng dùng chung một cấu hình cho mọi nơi. */
        @Bean
        RestClient partnerClient(RestClient.Builder builder) {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(Duration.ofSeconds(1));   // thời gian tối đa để BẮT TAY kết nối
            factory.setReadTimeout(Duration.ofSeconds(2));      // thời gian tối đa CHỜ DỮ LIỆU trả về
            return builder.requestFactory(factory).build();
        }
    }
}
