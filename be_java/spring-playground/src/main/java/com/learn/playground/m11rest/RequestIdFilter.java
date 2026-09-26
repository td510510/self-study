package com.learn.playground.m11rest;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Module 11 — Logging: gắn một mã cho MỖI request và in nó trên MỌI dòng log của request đó.
 *
 * Không có mã này, khi 50 request chạy song song thì log của chúng trộn lẫn,
 * bạn không thể biết dòng "Lỗi không mong đợi" thuộc về request nào.
 *
 * Cách hoạt động:
 *  1. Lấy X-Request-Id từ client/gateway gửi tới (nếu có và hợp lệ), không thì tự sinh.
 *  2. Đặt vào MDC (Mapped Diagnostic Context) — một Map gắn với thread hiện tại.
 *     Pattern log trong application.yml có %X{requestId} nên mọi dòng log tự có mã này.
 *  3. Trả mã về trong header response để người dùng báo lỗi kèm mã -> tra log ngay.
 *  4. Luôn MDC.remove() ở finally: thread của Tomcat được TÁI SỬ DỤNG cho request sau.
 *
 * Chạy TRƯỚC mọi filter khác (kể cả Spring Security) để cả log của security cũng có mã.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";
    public static final String MDC_KEY = "requestId";

    /** Không tin mù quáng dữ liệu client gửi: chặn header dài bất thường hoặc chứa ký tự lạ (log injection). */
    private static final Pattern SAFE_ID = Pattern.compile("[A-Za-z0-9-]{1,64}");

    private static final Logger log = LoggerFactory.getLogger(RequestIdFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String incoming = request.getHeader(HEADER);
        String requestId = incoming != null && SAFE_ID.matcher(incoming).matches()
                ? incoming
                : UUID.randomUUID().toString().substring(0, 8);

        long start = System.nanoTime();
        MDC.put(MDC_KEY, requestId);
        response.setHeader(HEADER, requestId);
        try {
            chain.doFilter(request, response);
        } finally {
            long ms = (System.nanoTime() - start) / 1_000_000;
            // Một dòng "access log" cho mỗi request: method, đường dẫn, status, thời gian.
            // Dùng {} placeholder — KHÔNG nối chuỗi: chuỗi chỉ được dựng khi mức log được bật.
            log.info("{} {} -> {} ({} ms)", request.getMethod(), request.getRequestURI(), response.getStatus(), ms);
            MDC.remove(MDC_KEY);
        }
    }

    /** Không log các request tĩnh/giám sát cho đỡ nhiễu. */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/h2-console") || path.startsWith("/actuator") || path.equals("/favicon.ico");
    }

    /** Mã của request hiện tại — dùng làm traceId trong ErrorResponse. */
    public static String currentRequestId() {
        String id = MDC.get(MDC_KEY);
        return id != null ? id : UUID.randomUUID().toString().substring(0, 8);
    }
}
