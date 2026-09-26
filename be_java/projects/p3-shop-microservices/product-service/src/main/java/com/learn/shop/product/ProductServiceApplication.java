package com.learn.shop.product;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * product-service — service MẪU của Dự án 3.
 *
 * Đọc theo thứ tự:
 *   1. web/InternalStockController + service/StockService  — reserve/release idempotent cho saga (phần đáng học nhất)
 *   2. web/ProductController + service/ProductService      — API công khai, cache Redis, lọc động bằng Specification
 *   3. web/TraceIdFilter + web/GatewayHeaders              — service phía sau gateway nhận danh tính qua header
 *   4. src/test/                                            — kiểm chứng 100 request đồng thời không bán quá tồn kho
 */
@SpringBootApplication
@EnableCaching
public class ProductServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }
}
