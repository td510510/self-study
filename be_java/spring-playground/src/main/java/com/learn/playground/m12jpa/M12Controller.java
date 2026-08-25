package com.learn.playground.m12jpa;

import com.learn.playground.m12jpa.Repositories.ProductRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Module 12 — các endpoint chứng minh bằng SỐ LIỆU, không phải bằng lời.
 *
 * Bật sẵn show-sql trong application.yml: mỗi lần gọi, hãy vừa xem JSON trả về
 * vừa đếm số câu SELECT trong console.
 */
@RestController
@RequestMapping("/m12")
public class M12Controller {

    private final M12Service service;
    private final ProductRepository productRepository;

    public M12Controller(M12Service service, ProductRepository productRepository) {
        this.service = service;
        this.productRepository = productRepository;
    }

    /** ❌ N+1: xem queryCount tăng theo số bài viết. */
    @GetMapping("/n-plus-1/bad")
    public Map<String, Object> bad() {
        var counted = service.countQueries(service::listBad);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("cách làm", "findAll() rồi chạm article.getAuthor().getName() trong vòng lặp");
        r.put("số câu SQL", counted.queryCount());
        r.put("thời gian (ms)", String.format("%.1f", counted.millis()));
        r.put("giải thích", "1 query lấy danh sách + 1 query cho MỖI bài viết = N+1");
        r.put("dữ liệu", counted.result());
        return r;
    }

    /** ✅ Cùng dữ liệu, 3 cách chữa. So sánh queryCount với /bad. */
    @GetMapping("/n-plus-1/good")
    public Map<String, Object> good() {
        var joinFetch = service.countQueries(service::listJoinFetch);
        var entityGraph = service.countQueries(service::listEntityGraph);
        var projection = service.countQueries(service::listProjection);
        var bad = service.countQueries(service::listBad);

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("❌ N+1 (findAll + lazy)", Map.of(
                "queries", bad.queryCount(), "ms", String.format("%.1f", bad.millis())));
        r.put("✅ JOIN FETCH", Map.of(
                "queries", joinFetch.queryCount(), "ms", String.format("%.1f", joinFetch.millis())));
        r.put("✅ @EntityGraph", Map.of(
                "queries", entityGraph.queryCount(), "ms", String.format("%.1f", entityGraph.millis())));
        r.put("✅ DTO projection", Map.of(
                "queries", projection.queryCount(), "ms", String.format("%.1f", projection.millis())));
        r.put("dữ liệu trả về giống hệt nhau", joinFetch.result());
        r.put("bài học", "Cùng một kết quả, số query chênh nhau nhiều lần. "
                + "Trên bảng 1000 bài viết, đây là khác biệt giữa 30ms và 3 giây.");
        return r;
    }

    @GetMapping("/dirty-checking")
    public Map<String, Object> dirtyChecking() {
        Long id = service.anyArticleId();
        if (id == null) return Map.of("lỗi", "Chưa có dữ liệu mẫu");

        return Map.of(
                "kết quả", service.dirtyChecking(id),
                "xem console", "có câu 'update articles set ...' dù code KHÔNG gọi save()",
                "cơ chế", "Trong transaction, Hibernate theo dõi entity và tự sinh UPDATE lúc commit");
    }

    @GetMapping("/rollback")
    public Map<String, Object> rollback() {
        Long id = service.anyAuthorId();
        if (id == null) return Map.of("lỗi", "Chưa có dữ liệu mẫu");

        String truoc = service.readAuthorName(id);
        String loi;
        try {
            service.rollbackDemo(id);
            loi = "(không có lỗi — sai kịch bản)";
        } catch (IllegalStateException e) {
            loi = e.getMessage();
        }
        String sau = service.readAuthorName(id);

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("tên trước khi gọi", truoc);
        r.put("exception ném ra", loi);
        r.put("tên sau khi rollback", sau);
        r.put("kết luận", truoc.equals(sau)
                ? "Giống nhau ✅ — RuntimeException khiến @Transactional rollback toàn bộ"
                : "Khác nhau ❌ — transaction không hoạt động, kiểm tra lại cấu hình");
        r.put("lưu ý", "Mặc định chỉ unchecked exception mới rollback. "
                + "Checked exception cần @Transactional(rollbackFor = Exception.class)");
        return r;
    }

    /** 100 luồng cùng mua sản phẩm chỉ còn 10 cái. Đúng ra chỉ 10 đơn được thành công. */
    @GetMapping("/atomic-stock")
    public Map<String, Object> atomicStock(@RequestParam(defaultValue = "10") int stock) throws Exception {
        Long productId = productRepository.findByName("Laptop Demo")
                .map(Product::getId)
                .orElseGet(() -> productRepository.save(new Product("Laptop Demo", stock)).getId());

        Map<String, Object> r = new LinkedHashMap<>();
        r.put("tồn kho ban đầu", stock);
        r.put("số luồng cùng mua", 100);
        r.put("unsafe_java_read_write", chay(productId, stock, false));
        r.put("safe_atomic_update", chay(productId, stock, true));
        r.put("bài học", "Chỉ database mới bảo vệ được dữ liệu khi nhiều tiến trình cùng ghi. "
                + "Khóa trong Java vô dụng ngay khi bạn chạy 2 instance (Module 06).");
        return r;
    }

    private Map<String, Object> chay(Long productId, int stock, boolean safe) throws Exception {
        service.resetStock(productId, stock);

        AtomicInteger thanhCong = new AtomicInteger();
        ExecutorService pool = Executors.newFixedThreadPool(20);
        CountDownLatch latch = new CountDownLatch(100);
        for (int i = 0; i < 100; i++) {
            pool.submit(() -> {
                try {
                    boolean ok = safe ? service.buySafe(productId) : service.buyUnsafe(productId);
                    if (ok) thanhCong.incrementAndGet();
                } catch (Exception ignored) {
                    // optimistic lock / tranh chấp -> coi như mua thất bại
                } finally {
                    latch.countDown();
                }
            });
        }
        latch.await(30, TimeUnit.SECONDS);
        pool.shutdown();

        int conLai = service.currentStock(productId);
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("don_thanh_cong", thanhCong.get());
        r.put("ton_kho_con_lai", conLai);
        r.put("dung_chua", (thanhCong.get() == stock && conLai == 0)
                ? "ĐÚNG ✅" : "SAI ❌ (bán quá tồn kho hoặc số liệu không khớp)");
        return r;
    }

    @GetMapping("/data")
    public List<String> data() {
        return service.listJoinFetch();
    }
}
