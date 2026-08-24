package com.learn.blog.exception;

import com.learn.blog.dto.common.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Một nơi duy nhất biến mọi exception thành response JSON thống nhất.
 *
 * Nguyên tắc:
 *  - Client nhận thông báo hữu ích nhưng KHÔNG lộ chi tiết nội bộ (SQL, stacktrace, tên bảng).
 *  - Chi tiết đầy đủ được ghi vào log ở server, kèm traceId để tra cứu.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /** Mọi lỗi nghiệp vụ của ứng dụng đều đi qua đây. */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException e, HttpServletRequest req) {
        log.debug("Lỗi nghiệp vụ {} tại {}: {}", e.getErrorCode(), req.getRequestURI(), e.getMessage());
        return build(e.getStatus(), e.getErrorCode(), e.getMessage(), req, null);
    }

    /** Lỗi @Valid trên @RequestBody — gom thành map field -> thông báo. */
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

    /** Lỗi @Validated trên tham số của controller (@RequestParam, @PathVariable). */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraint(ConstraintViolationException e,
                                                          HttpServletRequest req) {
        Map<String, String> fields = new LinkedHashMap<>();
        e.getConstraintViolations().forEach(v ->
                fields.put(v.getPropertyPath().toString(), v.getMessage()));
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_FAILED", "Tham số không hợp lệ", req, fields);
    }

    /** JSON gửi lên sai cú pháp hoặc sai kiểu. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException e,
                                                          HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "MALFORMED_JSON",
                "Body request không đọc được (JSON sai định dạng)", req, null);
    }

    /** /posts/abc trong khi id là số. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException e,
                                                            HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, "TYPE_MISMATCH",
                "Tham số '" + e.getName() + "' có giá trị không hợp lệ: " + e.getValue(), req, null);
    }

    /** Vi phạm ràng buộc ở DB (unique, foreign key). KHÔNG trả nguyên văn thông báo của DB. */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException e,
                                                             HttpServletRequest req) {
        log.warn("Vi phạm ràng buộc DB tại {}", req.getRequestURI(), e);
        return build(HttpStatus.CONFLICT, "DATA_INTEGRITY_VIOLATION",
                "Dữ liệu vi phạm ràng buộc (có thể đã tồn tại)", req, null);
    }

    /** Hai người cùng sửa một bản ghi (@Version). */
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleOptimisticLock(ObjectOptimisticLockingFailureException e,
                                                              HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, "CONCURRENT_MODIFICATION",
                "Bản ghi vừa bị người khác thay đổi, vui lòng tải lại và thử lại", req, null);
    }

    /** Spring Security: chưa xác thực. */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuth(AuthenticationException e, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED",
                "Bạn cần đăng nhập để thực hiện thao tác này", req, null);
    }

    /** Spring Security: đã xác thực nhưng thiếu quyền. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException e,
                                                            HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, "ACCESS_DENIED",
                "Bạn không có quyền thực hiện thao tác này", req, null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException e,
                                                          HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, "ENDPOINT_NOT_FOUND", "Endpoint không tồn tại", req, null);
    }

    /** Lưới an toàn cuối cùng: bug của chúng ta. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAll(Exception e, HttpServletRequest req) {
        String traceId = UUID.randomUUID().toString().substring(0, 8);
        log.error("[traceId={}] Lỗi không mong đợi tại {} {}",
                traceId, req.getMethod(), req.getRequestURI(), e);
        ErrorResponse body = ErrorResponse.of(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
                "Có lỗi xảy ra, vui lòng thử lại. Mã tra cứu: " + traceId,
                req.getRequestURI(), null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String code, String message,
                                                HttpServletRequest req, Map<String, String> fields) {
        return ResponseEntity.status(status)
                .body(ErrorResponse.of(status, code, message, req.getRequestURI(), fields));
    }
}
