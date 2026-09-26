package com.learn.shop.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

/** DTO của API nội bộ /internal/products/** — chỉ order-service gọi. */
public final class StockDtos {

    private StockDtos() {
    }

    public record ReserveRequest(
            @NotNull(message = "orderId là bắt buộc") @Positive Long orderId,
            @NotEmpty(message = "Phải có ít nhất 1 sản phẩm")
            @Size(max = 50, message = "Tối đa 50 dòng sản phẩm mỗi đơn")
            List<@Valid ReserveItem> items
    ) { }

    public record ReserveItem(
            @NotNull(message = "productId là bắt buộc") Long productId,
            @Positive(message = "Số lượng phải > 0") int quantity
    ) { }

    /**
     * productName là field THÊM so với ví dụ trong api-contracts.md (được phép: thêm field tùy chọn
     * vào response là thay đổi tương thích ngược). order-service cần tên để đưa vào sự kiện Kafka.
     */
    public record ReservedItem(Long productId, String productName, int quantity, long unitPrice) { }

    public record ReserveResponse(Long orderId, boolean reserved, List<ReservedItem> items, long totalAmount) { }

    public record ReleaseRequest(@NotNull(message = "orderId là bắt buộc") @Positive Long orderId) { }

    /**
     * released = true: lần gọi này vừa hoàn kho.
     * released = false: không có gì để hoàn (đã hoàn trước đó, hoặc đơn chưa từng giữ kho) — vẫn là 200,
     * vì hành động bù trừ phải gọi lại bao nhiêu lần cũng an toàn.
     */
    public record ReleaseResponse(Long orderId, boolean released, List<ReservedItem> items, String message) { }
}
