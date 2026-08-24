package oop;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Interface + Dependency Injection thủ công.
 * Đây chính xác là mô hình Spring sẽ làm tự động cho bạn ở Module 10.
 *
 * Thêm cổng thanh toán mới = thêm 1 class, KHÔNG sửa PaymentService (Open/Closed).
 */
public class PaymentDemo {

    // ----- Abstraction -----
    public interface PaymentGateway {
        String name();
        void pay(String orderId, long amount);
    }

    public interface Notifier {
        void send(String to, String message);
    }

    // ----- Các cài đặt cụ thể -----
    public static class MomoGateway implements PaymentGateway {
        @Override public String name() { return "MOMO"; }
        @Override public void pay(String orderId, long amount) {
            System.out.println("  [Momo] thanh toán " + amount + "đ cho đơn " + orderId);
        }
    }

    public static class VnPayGateway implements PaymentGateway {
        @Override public String name() { return "VNPAY"; }
        @Override public void pay(String orderId, long amount) {
            System.out.println("  [VNPay] thanh toán " + amount + "đ cho đơn " + orderId);
        }
    }

    public static class EmailNotifier implements Notifier {
        @Override public void send(String to, String msg) {
            System.out.println("  [Email -> " + to + "] " + msg);
        }
    }

    // ----- Service phụ thuộc INTERFACE, nhận qua constructor -----
    public static class PaymentService {
        private final Map<String, PaymentGateway> gateways;
        private final Notifier notifier;

        public PaymentService(Map<String, PaymentGateway> gateways, Notifier notifier) {
            this.gateways = gateways;
            this.notifier = notifier;
        }

        public void checkout(String orderId, String gatewayName, long amount, String email) {
            PaymentGateway gateway = gateways.get(gatewayName);
            if (gateway == null) {
                throw new IllegalArgumentException("Không hỗ trợ cổng: " + gatewayName);
            }
            System.out.println("Xử lý đơn " + orderId + " qua " + gateway.name());
            gateway.pay(orderId, amount);
            notifier.send(email, "Đơn " + orderId + " đã thanh toán " + amount + "đ");
        }
    }

    public static void main(String[] args) {
        // "Composition root" — nơi lắp ráp các phụ thuộc (Spring sẽ làm hộ)
        Map<String, PaymentGateway> gateways = new LinkedHashMap<>();
        for (PaymentGateway g : new PaymentGateway[]{new MomoGateway(), new VnPayGateway()}) {
            gateways.put(g.name(), g);
        }

        PaymentService service = new PaymentService(gateways, new EmailNotifier());
        service.checkout("DH001", "MOMO", 250_000, "a@example.com");
        service.checkout("DH002", "VNPAY", 1_200_000, "b@example.com");

        try {
            service.checkout("DH003", "PAYPAL", 100_000, "c@example.com");
        } catch (IllegalArgumentException e) {
            System.out.println("Lỗi: " + e.getMessage());
        }

        // Khi test: thay thật bằng giả, không cần sửa PaymentService
        System.out.println("\n--- Chạy với cổng giả (dùng khi viết test) ---");
        PaymentGateway fake = new PaymentGateway() {
            @Override public String name() { return "FAKE"; }
            @Override public void pay(String orderId, long amount) {
                System.out.println("  [Fake] giả vờ thanh toán " + amount);
            }
        };
        new PaymentService(Map.of("FAKE", fake), (to, msg) -> System.out.println("  [Fake mail] " + msg))
                .checkout("DH004", "FAKE", 999, "test@example.com");
    }
}
