package com.learn.shop.product.dto;

/**
 * Tham số lọc danh sách sản phẩm. Record -> equals/toString ổn định -> dùng làm một phần của cache key.
 */
public record ProductSearchCriteria(String keyword, String category, Long minPrice, Long maxPrice) {
}
