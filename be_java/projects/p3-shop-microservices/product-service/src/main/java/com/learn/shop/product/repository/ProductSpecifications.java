package com.learn.shop.product.repository;

import com.learn.shop.product.domain.Product;
import com.learn.shop.product.dto.ProductSearchCriteria;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

/**
 * Lọc động: tham số nào có thì mới thêm điều kiện đó vào WHERE.
 *
 * Vì sao không viết một câu JPQL với "(:keyword IS NULL OR ...)"?
 * Trên PostgreSQL, tham số null không rõ kiểu hay gây lỗi "could not determine data type of parameter",
 * và câu query chung chung đó khó dùng index. Specification sinh ĐÚNG câu SQL cho từng tổ hợp tham số.
 */
public final class ProductSpecifications {

    private ProductSpecifications() {
    }

    public static Specification<Product> matching(ProductSearchCriteria c) {
        return (root, query, cb) -> {
            List<Predicate> where = new ArrayList<>();
            where.add(cb.isTrue(root.get("active")));        // API công khai chỉ thấy sản phẩm đang bán

            if (c.keyword() != null && !c.keyword().isBlank()) {
                String pattern = "%" + c.keyword().trim().toLowerCase() + "%";
                where.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("sku")), pattern)));
            }
            if (c.category() != null && !c.category().isBlank()) {
                where.add(cb.equal(root.get("category"), c.category().trim()));
            }
            if (c.minPrice() != null) {
                where.add(cb.greaterThanOrEqualTo(root.get("price"), c.minPrice()));
            }
            if (c.maxPrice() != null) {
                where.add(cb.lessThanOrEqualTo(root.get("price"), c.maxPrice()));
            }
            return cb.and(where.toArray(Predicate[]::new));
        };
    }
}
