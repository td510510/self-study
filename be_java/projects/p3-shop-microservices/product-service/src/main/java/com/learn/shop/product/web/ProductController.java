package com.learn.shop.product.web;

import com.learn.shop.product.dto.PageResponse;
import com.learn.shop.product.dto.ProductDtos.CreateProductRequest;
import com.learn.shop.product.dto.ProductDtos.ProductResponse;
import com.learn.shop.product.dto.ProductDtos.UpdateProductRequest;
import com.learn.shop.product.dto.ProductSearchCriteria;
import com.learn.shop.product.exception.ApiException;
import com.learn.shop.product.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.Set;

/** API công khai (đi qua gateway). Hợp đồng: docs/api-contracts.md. */
@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private static final int MAX_PAGE_SIZE = 100;
    /** Chỉ cho sắp xếp theo cột có trong danh sách — sort=password hay sort=abc không được lọt xuống DB. */
    private static final Set<String> SORTABLE = Set.of("id", "name", "price", "createdAt");

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public PageResponse<ProductResponse> search(@RequestParam(required = false) String keyword,
                                                @RequestParam(required = false) String category,
                                                @RequestParam(required = false) Long minPrice,
                                                @RequestParam(required = false) Long maxPrice,
                                                @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return productService.search(new ProductSearchCriteria(keyword, category, minPrice, maxPrice), sanitize(pageable));
    }

    @GetMapping("/{id}")
    public ProductResponse getById(@PathVariable Long id) {
        return productService.getById(id);
    }

    @PostMapping
    public ResponseEntity<ProductResponse> create(@RequestHeader(value = GatewayHeaders.USER_ROLES, required = false) String roles,
                                                  @Valid @RequestBody CreateProductRequest request) {
        GatewayHeaders.requireAdmin(roles);
        ProductResponse created = productService.create(request);
        return ResponseEntity.created(URI.create("/api/v1/products/" + created.id())).body(created);
    }

    @PatchMapping("/{id}")
    public ProductResponse update(@RequestHeader(value = GatewayHeaders.USER_ROLES, required = false) String roles,
                                  @PathVariable Long id,
                                  @Valid @RequestBody UpdateProductRequest request) {
        GatewayHeaders.requireAdmin(roles);
        return productService.update(id, request);
    }

    private Pageable sanitize(Pageable pageable) {
        for (Sort.Order order : pageable.getSort()) {
            if (!SORTABLE.contains(order.getProperty())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_SORT",
                        "Không sắp xếp được theo '" + order.getProperty() + "'. Cho phép: " + SORTABLE);
            }
        }
        int size = Math.min(pageable.getPageSize(), MAX_PAGE_SIZE);
        return PageRequest.of(pageable.getPageNumber(), size, pageable.getSort());
    }
}
