package com.learn.shop.product.service;

import com.learn.shop.product.config.CacheConfig;
import com.learn.shop.product.domain.Product;
import com.learn.shop.product.dto.PageResponse;
import com.learn.shop.product.dto.ProductDtos.CreateProductRequest;
import com.learn.shop.product.dto.ProductDtos.ProductResponse;
import com.learn.shop.product.dto.ProductDtos.UpdateProductRequest;
import com.learn.shop.product.dto.ProductSearchCriteria;
import com.learn.shop.product.exception.ApiException;
import com.learn.shop.product.repository.ProductRepository;
import com.learn.shop.product.repository.ProductSpecifications;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** API công khai: tìm kiếm, xem, và admin tạo/sửa sản phẩm. */
@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /** Key gồm mọi tham số ảnh hưởng tới kết quả; thiếu một tham số là trả nhầm dữ liệu của người khác. */
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheConfig.PRODUCT_SEARCH,
            key = "#criteria.toString() + ':' + #pageable.pageNumber + ':' + #pageable.pageSize + ':' + #pageable.sort")
    public PageResponse<ProductResponse> search(ProductSearchCriteria criteria, Pageable pageable) {
        log.debug("Cache miss — truy vấn DB: {} {}", criteria, pageable);
        return PageResponse.of(productRepository.findAll(ProductSpecifications.matching(criteria), pageable),
                ProductResponse::from);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = CacheConfig.PRODUCT, key = "#id")
    public ProductResponse getById(Long id) {
        return productRepository.findById(id)
                .filter(Product::isActive)
                .map(ProductResponse::from)
                .orElseThrow(() -> ApiException.productNotFound(id));
    }

    @Transactional
    @CacheEvict(cacheNames = CacheConfig.PRODUCT_SEARCH, allEntries = true)
    public ProductResponse create(CreateProductRequest req) {
        if (productRepository.existsBySku(req.sku())) throw ApiException.skuExists(req.sku());
        Product saved = productRepository.save(
                new Product(req.sku(), req.name().trim(), req.category().trim(), req.price(), req.stock()));
        log.info("Tạo sản phẩm id={} sku={}", saved.getId(), saved.getSku());
        return ProductResponse.from(saved);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(cacheNames = CacheConfig.PRODUCT, key = "#id"),
            @CacheEvict(cacheNames = CacheConfig.PRODUCT_SEARCH, allEntries = true)})
    public ProductResponse update(Long id, UpdateProductRequest req) {
        Product p = productRepository.findById(id).orElseThrow(() -> ApiException.productNotFound(id));
        if (req.name() != null) p.rename(req.name().trim());
        if (req.category() != null) p.changeCategory(req.category().trim());
        if (req.price() != null) p.changePrice(req.price());
        if (req.stock() != null) p.adjustStockTo(req.stock());
        if (req.active() != null) p.setActive(req.active());
        // Không gọi save(): entity đang được quản lý, Hibernate tự UPDATE khi commit (dirty checking).
        // Muốn lấy version mới trong response thì flush trước.
        productRepository.flush();
        log.info("Cập nhật sản phẩm id={}", id);
        return ProductResponse.from(p);
    }
}
