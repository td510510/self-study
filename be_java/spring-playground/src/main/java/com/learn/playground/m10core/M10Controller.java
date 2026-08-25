package com.learn.playground.m10core;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/** Module 10 — các endpoint demo. Gọi rồi ĐỌC CẢ CONSOLE. */
@RestController
@RequestMapping("/m10")
public class M10Controller {

    // ✅ Cách 1: constructor injection — cách duy nhất nên dùng
    private final PaymentService paymentService;
    private final CounterService counterService;
    private final AppProperties appProperties;
    private final SelfInvocationService selfInvocationService;
    private final SelfInvocationService.Fixed fixed;

    // Chỉ định đích danh một bean trong nhiều bean cùng kiểu
    private final PaymentGateway momoGateway;

    // ❌ Cách 3: field injection — để ở đây CHỈ để so sánh, đừng bắt chước
    @Autowired
    private PaymentService fieldInjected;

    public M10Controller(PaymentService paymentService,
                         CounterService counterService,
                         AppProperties appProperties,
                         SelfInvocationService selfInvocationService,
                         SelfInvocationService.Fixed fixed,
                         @Qualifier("MOMO") PaymentGateway momoGateway) {
        this.paymentService = paymentService;
        this.counterService = counterService;
        this.appProperties = appProperties;
        this.selfInvocationService = selfInvocationService;
        this.fixed = fixed;
        this.momoGateway = momoGateway;
    }

    @GetMapping("/di")
    public Map<String, Object> di() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("constructor injection", "field final -> bất biến, thiếu bean thì LỖI LÚC KHỞI ĐỘNG, test được bằng new");
        r.put("field injection", "gọn nhưng: không final, không test được nếu thiếu Spring, giấu việc class quá nhiều phụ thuộc");
        r.put("@Qualifier(\"MOMO\")", momoGateway.pay("DEMO-1", 150_000));
        r.put("cùng một bean?", (paymentService == fieldInjected)
                + " — Spring chỉ tạo MỘT instance (singleton), hai cách tiêm cùng trỏ về nó");
        return r;
    }

    @GetMapping("/strategy")
    public Map<String, Object> strategy(@RequestParam(defaultValue = "MOMO") String type) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("cổng đang hỗ trợ", paymentService.supported());
        try {
            r.put("kết quả", paymentService.pay(type, "DH-" + System.currentTimeMillis() % 1000, 250_000));
        } catch (IllegalArgumentException e) {
            r.put("lỗi", e.getMessage());
        }
        r.put("ghi chú", "Thêm cổng mới = thêm 1 class @Component(\"TÊN\"). PaymentService không đổi 1 dòng.");
        return r;
    }

    /** Bean singleton + state thay đổi được = sai dữ liệu. Xem lại Module 06. */
    @GetMapping("/singleton-bug")
    public Map<String, Object> singletonBug() throws Exception {
        counterService.reset();
        int threads = 100, loops = 1_000;

        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                try {
                    for (int j = 0; j < loops; j++) {
                        counterService.incrementUnsafe();
                        counterService.incrementSafe();
                    }
                } finally { latch.countDown(); }
            });
        }
        latch.await(30, TimeUnit.SECONDS);
        pool.shutdown();

        int expected = threads * loops;
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("kỳ vọng", expected);
        r.put("int counter++ (không đồng bộ)", counterService.getUnsafeCounter());
        r.put("ArrayList.add (không đồng bộ)", counterService.getUnsafeListSize());
        r.put("AtomicInteger", counterService.getSafeCounter());
        r.put("kết luận", counterService.getUnsafeCounter() == expected
                ? "Lần này may mắn đúng — gọi lại vài lần nữa sẽ thấy sai"
                : "SAI như dự đoán: bean singleton dùng chung cho mọi request/thread");
        r.put("quy tắc", "@Service/@Component KHÔNG được chứa state thay đổi được");
        return r;
    }

    @GetMapping("/config")
    public Map<String, Object> config() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("app.shop.name", appProperties.name());
        r.put("app.shop.maxItemsPerOrder", appProperties.maxItemsPerOrder());
        r.put("app.shop.freeShippingThreshold", appProperties.freeShippingThreshold());
        r.put("thử đi", "Sửa application.yml đặt max-items-per-order: 0 rồi khởi động lại "
                + "-> ứng dụng KHÔNG chạy được. Cấu hình sai bị chặn ngay lúc deploy.");
        return r;
    }

    @GetMapping("/aop")
    public Map<String, Object> aop() {
        String result = selfInvocationService.duocProxy();
        return Map.of(
                "kết quả", result,
                "xem console", "phải có dòng [AOP] ... chạy hết ... ms");
    }

    @GetMapping("/self-invocation")
    public Map<String, Object> selfInvocation() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("1. gọi từ ngoài (qua proxy)", selfInvocationService.duocProxy());
        r.put("2. gọi nội bộ this.method()", selfInvocationService.goiNoiBo());
        r.put("3. cách sửa: tách sang bean khác", fixed.goiQuaBeanKhac());
        r.put("bài học", "So sánh transactionActive ở mục 1 và 2, và đếm số dòng [AOP] trong console. "
                + "Đây là lý do @Transactional 'không hoạt động' trong rất nhiều dự án thật.");
        return r;
    }
}
