package com.learn.playground.m11rest;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Module 11 — một nơi duy nhất biến MỌI exception thành JSON thống nhất.
 *
 * Thử các endpoint này để thấy từng nhánh:
 *   GET  /api/v1/books/999      -> 404
 *   GET  /api/v1/books/abc      -> 400 (sai kiểu tham số)
 *   POST /api/v1/books  {}      -> 400 kèm fieldErrors
 *   POST /api/v1/books trùng ISBN -> 409
 *   GET  /api/v1/books/boom     -> 500 nhưng KHÔNG lộ stacktrace
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BookService.NotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(BookService.NotFoundException e,
                                                        HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "BOOK_NOT_FOUND", e.getMessage(), req, null);
    }

    @ExceptionHandler(BookService.ConflictException.class)
    public ResponseEntity<ErrorResponse> handleConflict(BookService.ConflictException e,
                                                         HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, "ISBN_DUPLICATED", e.getMessage(), req, null);
    }

    /** API bên ngoài chậm/lỗi -> 503 của CHÍNH MÌNH, kèm thông báo dễ hiểu (không phải 500). */
    @ExceptionHandler(ExternalApiController.PartnerUnavailableException.class)
    public ResponseEntity<ErrorResponse> handlePartner(ExternalApiController.PartnerUnavailableException e,
                                                       HttpServletRequest req) {
        return build(HttpStatus.SERVICE_UNAVAILABLE, "PARTNER_UNAVAILABLE", e.getMessage(), req, null);
    }

    /** Lỗi @Valid trên @RequestBody -> gom thành map field -> thông báo. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e,
                                                           HttpServletRequest req) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (FieldError fe : e.getBindingResult().getFieldErrors()) {
            fields.putIfAbsent(fe.getField(),
                    fe.getDefaultMessage() == null ? "không hợp lệ" : fe.getDefaultMessage());
        }
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Dữ liệu không hợp lệ", req, fields);
    }

    /** /api/v1/books/abc — id là số mà client gửi chữ. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException e,
                                                             HttpServletRequest req) {
        String msg = "Tham số '%s' phải là kiểu %s".formatted(
                e.getName(),
                e.getRequiredType() == null ? "hợp lệ" : e.getRequiredType().getSimpleName());
        return build(HttpStatus.BAD_REQUEST, "TYPE_MISMATCH", msg, req, null);
    }

    /** JSON gửi lên sai cú pháp. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException e,
                                                           HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "MALFORMED_JSON", "Body không phải JSON hợp lệ", req, null);
    }

    /**
     * Lưới an toàn cuối cùng.
     * Client chỉ nhận traceId; chi tiết đầy đủ nằm trong log server.
     * KHÔNG BAO GIỜ trả stacktrace ra ngoài (lộ cấu trúc nội bộ = quà cho kẻ tấn công).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAll(Exception e, HttpServletRequest req) {
        String traceId = RequestIdFilter.currentRequestId();   // cùng mã với mọi dòng log của request này
        log.error("[{}] Lỗi không mong đợi tại {}", traceId, req.getRequestURI(), e);

        ErrorResponse body = new ErrorResponse(Instant.now(), 500, "Internal Server Error",
                "INTERNAL_ERROR", "Có lỗi xảy ra, vui lòng thử lại. Mã tra cứu: " + traceId,
                req.getRequestURI(), traceId, null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String code, String message,
                                                HttpServletRequest req, Map<String, String> fields) {
        String traceId = RequestIdFilter.currentRequestId();
        log.debug("[{}] {} tại {}: {}", traceId, code, req.getRequestURI(), message);

        return ResponseEntity.status(status).body(new ErrorResponse(
                Instant.now(), status.value(), status.getReasonPhrase(),
                code, message, req.getRequestURI(), traceId, fields));
    }
}
