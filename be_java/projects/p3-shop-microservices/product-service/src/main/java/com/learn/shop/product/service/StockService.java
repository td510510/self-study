package com.learn.shop.product.service;

import com.learn.shop.product.config.CacheConfig;
import com.learn.shop.product.domain.Product;
import com.learn.shop.product.domain.StockReservation;
import com.learn.shop.product.dto.StockDtos.ReleaseResponse;
import com.learn.shop.product.dto.StockDtos.ReserveItem;
import com.learn.shop.product.dto.StockDtos.ReserveRequest;
import com.learn.shop.product.dto.StockDtos.ReserveResponse;
import com.learn.shop.product.dto.StockDtos.ReservedItem;
import com.learn.shop.product.exception.ApiException;
import com.learn.shop.product.repository.ProductRepository;
import com.learn.shop.product.repository.StockReservationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;

/**
 * Giữ kho / hoàn kho cho saga đặt hàng (docs/saga-order-flow.md).
 *
 * Hai yêu cầu bắt buộc của hợp đồng:
 *  - reserve IDEMPOTENT theo orderId: order-service retry (vì timeout) không được trừ kho hai lần.
 *  - release IDEMPOTENT theo orderId: job bù trừ gọi lại bao nhiêu lần cũng chỉ hoàn kho một lần.
 */
@Service
public class StockService {

    private static final Logger log = LoggerFactory.getLogger(StockService.class);

    private final ProductRepository productRepository;
    private final StockReservationRepository reservationRepository;
    private final CacheManager cacheManager;

    public StockService(ProductRepository productRepository, StockReservationRepository reservationRepository,
                        CacheManager cacheManager) {
        this.productRepository = productRepository;
        this.reservationRepository = reservationRepository;
        this.cacheManager = cacheManager;
    }

    /**
     * Toàn bộ đơn nằm trong MỘT transaction: sản phẩm thứ 3 hết hàng thì việc trừ kho sản phẩm 1, 2
     * cũng bị rollback — không bao giờ giữ kho "một nửa đơn".
     */
    @Transactional
    public ReserveResponse reserve(ReserveRequest req) {
        // 1. Idempotency: đơn này đã giữ kho rồi -> trả lại đúng kết quả cũ, KHÔNG trừ thêm.
        List<StockReservation> existing = reservationRepository.findByOrderIdOrderByProductId(req.orderId());
        if (!existing.isEmpty()) {
            if (existing.get(0).getStatus() == StockReservation.Status.RELEASED) {
                throw ApiException.orderAlreadyReleased(req.orderId());
            }
            log.info("Reserve lặp lại cho orderId={} -> trả kết quả cũ, không trừ kho thêm", req.orderId());
            return toReserveResponse(req.orderId(), existing);
        }

        // 2. Gộp dòng trùng sản phẩm và SẮP XẾP theo productId.
        //    Hai đơn cùng mua {A, B} nhưng một đơn khóa A rồi chờ B, đơn kia khóa B rồi chờ A -> DEADLOCK.
        //    Luôn khóa theo cùng một thứ tự thì không thể xảy ra vòng chờ.
        Map<Long, Integer> quantities = new TreeMap<>();
        for (ReserveItem item : req.items()) quantities.merge(item.productId(), item.quantity(), Integer::sum);

        // 3. Nạp sản phẩm để chốt giá và tên tại thời điểm đặt hàng.
        List<StockReservation> reservations = new ArrayList<>();
        Map<Long, String> names = new TreeMap<>();
        for (var e : quantities.entrySet()) {
            Product p = productRepository.findById(e.getKey()).orElseThrow(() -> ApiException.productNotFound(e.getKey()));
            if (!p.isActive()) throw ApiException.productInactive(p.getId(), p.getName());
            names.put(p.getId(), p.getName());
            reservations.add(new StockReservation(req.orderId(), p.getId(), e.getValue(), p.getPrice()));
        }

        // 4. Ghi reservation TRƯỚC khi trừ kho. Hai request cùng orderId tới đồng thời: request sau bị
        //    UNIQUE (order_id, product_id) chặn ngay tại đây -> DataIntegrityViolationException -> 409,
        //    chưa kịp trừ kho. order-service gọi lại sẽ rơi vào nhánh idempotent ở bước 1.
        reservationRepository.saveAllAndFlush(reservations);

        // 5. Trừ kho nguyên tử từng sản phẩm.
        for (var e : quantities.entrySet()) {
            int updated = productRepository.decreaseStock(e.getKey(), e.getValue());
            if (updated == 0) {
                int available = productRepository.findById(e.getKey()).map(Product::getStock).orElse(0);
                log.info("Không đủ hàng: orderId={} productId={} cần {} còn {}",
                        req.orderId(), e.getKey(), e.getValue(), available);
                throw ApiException.insufficientStock(e.getKey(), names.get(e.getKey()), e.getValue(), available);
            }
        }

        evictProducts(quantities.keySet());
        log.info("Giữ kho thành công orderId={} ({} sản phẩm)", req.orderId(), quantities.size());
        return toReserveResponse(req.orderId(), reservations, names);
    }

    @Transactional
    public ReleaseResponse release(Long orderId) {
        // Khóa các dòng RESERVED của đơn. Request release thứ hai tới đồng thời sẽ chờ ở đây,
        // rồi thấy danh sách rỗng (đã RELEASED) -> không hoàn kho lần hai.
        List<StockReservation> reserved =
                reservationRepository.findByOrderIdAndStatus(orderId, StockReservation.Status.RESERVED);
        if (reserved.isEmpty()) {
            log.info("Release orderId={}: không có gì để hoàn (đã hoàn trước đó hoặc chưa từng giữ kho)", orderId);
            return new ReleaseResponse(orderId, false, List.of(), "Không có tồn kho nào đang được giữ cho đơn này");
        }

        reserved.forEach(StockReservation::release);                 // đổi trạng thái trước...
        reserved.forEach(r -> productRepository.increaseStock(r.getProductId(), r.getQuantity()));  // ...rồi hoàn kho

        evictProducts(reserved.stream().map(StockReservation::getProductId).toList());
        log.info("Hoàn kho orderId={} ({} sản phẩm)", orderId, reserved.size());
        List<ReservedItem> items = reserved.stream()
                .map(r -> new ReservedItem(r.getProductId(), null, r.getQuantity(), r.getUnitPrice()))
                .toList();
        return new ReleaseResponse(orderId, true, items, "Đã hoàn kho");
    }

    /** Tồn kho đổi -> xóa cache chi tiết của đúng các sản phẩm đó và toàn bộ cache danh sách. */
    private void evictProducts(Iterable<Long> productIds) {
        Optional.ofNullable(cacheManager.getCache(CacheConfig.PRODUCT))
                .ifPresent(cache -> productIds.forEach(cache::evict));
        Optional.ofNullable(cacheManager.getCache(CacheConfig.PRODUCT_SEARCH)).ifPresent(c -> c.clear());
    }

    private ReserveResponse toReserveResponse(Long orderId, List<StockReservation> reservations) {
        Map<Long, String> names = new TreeMap<>();
        productRepository.findAllById(reservations.stream().map(StockReservation::getProductId).toList())
                .forEach(p -> names.put(p.getId(), p.getName()));
        return toReserveResponse(orderId, reservations, names);
    }

    private ReserveResponse toReserveResponse(Long orderId, List<StockReservation> reservations, Map<Long, String> names) {
        List<ReservedItem> items = reservations.stream()
                .map(r -> new ReservedItem(r.getProductId(), names.get(r.getProductId()), r.getQuantity(), r.getUnitPrice()))
                .toList();
        long total = items.stream().mapToLong(i -> i.unitPrice() * i.quantity()).sum();
        return new ReserveResponse(orderId, true, items, total);
    }
}
