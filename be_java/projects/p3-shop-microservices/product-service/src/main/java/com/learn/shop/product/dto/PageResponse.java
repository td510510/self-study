package com.learn.shop.product.dto;

import org.springframework.data.domain.Page;

import java.io.Serializable;
import java.util.List;
import java.util.function.Function;

/**
 * Định dạng phân trang theo docs/api-contracts.md.
 * Không trả thẳng Page của Spring: cấu trúc JSON của nó có thể đổi giữa các phiên bản -> phá hợp đồng.
 */
public record PageResponse<T>(List<T> items, int page, int size, long totalElements, int totalPages,
                              boolean first, boolean last) implements Serializable {

    public static <E, T> PageResponse<T> of(Page<E> page, Function<E, T> mapper) {
        return new PageResponse<>(page.getContent().stream().map(mapper).toList(),
                page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages(),
                page.isFirst(), page.isLast());
    }
}
