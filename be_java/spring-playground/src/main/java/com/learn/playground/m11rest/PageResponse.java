package com.learn.playground.m11rest;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Bọc Page của Spring thành DTO riêng.
 * Lý do: hợp đồng API không nên phụ thuộc cấu trúc nội bộ của Spring Data
 * (Page mặc định serialize ra rất nhiều field thừa như "pageable", "sort", "empty").
 */
public record PageResponse<T>(
        List<T> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(),
                page.getTotalPages(), page.isFirst(), page.isLast());
    }
}
