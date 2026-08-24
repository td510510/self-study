package com.learn.library.exception;

/** Gốc của mọi lỗi nghiệp vụ. Unchecked để không làm bẩn chữ ký hàm. */
public class LibraryException extends RuntimeException {
    public LibraryException(String message) { super(message); }
    public LibraryException(String message, Throwable cause) { super(message, cause); }
}
