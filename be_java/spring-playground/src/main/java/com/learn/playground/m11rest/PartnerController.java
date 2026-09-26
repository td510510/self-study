package com.learn.playground.m11rest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Module 11 — giả lập một API của ĐỐI TÁC bên ngoài (tỷ giá ngoại tệ).
 *
 * Để chạy được ngay không cần Internet, "đối tác" nằm luôn trong app này.
 * Hãy coi như nó ở một server khác mà bạn không kiểm soát được: có lúc chậm, có lúc lỗi.
 * ExternalApiController gọi sang đây qua HTTP thật bằng RestClient.
 */
@RestController
@RequestMapping("/m11/partner")
public class PartnerController {

    private static final Logger log = LoggerFactory.getLogger(PartnerController.class);

    private final AtomicInteger flakyCalls = new AtomicInteger();

    /** Trả tỷ giá sau khi "ngủ" delayMs — để thử timeout. */
    @GetMapping("/rates")
    public Map<String, Object> rates(@RequestParam(defaultValue = "200") long delayMs,
                                     @RequestHeader(value = RequestIdFilter.HEADER, required = false) String requestId)
            throws InterruptedException {
        log.info("[đối tác] nhận request, X-Request-Id từ bên gọi = {}, sẽ trả lời sau {} ms", requestId, delayMs);
        Thread.sleep(Math.min(delayMs, 30_000));
        return Map.of("base", "VND", "USD", 25_400, "EUR", 27_650, "JPY", 168, "updatedAt", Instant.now().toString());
    }

    /** Cứ 3 lần gọi thì 2 lần đầu lỗi 503 — giống một dịch vụ đang quá tải. */
    @GetMapping("/flaky")
    public ResponseEntity<Map<String, Object>> flaky() {
        int n = flakyCalls.incrementAndGet();
        if (n % 3 != 0) {
            log.warn("[đối tác] lần gọi #{} -> 503", n);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("error", "overloaded"));
        }
        log.info("[đối tác] lần gọi #{} -> 200", n);
        return ResponseEntity.ok(Map.of("status", "ok", "call", n));
    }
}
