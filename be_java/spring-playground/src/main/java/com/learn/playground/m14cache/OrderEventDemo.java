package com.learn.playground.m14cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Collections;

/**
 * Module 14 — tách tác vụ chậm ra khỏi luồng request bằng sự kiện.
 *
 * Điểm mấu chốt: @TransactionalEventListener(AFTER_COMMIT) khác @EventListener ở chỗ
 * nó chỉ chạy KHI TRANSACTION ĐÃ COMMIT THÀNH CÔNG.
 * Không có nó, bạn sẽ gửi email xác nhận cho một đơn hàng cuối cùng bị rollback.
 */
public class OrderEventDemo {

    public record OrderCreatedEvent(String orderId, String email, Instant occurredAt) {
        public static OrderCreatedEvent of(String orderId, String email) {
            return new OrderCreatedEvent(orderId, email, Instant.now());
        }
    }

    /** Nơi lưu "email đã gửi" để endpoint đọc lại và kiểm chứng. */
    @Component
    public static class MailBox {
        private final List<String> sent = Collections.synchronizedList(new ArrayList<>());

        public void add(String message) { sent.add(message); }
        public List<String> all() { return List.copyOf(sent); }
        public void clear() { sent.clear(); }
    }

    @Service
    public static class OrderService {

        private static final Logger log = LoggerFactory.getLogger(OrderService.class);

        private final ApplicationEventPublisher publisher;

        public OrderService(ApplicationEventPublisher publisher) { this.publisher = publisher; }

        /** Transaction thành công -> listener chạy -> "email" được gửi. */
        @Transactional
        public String createOrder(String orderId, String email) {
            log.info("[ORDER] Lưu đơn {} vào DB", orderId);
            publisher.publishEvent(OrderCreatedEvent.of(orderId, email));
            log.info("[ORDER] Đã phát sự kiện — API trả về NGAY, không chờ gửi mail");
            return orderId;
        }

        /** Transaction rollback -> listener KHÔNG chạy -> không gửi mail nhầm. */
        @Transactional
        public void createOrderThenFail(String orderId, String email) {
            log.info("[ORDER] Lưu đơn {} vào DB", orderId);
            publisher.publishEvent(OrderCreatedEvent.of(orderId, email));
            throw new IllegalStateException("Lỗi giả lập sau khi đã phát sự kiện");
        }
    }

    @Component
    public static class OrderEventListener {

        private static final Logger log = LoggerFactory.getLogger(OrderEventListener.class);

        private final MailBox mailBox;

        public OrderEventListener(MailBox mailBox) { this.mailBox = mailBox; }

        /**
         * ✅ Cách đúng: chỉ chạy sau khi transaction commit.
         * @Async để không giữ chân request (nhớ cấu hình pool riêng, đừng dùng pool mặc định).
         */
        @Async
        @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
        public void onCommitted(OrderCreatedEvent event) {
            CachedProductService.sleep(300);                 // giả lập gọi SMTP
            String msg = "Đã gửi mail xác nhận đơn %s tới %s".formatted(event.orderId(), event.email());
            log.info("[MAIL] {}", msg);
            mailBox.add(msg);
        }

        /**
         * ❌ Để so sánh: @EventListener thường chạy NGAY khi publishEvent được gọi,
         * kể cả khi transaction sau đó rollback -> gửi mail cho đơn hàng không tồn tại.
         */
        @EventListener
        public void onPublished(OrderCreatedEvent event) {
            log.info("[@EventListener] Chạy NGAY LẬP TỨC cho đơn {} — chưa biết transaction có commit hay không",
                    event.orderId());
        }
    }

    private OrderEventDemo() { }
}
