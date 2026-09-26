package patterns;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/** Nhóm khởi tạo: Singleton, Factory (static factory + theo tham số), Builder. */
public class CreationalDemo {

    public static void main(String[] args) {
        singleton();
        staticFactory();
        factoryTheoThamSo();
        builder();
    }

    // ============================================================ SINGLETON

    /** Cách viết Singleton an toàn và gọn nhất. */
    enum IdGenerator {
        INSTANCE;

        private long current = 1000;

        public synchronized long next() {
            return ++current;
        }
    }

    static void singleton() {
        System.out.println("--- Singleton ---");
        IdGenerator a = IdGenerator.INSTANCE;
        IdGenerator b = IdGenerator.INSTANCE;
        System.out.println("a == b ? " + (a == b));
        System.out.println("Mã đơn: " + a.next() + ", " + b.next());
        System.out.println("-> Đi làm: để Spring quản lý bean singleton thay vì tự viết (dễ thay khi test).");
    }

    // ============================================================ STATIC FACTORY

    /** Tiền tệ: constructor private, tạo qua factory method có tên rõ nghĩa. */
    static final class Money {
        private static final Money ZERO_VND = new Money(BigDecimal.ZERO, "VND");

        private final BigDecimal amount;
        private final String currency;

        private Money(BigDecimal amount, String currency) {
            if (amount.signum() < 0) throw new IllegalArgumentException("Số tiền âm: " + amount);
            this.amount = amount;
            this.currency = currency;
        }

        static Money ofVnd(long amount) {
            return amount == 0 ? ZERO_VND : new Money(BigDecimal.valueOf(amount), "VND");  // tái dùng object có sẵn
        }

        static Money ofUsd(String amount) {
            return new Money(new BigDecimal(amount), "USD");
        }

        static Money zero() {
            return ZERO_VND;
        }

        Money plus(Money other) {
            if (!currency.equals(other.currency)) throw new IllegalArgumentException("Khác loại tiền");
            return new Money(amount.add(other.amount), currency);
        }

        @Override
        public String toString() {
            return amount.toPlainString() + " " + currency;
        }
    }

    static void staticFactory() {
        System.out.println("\n--- Static factory method ---");
        System.out.println(Money.ofVnd(50_000).plus(Money.ofVnd(20_000)));
        System.out.println(Money.ofUsd("19.99"));
        System.out.println("Money.ofVnd(0) == Money.zero() ? " + (Money.ofVnd(0) == Money.zero()));
        System.out.println("Integer.valueOf(127) == Integer.valueOf(127) ? "
                + (Integer.valueOf(127) == Integer.valueOf(127)) + "  (factory có cache)");
        System.out.println("Integer.valueOf(128) == Integer.valueOf(128) ? "
                + (Integer.valueOf(128) == Integer.valueOf(128)) + " (ngoài vùng cache -> luôn dùng equals!)");
    }

    // ============================================================ FACTORY THEO THAM SỐ

    enum Channel { EMAIL, SMS, PUSH }

    interface Notifier {
        String send(String to, String message);
    }

    static class NotifierFactory {
        static Notifier create(Channel channel) {
            return switch (channel) {                // switch trên enum: thiếu nhánh thì compiler báo lỗi
                case EMAIL -> (to, msg) -> "[EMAIL tới " + to + "] " + msg;
                case SMS -> (to, msg) -> "[SMS tới " + to + "] " + msg.substring(0, Math.min(msg.length(), 30));
                case PUSH -> (to, msg) -> "[PUSH tới thiết bị của " + to + "] " + msg;
            };
        }
    }

    static void factoryTheoThamSo() {
        System.out.println("\n--- Factory theo tham số ---");
        for (Channel c : Channel.values()) {
            System.out.println(NotifierFactory.create(c).send("an@shop.vn", "Đơn hàng #1001 đã được xác nhận thành công"));
        }
    }

    // ============================================================ BUILDER

    record OrderItem(String sku, int quantity, long unitPrice) { }

    /** Bất biến: mọi field final, danh sách được bọc unmodifiable. */
    static final class Order {
        private final long customerId;
        private final String shippingAddress;
        private final List<OrderItem> items;
        private final String note;              // tùy chọn
        private final String voucherCode;       // tùy chọn
        private final boolean giftWrap;         // tùy chọn, mặc định false

        private Order(Builder b) {
            this.customerId = b.customerId;
            this.shippingAddress = b.shippingAddress;
            this.items = Collections.unmodifiableList(new ArrayList<>(b.items));
            this.note = b.note;
            this.voucherCode = b.voucherCode;
            this.giftWrap = b.giftWrap;
        }

        static Builder builder() {
            return new Builder();
        }

        long total() {
            return items.stream().mapToLong(i -> i.quantity() * i.unitPrice()).sum();
        }

        @Override
        public String toString() {
            return "Order{customer=" + customerId + ", address='" + shippingAddress + "', items=" + items.size()
                    + ", total=" + total() + ", note=" + note + ", voucher=" + voucherCode + ", giftWrap=" + giftWrap + "}";
        }

        static final class Builder {
            private Long customerId;
            private String shippingAddress;
            private final List<OrderItem> items = new ArrayList<>();
            private String note;
            private String voucherCode;
            private boolean giftWrap;

            Builder customerId(long id) { this.customerId = id; return this; }
            Builder shippingAddress(String a) { this.shippingAddress = a; return this; }
            Builder item(String sku, int qty, long price) { items.add(new OrderItem(sku, qty, price)); return this; }
            Builder note(String n) { this.note = n; return this; }
            Builder voucherCode(String v) { this.voucherCode = v; return this; }
            Builder giftWrap(boolean g) { this.giftWrap = g; return this; }

            /** Mọi kiểm tra hợp lệ dồn về đây -> không thể tồn tại Order ở trạng thái sai. */
            Order build() {
                Objects.requireNonNull(customerId, "customerId là bắt buộc");
                if (shippingAddress == null || shippingAddress.isBlank())
                    throw new IllegalStateException("Thiếu địa chỉ giao hàng");
                if (items.isEmpty()) throw new IllegalStateException("Đơn hàng phải có ít nhất 1 sản phẩm");
                return new Order(this);
            }
        }
    }

    static void builder() {
        System.out.println("\n--- Builder ---");
        Order order = Order.builder()
                .customerId(42)
                .shippingAddress("123 Đường ABC, Hà Nội")
                .item("LT-DELL-01", 1, 22_000_000)
                .item("MOUSE-01", 2, 350_000)
                .giftWrap(true)
                .build();
        System.out.println(order);

        try {
            Order.builder().customerId(42).shippingAddress("HN").build();
        } catch (IllegalStateException e) {
            System.out.println("build() chặn đơn sai: " + e.getMessage());
        }
    }
}
