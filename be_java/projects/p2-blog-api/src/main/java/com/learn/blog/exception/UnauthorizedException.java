package com.learn.blog.exception;

import org.springframework.http.HttpStatus;

/** Chưa xác thực hoặc thông tin đăng nhập sai -> 401 */
public class UnauthorizedException extends ApiException {
    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", message);
    }
}
