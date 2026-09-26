package com.learn.blog.dto.common;

import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

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
) {

    /** Tạo ErrorResponse với traceId mới. */
    public static ErrorResponse of(HttpStatus status, String errorCode, String message,
                                   String path, Map<String, String> fieldErrors) {
        return of(status, errorCode, message, path, fieldErrors, UUID.randomUUID().toString().substring(0, 8));
    }

    /** Dùng khi traceId đã được sinh trước (để ghi cùng một mã vào log). */
    public static ErrorResponse of(HttpStatus status, String errorCode, String message,
                                   String path, Map<String, String> fieldErrors, String traceId) {
        return new ErrorResponse(Instant.now(), status.value(), status.getReasonPhrase(),
                errorCode, message, path, traceId, fieldErrors);
    }
}
