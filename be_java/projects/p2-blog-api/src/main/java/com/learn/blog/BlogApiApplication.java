package com.learn.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Điểm khởi động. @SpringBootApplication quét toàn bộ package con của com.learn.blog,
 * nên class này phải nằm ở package gốc.
 */
@SpringBootApplication
public class BlogApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(BlogApiApplication.class, args);
    }
}
