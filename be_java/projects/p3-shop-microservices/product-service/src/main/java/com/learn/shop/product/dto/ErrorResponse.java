package com.learn.shop.product.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Định dạng lỗi chung của mọi service trong Dự án 3 (giống Dự án 2), thêm `details`
 * cho lỗi cần dữ liệu có cấu trúc (ví dụ INSUFFICIENT_STOCK: productId, requested, available).
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String errorCode,
        String message,
        String path,
        String traceId,
        Map<String, String> fieldErrors,
        Map<String, Object> details
) { }
