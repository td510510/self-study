package com.learn.playground.m14cache;

import com.learn.playground.m14cache.OrderEventDemo.MailBox;
import com.learn.playground.m14cache.OrderEventDemo.OrderService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/** Module 14 — cache & sự kiện. Gọi rồi so sánh thời gian và số lần chạm "DB". */
@RestController
@RequestMapping("/m14")
public class M14Controller {

    private final CachedProductService productService;
    private final OrderService orderService;
    private final MailBox mailBox;

    public M14Controller(CachedProductService productService, OrderService orderService, MailBox mailBox) {
        this.productService = productService;
        this.orderService = orderService;
        this.mailBox = mailBox;
    }

    /** Gọi 2 lần liên tiếp: lần 1 ~1000ms, lần 2 ~0ms. */
    @GetMapping("/cache/{id}")
    public Map<String, Object> cache(@PathVariable Long id) {
        long t = System.currentTimeMillis();
        String value = productService.findById(id);
        long ms = System.currentTimeMillis() - t;

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("giá trị", value);
        r.put("thời gian (ms)", ms);
        r.put("số lần chạm DB từ khi khởi động", productService.getDbHits());
        r.put("kết luận", ms < 100
                ? "CACHE HIT ✅ — method không hề chạy, dbHits không tăng"
                : "CACHE MISS — method chạy thật. Gọi lại lần nữa để thấy khác biệt.");
        return r;
    }

    @GetMapping("/cache/{id}/evict")
    public Map<String, Object> evict(@PathVariable Long id) {
        return Map.of(
                "kết quả", productService.evict(id),
                "tiếp theo", "Gọi lại /m14/cache/" + id + " -> lại chậm 1 giây (cache đã bị xóa)",
                "quy tắc", "Dữ liệu thay đổi thì PHẢI xóa cache, nếu không client đọc mãi dữ liệu cũ");
    }

    /** Bẫy proxy: gọi nội bộ khiến @Cacheable im lặng không hoạt động. */
    @GetMapping("/cache/{id}/self-invocation")
    public Map<String, Object> selfInvocation(@PathVariable Long id) {
        productService.resetHits();

        long t = System.currentTimeMillis();
        for (int i = 0; i < 3; i++) productService.goiNoiBoKhongCache(id);
        long ms = System.currentTimeMillis() - t;

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("gọi 3 lần qua method nội bộ", ms + " ms");
        r.put("số lần chạm DB", productService.getDbHits());
        r.put("kết luận", productService.getDbHits() >= 3
                ? "Cache KHÔNG hoạt động ❌ — gọi this.findById() đi thẳng, không qua proxy"
                : "Cache có hoạt động");
        r.put("nhắc lại", "@Cacheable / @Transactional / @Async / @PreAuthorize đều dùng proxy. "
                + "Gọi nội bộ trong cùng class là chúng im lặng không làm gì.");
        return r;
    }

    /**
     * Cache stampede: một key vừa hết hạn, 20 luồng cùng ập vào.
     * Không có cơ chế bảo vệ thì cả 20 cùng chạy query nặng.
     */
    @GetMapping("/stampede")
    public Map<String, Object> stampede() throws Exception {
        Long hotKey = 999L;
        productService.evict(hotKey);
        productService.resetHits();

        long t = System.currentTimeMillis();
        ExecutorService pool = Executors.newFixedThreadPool(20);
        CountDownLatch latch = new CountDownLatch(20);
        for (int i = 0; i < 20; i++) {
            pool.submit(() -> {
                try { productService.findById(hotKey); } finally { latch.countDown(); }
            });
        }
        latch.await(30, TimeUnit.SECONDS);
        pool.shutdown();
        long ms = System.currentTimeMillis() - t;

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("20 luồng cùng đọc 1 key vừa hết hạn", ms + " ms");
        r.put("số lần method THẬT SỰ chạy", productService.getDbHits());
        r.put("mong muốn", 1);
        r.put("giải thích", "Nhiều hơn 1 nghĩa là nhiều luồng cùng dựng lại cache — đó là cache stampede. "
                + "Trên hệ thống thật, một key nóng hết hạn có thể kéo theo hàng nghìn query cùng lúc.");
        r.put("cách chặn", "Khóa phân tán (Redis SET NX) khi dựng lại cache, hoặc làm mới cache trước khi hết hạn");
        return r;
    }

    /** So sánh @TransactionalEventListener(AFTER_COMMIT) và @EventListener. */
    @GetMapping("/event")
    public Map<String, Object> event() throws Exception {
        mailBox.clear();

        long t = System.currentTimeMillis();
        orderService.createOrder("DH-OK", "khach@example.com");
        long apiMs = System.currentTimeMillis() - t;

        String loi;
        try {
            orderService.createOrderThenFail("DH-FAIL", "khach@example.com");
            loi = "(không có lỗi)";
        } catch (IllegalStateException e) {
            loi = e.getMessage();
        }

        Thread.sleep(800);          // chờ listener bất đồng bộ chạy xong

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("thời gian API tạo đơn (ms)", apiMs);
        r.put("ghi chú tốc độ", "API không chờ gửi mail (300ms) vì listener chạy @Async");
        r.put("đơn DH-FAIL", "transaction bị rollback: " + loi);
        r.put("mail đã gửi", mailBox.all());
        r.put("kết luận", mailBox.all().stream().noneMatch(m -> m.contains("DH-FAIL"))
                ? "Chỉ DH-OK được gửi mail ✅ — AFTER_COMMIT đã chặn mail của đơn bị rollback"
                : "DH-FAIL cũng được gửi mail ❌ — kiểm tra lại phase của listener");
        r.put("xem console", "Dòng [@EventListener] vẫn chạy cho CẢ HAI đơn — đó là lý do "
                + "phải dùng @TransactionalEventListener(AFTER_COMMIT) cho việc gửi mail.");
        return r;
    }
}
