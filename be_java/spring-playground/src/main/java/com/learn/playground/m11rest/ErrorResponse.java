package com.learn.playground.m11rest;

import java.time.Instant;
import java.util.Map;

/**
 * Module 11 — MỘT định dạng lỗi cho toàn bộ API.
 *
 * errorCode: mã ổn định để frontend hiển thị thông báo đa ngôn ngữ (message có thể đổi).
 * traceId : để tra log server khi người dùng báo lỗi.
 * fieldErrors: chỉ có khi lỗi validate.
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
