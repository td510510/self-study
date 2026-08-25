package com.learn.playground.m14cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Module 14 — cache.
 *
 * Sân tập này dùng cache trong bộ nhớ (ConcurrentMapCacheManager mặc định của Spring)
 * để chạy được ngay mà không cần Redis. Khác biệt cần nhớ:
 *   - Cache trong bộ nhớ: nhanh nhất, nhưng MỖI INSTANCE một bản riêng -> chạy 3 instance
 *     là 3 bản cache lệch nhau.
 *   - Redis: chậm hơn chút (~1ms) nhưng DÙNG CHUNG cho mọi instance -> lựa chọn mặc định
 *     cho backend nhiều instance.
 *
 * Biến đếm `dbHits` cho biết method THẬT SỰ chạy bao nhiêu lần —
 * đó là cách chứng minh cache có hoạt động hay không.
 */
@Service
public class CachedProductService {

    private static final Logger log = LoggerFactory.getLogger(CachedProductService.class);

    private final AtomicInteger dbHits = new AtomicInteger();

    /**
     * Lần đầu: chạy method (chậm 1 giây, giả lập query nặng).
     * Lần sau: Spring trả thẳng từ cache, KHÔNG vào method — dbHits không tăng.
     */
    @Cacheable(value = "products", key = "#id")
    public String findById(Long id) {
        dbHits.incrementAndGet();
        log.info("[CACHE MISS] Truy vấn DB cho sản phẩm {} (mất 1 giây)", id);
        sleep(1000);
        return "Sản phẩm #" + id + " (dữ liệu lấy lúc " + System.currentTimeMillis() % 100000 + ")";
    }

    /** Sửa dữ liệu -> phải xóa cache, nếu không client đọc mãi dữ liệu cũ. */
    @CacheEvict(value = "products", key = "#id")
    public String evict(Long id) {
        log.info("[CACHE EVICT] Xóa cache của sản phẩm {}", id);
        return "Đã xóa cache của sản phẩm " + id;
    }

    /** Luôn chạy method VÀ cập nhật lại cache bằng giá trị mới. */
    @CachePut(value = "products", key = "#id")
    public String update(Long id, String newName) {
        dbHits.incrementAndGet();
        log.info("[CACHE PUT] Cập nhật sản phẩm {} và ghi đè cache", id);
        return newName + " (cập nhật lúc " + System.currentTimeMillis() % 100000 + ")";
    }

    /**
     * ⚠ BẪY PROXY, giống hệt @Transactional (Module 10).
     * Method này gọi this.findById() -> KHÔNG qua proxy -> cache VÔ HIỆU.
     * Gọi 3 lần thì dbHits tăng 3 — cache không hề chạy, và không có lỗi nào báo.
     */
    public String goiNoiBoKhongCache(Long id) {
        return findById(id);
    }

    public int getDbHits() { return dbHits.get(); }

    public void resetHits() { dbHits.set(0); }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
