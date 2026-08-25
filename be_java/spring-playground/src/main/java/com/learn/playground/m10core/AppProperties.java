package com.learn.playground.m10core;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Module 10 — đọc cấu hình kiểu type-safe.
 *
 * Ưu điểm so với @Value: gom nhóm, tự động ánh xạ kiểu, VALIDATE ĐƯỢC.
 * Cấu hình sai (ví dụ maxItems = -1) thì ứng dụng KHÔNG khởi động —
 * lỗi lộ ra lúc deploy chứ không phải lúc khách hàng đang dùng.
 *
 * Giá trị nằm trong application.yml, phần app.shop.*
 */
@Validated
@ConfigurationProperties(prefix = "app.shop")
public record AppProperties(

        @NotBlank(message = "app.shop.name không được để trống")
        String name,

        @Min(value = 1, message = "app.shop.max-items-per-order phải >= 1")
        int maxItemsPerOrder,

        @Min(0)
        long freeShippingThreshold
) { }
