package com.learn.shop.product.exception;

import org.springframework.http.HttpStatus;

import java.util.Map;

/** Lỗi nghiệp vụ: mang sẵn status + errorCode ổn định để GlobalExceptionHandler trả về. */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String errorCode;
    private final Map<String, Object> details;

    public ApiException(HttpStatus status, String errorCode, String message) {
        this(status, errorCode, message, null);
    }

    public ApiException(HttpStatus status, String errorCode, String message, Map<String, Object> details) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
        this.details = details;
    }

    public HttpStatus getStatus() { return status; }
    public String getErrorCode() { return errorCode; }
    public Map<String, Object> getDetails() { return details; }

    // ------------------------------------------------------------ các lỗi cụ thể

    public static ApiException productNotFound(Long id) {
        return new ApiException(HttpStatus.NOT_FOUND, "PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm id=" + id,
                Map.of("productId", id));
    }

    public static ApiException skuExists(String sku) {
        return new ApiException(HttpStatus.CONFLICT, "SKU_EXISTS", "SKU '" + sku + "' đã tồn tại");
    }

    public static ApiException insufficientStock(Long productId, String name, int requested, int available) {
        return new ApiException(HttpStatus.CONFLICT, "INSUFFICIENT_STOCK",
                "Sản phẩm '" + name + "' chỉ còn " + available + " sản phẩm",
                Map.of("productId", productId, "requested", requested, "available", available));
    }

    public static ApiException productInactive(Long productId, String name) {
        return new ApiException(HttpStatus.CONFLICT, "PRODUCT_INACTIVE", "Sản phẩm '" + name + "' đã ngừng bán",
                Map.of("productId", productId));
    }

    public static ApiException orderAlreadyReleased(Long orderId) {
        return new ApiException(HttpStatus.CONFLICT, "ORDER_ALREADY_RELEASED",
                "Đơn hàng " + orderId + " đã được hoàn kho trước đó, không thể giữ kho lại với cùng orderId",
                Map.of("orderId", orderId));
    }

    public static ApiException forbidden(String message) {
        return new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", message);
    }
}
