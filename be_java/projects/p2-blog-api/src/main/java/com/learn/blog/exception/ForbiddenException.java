package com.learn.blog.exception;

import org.springframework.http.HttpStatus;

/** Đã đăng nhập nhưng không có quyền trên tài nguyên này -> 403. */
public class ForbiddenException extends ApiException {
    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
    }
}
