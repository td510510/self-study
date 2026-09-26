package com.learn.shop.product.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.cache.RedisCacheManagerBuilderCustomizer;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;

import java.time.Duration;

/**
 * Cache Redis cho sản phẩm.
 *
 * Ba quyết định đáng chú ý:
 *  1. TTL riêng từng cache: chi tiết sản phẩm 10 phút, danh sách chỉ 1 phút (tồn kho trong danh sách đổi liên tục).
 *  2. transactionAware(): lệnh xóa cache chỉ chạy SAU KHI transaction commit. Nếu xóa trước khi commit,
 *     một request đọc chen vào giữa sẽ nạp lại dữ liệu CŨ vào cache và giữ nó tới hết TTL.
 *  3. Redis lỗi thì bỏ qua cache (CacheErrorHandler) thay vì làm hỏng request: cache là để tăng tốc,
 *     không phải điều kiện để service hoạt động.
 */
@Configuration
public class CacheConfig implements CachingConfigurer {

    public static final String PRODUCT = "product";
    public static final String PRODUCT_SEARCH = "productSearch";

    private static final Logger log = LoggerFactory.getLogger(CacheConfig.class);

    @Bean
    RedisCacheManagerBuilderCustomizer redisCacheCustomizer() {
        RedisCacheConfiguration base = RedisCacheConfiguration.defaultCacheConfig()
                .prefixCacheNameWith("product-service:")      // nhiều service dùng chung Redis -> tránh trùng key
                .disableCachingNullValues();
        return builder -> builder
                .cacheDefaults(base.entryTtl(Duration.ofMinutes(5)))
                .withCacheConfiguration(PRODUCT, base.entryTtl(Duration.ofMinutes(10)))
                .withCacheConfiguration(PRODUCT_SEARCH, base.entryTtl(Duration.ofMinutes(1)))
                .transactionAware();
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException e, Cache cache, Object key) {
                log.warn("Đọc cache {} lỗi, truy vấn thẳng DB: {}", cache.getName(), e.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException e, Cache cache, Object key, Object value) {
                log.warn("Ghi cache {} lỗi, bỏ qua: {}", cache.getName(), e.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException e, Cache cache, Object key) {
                log.error("Xóa cache {} key {} lỗi — dữ liệu có thể cũ tới hết TTL", cache.getName(), key, e);
            }

            @Override
            public void handleCacheClearError(RuntimeException e, Cache cache) {
                log.error("Xóa toàn bộ cache {} lỗi — dữ liệu có thể cũ tới hết TTL", cache.getName(), e);
            }
        };
    }
}
