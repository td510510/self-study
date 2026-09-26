package com.learn.shop.product;

import com.learn.shop.product.domain.Product;
import com.learn.shop.product.dto.StockDtos.ReleaseResponse;
import com.learn.shop.product.dto.StockDtos.ReserveItem;
import com.learn.shop.product.dto.StockDtos.ReserveRequest;
import com.learn.shop.product.dto.StockDtos.ReserveResponse;
import com.learn.shop.product.exception.ApiException;
import com.learn.shop.product.repository.StockReservationRepository;
import com.learn.shop.product.service.StockService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Giữ kho / hoàn kho cho saga")
class StockServiceIT extends AbstractIT {

    /** orderId khác nhau cho mỗi test: các test chạy chung một database. */
    private static final AtomicLong ORDER_IDS = new AtomicLong(System.currentTimeMillis());

    @Autowired StockService stockService;
    @Autowired StockReservationRepository reservationRepository;

    private static ReserveRequest request(long orderId, Object... productIdAndQty) {
        List<ReserveItem> items = new ArrayList<>();
        for (int i = 0; i < productIdAndQty.length; i += 2) {
            items.add(new ReserveItem((Long) productIdAndQty[i], (Integer) productIdAndQty[i + 1]));
        }
        return new ReserveRequest(orderId, items);
    }

    @Test
    @DisplayName("reserve trừ kho, tính đúng tổng tiền, và gọi lại cùng orderId KHÔNG trừ thêm")
    void reserveIdempotent() {
        Product a = newProduct(22_000_000, 10);
        Product b = newProduct(450_000, 10);
        long orderId = ORDER_IDS.incrementAndGet();

        ReserveResponse first = stockService.reserve(request(orderId, a.getId(), 2, b.getId(), 1));
        ReserveResponse retry = stockService.reserve(request(orderId, a.getId(), 2, b.getId(), 1));

        assertThat(first.totalAmount()).isEqualTo(44_450_000);
        assertThat(retry).isEqualTo(first);
        assertThat(stockOf(a.getId())).isEqualTo(8);
        assertThat(stockOf(b.getId())).isEqualTo(9);
    }

    @Test
    @DisplayName("dòng trùng sản phẩm trong cùng đơn được gộp lại")
    void gopDongTrung() {
        Product a = newProduct(100_000, 10);
        ReserveResponse res = stockService.reserve(request(ORDER_IDS.incrementAndGet(), a.getId(), 2, a.getId(), 3));
        assertThat(res.items()).singleElement().satisfies(i -> assertThat(i.quantity()).isEqualTo(5));
        assertThat(stockOf(a.getId())).isEqualTo(5);
    }

    @Test
    @DisplayName("một sản phẩm không đủ hàng -> 409 kèm details, và KHÔNG sản phẩm nào bị trừ (rollback cả đơn)")
    void khongDuHangRollback() {
        Product a = newProduct(100_000, 5);
        Product b = newProduct(200_000, 1);
        long orderId = ORDER_IDS.incrementAndGet();

        assertThatThrownBy(() -> stockService.reserve(request(orderId, a.getId(), 2, b.getId(), 3)))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getErrorCode()).isEqualTo("INSUFFICIENT_STOCK");
                    assertThat(e.getDetails()).containsEntry("productId", b.getId())
                            .containsEntry("requested", 3).containsEntry("available", 1);
                });

        assertThat(stockOf(a.getId())).isEqualTo(5);     // đã trừ a trước khi phát hiện b thiếu -> phải được hoàn lại
        assertThat(stockOf(b.getId())).isEqualTo(1);
        assertThat(reservationRepository.findByOrderIdOrderByProductId(orderId)).isEmpty();
    }

    @Test
    @DisplayName("release hoàn kho đúng MỘT lần dù gọi nhiều lần; reserve lại cùng orderId sau đó bị từ chối")
    void releaseIdempotent() {
        Product a = newProduct(100_000, 10);
        long orderId = ORDER_IDS.incrementAndGet();
        stockService.reserve(request(orderId, a.getId(), 4));

        ReleaseResponse first = stockService.release(orderId);
        ReleaseResponse second = stockService.release(orderId);

        assertThat(first.released()).isTrue();
        assertThat(second.released()).isFalse();
        assertThat(stockOf(a.getId())).isEqualTo(10);
        assertThatThrownBy(() -> stockService.reserve(request(orderId, a.getId(), 1)))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo("ORDER_ALREADY_RELEASED"));
    }

    @Test
    @DisplayName("release đơn chưa từng giữ kho -> không lỗi (bù trừ phải luôn an toàn)")
    void releaseDonKhongTonTai() {
        assertThat(stockService.release(ORDER_IDS.incrementAndGet()).released()).isFalse();
    }

    @Test
    @DisplayName("100 đơn khác nhau cùng mua sản phẩm còn 10 cái -> đúng 10 đơn thành công, tồn kho về 0, không âm")
    void khongBanQuaTonKho() throws Exception {
        Product hot = newProduct(1_000_000, 10);
        Map<String, Integer> outcomes = runConcurrently(100, i ->
                stockService.reserve(request(ORDER_IDS.incrementAndGet(), hot.getId(), 1)));

        assertThat(outcomes).containsEntry("OK", 10).containsEntry("INSUFFICIENT_STOCK", 90);
        assertThat(stockOf(hot.getId())).isZero();
    }

    @Test
    @DisplayName("20 request TRÙNG orderId tới cùng lúc (retry dồn dập) -> kho chỉ bị trừ một lần")
    void retryDongThoiCungOrderId() throws Exception {
        Product a = newProduct(100_000, 100);
        long orderId = ORDER_IDS.incrementAndGet();
        Map<String, Integer> outcomes = runConcurrently(20, i -> stockService.reserve(request(orderId, a.getId(), 2)));

        assertThat(stockOf(a.getId())).isEqualTo(98);
        assertThat(outcomes.getOrDefault("OK", 0)).isGreaterThanOrEqualTo(1);
        assertThat(outcomes.keySet()).isSubsetOf("OK", "DUPLICATE");
    }

    @Test
    @DisplayName("đơn {A,B} và đơn {B,A} chạy song song không bị deadlock (nhờ khóa theo thứ tự productId)")
    void khongDeadlock() throws Exception {
        Product a = newProduct(100_000, 1_000);
        Product b = newProduct(100_000, 1_000);
        Map<String, Integer> outcomes = runConcurrently(40, i -> i % 2 == 0
                ? stockService.reserve(request(ORDER_IDS.incrementAndGet(), a.getId(), 1, b.getId(), 1))
                : stockService.reserve(request(ORDER_IDS.incrementAndGet(), b.getId(), 1, a.getId(), 1)));

        assertThat(outcomes).containsOnlyKeys("OK").containsEntry("OK", 40);
        assertThat(stockOf(a.getId())).isEqualTo(960);
        assertThat(stockOf(b.getId())).isEqualTo(960);
    }

    interface Task {
        Object run(int index);
    }

    /** Thả N luồng cùng lúc (CountDownLatch làm "vạch xuất phát"), đếm kết quả theo loại. */
    private Map<String, Integer> runConcurrently(int threads, Task task) throws Exception {
        Map<String, Integer> outcomes = new ConcurrentHashMap<>();
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> futures = new ArrayList<>();
        try (ExecutorService pool = Executors.newFixedThreadPool(Math.min(threads, 32))) {
            for (int i = 0; i < threads; i++) {
                int index = i;
                futures.add(pool.submit(() -> {
                    start.await();
                    String key;
                    try {
                        task.run(index);
                        key = "OK";
                    } catch (ApiException e) {
                        key = e.getErrorCode();
                    } catch (DataIntegrityViolationException e) {
                        key = "DUPLICATE";
                    }
                    outcomes.merge(key, 1, Integer::sum);
                    return null;
                }));
            }
            start.countDown();
            for (Future<?> f : futures) f.get();       // lỗi không lường trước (ví dụ deadlock) sẽ nổ ở đây
        }
        return outcomes;
    }
}
