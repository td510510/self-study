package com.learn.blog.exception;

import org.springframework.http.HttpStatus;

/** Xung đột dữ liệu: email đã tồn tại, slug trùng... -> 409 */
public class ConflictException extends ApiException {
    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, "CONFLICT", message);
    }
}
