package com.learn.shop.product.web;

import com.learn.shop.product.dto.StockDtos.ReleaseRequest;
import com.learn.shop.product.dto.StockDtos.ReleaseResponse;
import com.learn.shop.product.dto.StockDtos.ReserveRequest;
import com.learn.shop.product.dto.StockDtos.ReserveResponse;
import com.learn.shop.product.service.StockService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * API NỘI BỘ — chỉ order-service gọi. Gateway không định tuyến /internal/** ra ngoài.
 *
 * Thử bằng curl khi chạy local:
 *   curl -X POST localhost:8082/internal/products/reserve -H 'Content-Type: application/json' \
 *        -d '{"orderId":1001,"items":[{"productId":1,"quantity":2},{"productId":5,"quantity":1}]}'
 *   (gọi lại y hệt -> cùng kết quả, tồn kho KHÔNG giảm thêm)
 *   curl -X POST localhost:8082/internal/products/release -H 'Content-Type: application/json' -d '{"orderId":1001}'
 */
@RestController
@RequestMapping("/internal/products")
public class InternalStockController {

    private final StockService stockService;

    public InternalStockController(StockService stockService) {
        this.stockService = stockService;
    }

    @PostMapping("/reserve")
    public ReserveResponse reserve(@Valid @RequestBody ReserveRequest request) {
        return stockService.reserve(request);
    }

    @PostMapping("/release")
    public ReleaseResponse release(@Valid @RequestBody ReleaseRequest request) {
        return stockService.release(request.orderId());
    }
}
