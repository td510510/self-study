package com.learn.playground.m12jpa;

/**
 * DTO projection: JPA chỉ SELECT đúng 3 cột này thay vì nạp cả entity.
 * Nhẹ hơn nhiều về cả số cột lẫn bộ nhớ, và không có nguy cơ lazy loading ngoài ý muốn.
 */
public record ArticleView(Long id, String title, String authorName) { }
