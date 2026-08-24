package com.learn.blog.dto.common;

import java.time.Instant;
import java.util.Map;

/**
 * Định dạng lỗi THỐNG NHẤT cho toàn bộ API.
 *
 * errorCode: mã ổn định để frontend hiển thị thông báo đa ngôn ngữ
 *            (message có thể đổi, errorCode thì không).
 * traceId:   để tra log server khi người dùng báo lỗi.
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String errorCode,
        String message,
        String path,
        String traceId,
        Map<String, String> fieldErrors
) { }
