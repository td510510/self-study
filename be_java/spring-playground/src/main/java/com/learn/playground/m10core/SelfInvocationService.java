package com.learn.playground.m10core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Module 10 — BẪY PROXY, lỗi kinh điển nhất của người mới dùng Spring.
 *
 * Gọi /m10/self-invocation và đọc kết quả:
 *   - Gọi từ NGOÀI vào (qua proxy)      -> aspect chạy, @Transactional có hiệu lực
 *   - Gọi NỘI BỘ (this.method())        -> đi thẳng, KHÔNG qua proxy, annotation vô hiệu
 *
 * Cùng lý do đó, @Transactional / @Cacheable / @Async / @PreAuthorize
 * đều "im lặng không làm gì" khi bị gọi nội bộ — không có lỗi nào báo cả.
 */
@Service
public class SelfInvocationService {

    private static final Logger log = LoggerFactory.getLogger(SelfInvocationService.class);

    /** Gọi trực tiếp từ controller -> đi qua proxy -> aspect @Timed chạy. */
    @TimingAspect.Timed
    @org.springframework.transaction.annotation.Transactional
    public String duocProxy() {
        boolean active = TransactionSynchronizationManager.isActualTransactionActive();
        log.info("[SELF-INVOCATION] duocProxy(): transaction đang mở = {}", active);
        return "Gọi từ ngoài: transactionActive=" + active + " (aspect @Timed có chạy, xem console)";
    }

    /** Method này gọi nội bộ sang duocProxy() -> KHÔNG qua proxy. */
    public String goiNoiBo() {
        log.info("[SELF-INVOCATION] goiNoiBo() -> this.duocProxy()");
        String result = duocProxy();          // ❌ this.duocProxy(), proxy bị bỏ qua hoàn toàn
        return "Gọi nội bộ: " + result
                + " -> để ý transactionActive=false và console KHÔNG có dòng [AOP]";
    }

    /**
     * Cách sửa đúng: tách sang bean khác rồi tiêm vào.
     * (Cách khác: tự tiêm chính mình bằng @Lazy — chạy được nhưng xấu;
     *  hoặc dùng TransactionTemplate khi chỉ cần transaction.)
     */
    @Service
    public static class Fixed {

        private final SelfInvocationService target;

        public Fixed(SelfInvocationService target) { this.target = target; }

        public String goiQuaBeanKhac() {
            return "Gọi qua bean khác: " + target.duocProxy() + " -> annotation hoạt động bình thường ✅";
        }
    }
}
