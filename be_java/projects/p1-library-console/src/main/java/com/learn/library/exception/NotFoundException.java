package com.learn.library.exception;

public class NotFoundException extends LibraryException {
    public NotFoundException(String resource, String id) {
        super("Không tìm thấy " + resource + " với mã: " + id);
    }
}
