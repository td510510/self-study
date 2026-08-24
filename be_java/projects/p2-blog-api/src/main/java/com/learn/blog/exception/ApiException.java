package com.learn.blog.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/** Gốc của mọi lỗi nghiệp vụ: mang theo HTTP status và errorCode ổn định. */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;

    public ApiException(HttpStatus status, String errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }
}
