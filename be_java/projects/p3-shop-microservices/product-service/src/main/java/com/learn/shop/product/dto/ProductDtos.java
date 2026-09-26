package com.learn.shop.product.dto;

import com.learn.shop.product.domain.Product;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.io.Serializable;

/** DTO của API sản phẩm công khai. Gom một file cho dễ đọc. */
public final class ProductDtos {

    private ProductDtos() {
    }

    /**
     * Response trả về client — và cũng là thứ được CACHE trong Redis.
     * Serializable vì cache dùng JDK serialization (đơn giản, không cần cấu hình kiểu cho Jackson).
     */
    public record ProductResponse(Long id, String sku, String name, String category,
                                  long price, int stock, boolean active) implements Serializable {

        public static ProductResponse from(Product p) {
            return new ProductResponse(p.getId(), p.getSku(), p.getName(), p.getCategory(),
                    p.getPrice(), p.getStock(), p.isActive());
        }
    }

    public record CreateProductRequest(
            @NotBlank(message = "SKU không được để trống")
            @Pattern(regexp = "[A-Z0-9-]{3,50}", message = "SKU chỉ gồm chữ in hoa, số, dấu gạch ngang (3–50 ký tự)")
            String sku,

            @NotBlank(message = "Tên sản phẩm không được để trống")
            @Size(max = 200, message = "Tên tối đa 200 ký tự")
            String name,

            @NotBlank(message = "Danh mục không được để trống")
            String category,

            @Positive(message = "Giá phải lớn hơn 0")
            long price,

            @Min(value = 0, message = "Tồn kho không được âm")
            int stock
    ) { }

    /** PATCH: field nào null thì giữ nguyên. */
    public record UpdateProductRequest(
            @Size(min = 1, max = 200, message = "Tên từ 1 đến 200 ký tự")
            String name,

            @Size(min = 1, max = 100, message = "Danh mục từ 1 đến 100 ký tự")
            String category,

            @Positive(message = "Giá phải lớn hơn 0")
            Long price,

            @Min(value = 0, message = "Tồn kho không được âm")
            Integer stock,

            Boolean active
    ) { }
}
