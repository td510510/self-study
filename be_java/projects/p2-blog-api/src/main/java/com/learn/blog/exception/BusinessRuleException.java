package com.learn.blog.exception;

import org.springframework.http.HttpStatus;

/** Đúng cú pháp nhưng vi phạm quy tắc nghiệp vụ -> 422 */
public class BusinessRuleException extends ApiException {
    public BusinessRuleException(String message) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, "BUSINESS_RULE_VIOLATED", message);
    }

    public BusinessRuleException(String errorCode, String message) {
        super(HttpStatus.UNPROCESSABLE_ENTITY, errorCode, message);
    }
}
