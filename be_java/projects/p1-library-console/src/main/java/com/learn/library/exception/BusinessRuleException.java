package com.learn.library.exception;

/** Vi phạm quy tắc nghiệp vụ: quá hạn mức mượn, sách hết bản, thành viên bị khóa... */
public class BusinessRuleException extends LibraryException {
    public BusinessRuleException(String message) { super(message); }
}
