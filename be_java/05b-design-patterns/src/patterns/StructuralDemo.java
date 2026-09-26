package patterns;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Proxy;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Nhóm cấu trúc: Adapter, Decorator, Proxy (như Spring làm), Facade. */
public class StructuralDemo {

    public static void main(String[] args) {
        adapter();
        decorator();
        proxyNhuSpring();
        facade();
    }

    // ============================================================ ADAPTER

    /** Interface CỦA CHÚNG TA. */
    interface PaymentGateway {
        PaymentResult pay(String orderId, long amountVnd);
    }

    record PaymentResult(boolean success, String transactionId, String errorCode) {
        static PaymentResult ok(String txId) { return new PaymentResult(true, txId, null); }
        static PaymentResult failed(String code) { return new PaymentResult(false, null, code); }
    }

    /** Giả lập thư viện của đối tác — API "lệch" với hệ thống của ta, và ta KHÔNG sửa được. */
    static class MomoClient {
        record MomoRequest(String partnerRef, long amount, String currency) { }
        record MomoResponse(int resultCode, long transId, String message) { }

        MomoResponse createTransaction(MomoRequest req) {
            return req.amount() > 50_000_000
                    ? new MomoResponse(1002, 0, "Vượt hạn mức giao dịch")
                    : new MomoResponse(0, 88_000_123L, "Thành công");
        }
    }

    /** Chỉ class này biết về Momo. Đổi đối tác = viết adapter khác, phần còn lại không đổi. */
    static class MomoAdapter implements PaymentGateway {
        private final MomoClient client;

        MomoAdapter(MomoClient client) {
            this.client = client;
        }

        @Override
        public PaymentResult pay(String orderId, long amountVnd) {
            var res = client.createTransaction(new MomoClient.MomoRequest(orderId, amountVnd, "VND"));
            return res.resultCode() == 0
                    ? PaymentResult.ok(String.valueOf(res.transId()))
                    : PaymentResult.failed("MOMO_" + res.resultCode());
        }
    }

    static void adapter() {
        System.out.println("--- Adapter ---");
        PaymentGateway gateway = new MomoAdapter(new MomoClient());
        System.out.println(gateway.pay("ORD-1", 500_000));
        System.out.println(gateway.pay("ORD-2", 80_000_000));
    }

    // ============================================================ DECORATOR

    interface PriceService {
        long priceOf(String sku);
    }

    static class DbPriceService implements PriceService {
        int queries;

        @Override
        public long priceOf(String sku) {
            queries++;
            sleep(50);                                  // giả lập truy vấn DB chậm
            return sku.length() * 100_000L;
        }
    }

    static class CachingPriceService implements PriceService {
        private final PriceService inner;
        private final Map<String, Long> cache = new ConcurrentHashMap<>();

        CachingPriceService(PriceService inner) {
            this.inner = inner;
        }

        @Override
        public long priceOf(String sku) {
            return cache.computeIfAbsent(sku, inner::priceOf);
        }
    }

    static class TimingPriceService implements PriceService {
        private final PriceService inner;

        TimingPriceService(PriceService inner) {
            this.inner = inner;
        }

        @Override
        public long priceOf(String sku) {
            long start = System.nanoTime();
            long price = inner.priceOf(sku);
            System.out.printf("  priceOf(%s) = %,d (%d ms)%n", sku, price, (System.nanoTime() - start) / 1_000_000);
            return price;
        }
    }

    static void decorator() {
        System.out.println("\n--- Decorator: xếp chồng tính năng ---");
        DbPriceService db = new DbPriceService();
        PriceService service = new TimingPriceService(new CachingPriceService(db));
        service.priceOf("LAPTOP");
        service.priceOf("LAPTOP");
        service.priceOf("MOUSE");
        service.priceOf("LAPTOP");
        System.out.println("Số lần thật sự gọi DB: " + db.queries + " / 4");
    }

    // ============================================================ PROXY (như Spring)

    /** Annotation tự chế đóng vai @Transactional. */
    @java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME)
    @interface MyTransactional { }

    interface TransferService {
        @MyTransactional
        void transfer(String from, String to, long amount);

        @MyTransactional
        void payroll();
    }

    static class TransferServiceImpl implements TransferService {
        @Override
        public void transfer(String from, String to, long amount) {
            System.out.println("    chuyển " + amount + " từ " + from + " sang " + to);
            if (amount > 1_000_000) throw new IllegalStateException("Vượt hạn mức");
        }

        @Override
        public void payroll() {
            System.out.println("    trả lương hàng loạt:");
            transfer("CTY", "An", 500_000);             // gọi nội bộ qua `this` -> KHÔNG đi qua proxy
            transfer("CTY", "Bình", 2_000_000);
        }
    }

    /**
     * Đây là điều Spring làm với @Transactional: tạo một object "vỏ bọc" cùng interface,
     * chặn mọi lời gọi từ bên ngoài, làm việc trước/sau rồi mới gọi object thật.
     */
    @SuppressWarnings("unchecked")
    static <T> T transactionalProxy(T target, Class<T> type) {
        InvocationHandler handler = (proxy, method, args) -> {
            if (!method.isAnnotationPresent(MyTransactional.class)) return method.invoke(target, args);
            System.out.println("  [proxy] BEGIN transaction cho " + method.getName());
            try {
                Object result = method.invoke(target, args);
                System.out.println("  [proxy] COMMIT");
                return result;
            } catch (java.lang.reflect.InvocationTargetException e) {
                System.out.println("  [proxy] ROLLBACK vì " + e.getCause().getMessage());
                throw e.getCause();
            }
        };
        return (T) Proxy.newProxyInstance(type.getClassLoader(), new Class<?>[]{type}, handler);
    }

    static void proxyNhuSpring() {
        System.out.println("\n--- Proxy: tự dựng @Transactional như Spring ---");
        TransferService service = transactionalProxy(new TransferServiceImpl(), TransferService.class);
        System.out.println("Class thật của bean: " + service.getClass().getSimpleName() + " (không phải TransferServiceImpl)");

        System.out.println("\n1) Gọi từ bên ngoài -> đi qua proxy:");
        service.transfer("An", "Bình", 300_000);
        try {
            service.transfer("An", "Bình", 5_000_000);
        } catch (IllegalStateException ignored) {
        }

        System.out.println("\n2) payroll() gọi transfer() NỘI BỘ -> chỉ có 1 transaction bao ngoài,");
        System.out.println("   hai lần transfer bên trong không có BEGIN/COMMIT riêng:");
        try {
            service.payroll();
        } catch (IllegalStateException ignored) {
        }
        System.out.println("-> Đây chính là bẫy 'self-invocation' khiến @Transactional/@Cacheable/@Async im lặng vô hiệu.");
    }

    // ============================================================ FACADE

    static class InventoryService { void reserve(String sku, int qty) { System.out.println("  kho: giữ " + qty + " x " + sku); } }
    static class ShippingService { String schedule(String address) { System.out.println("  vận chuyển: lên lịch tới " + address); return "GHN-778899"; } }
    static class MailService { void send(String to, String msg) { System.out.println("  mail tới " + to + ": " + msg); } }
    static class LoyaltyService { void addPoints(String user, long amount) { System.out.println("  cộng " + amount / 10_000 + " điểm cho " + user); } }

    /** Controller chỉ cần gọi một method; facade điều phối 5 hệ thống con. */
    static class CheckoutFacade {
        private final InventoryService inventory = new InventoryService();
        private final PaymentGateway payment = new MomoAdapter(new MomoClient());
        private final ShippingService shipping = new ShippingService();
        private final MailService mail = new MailService();
        private final LoyaltyService loyalty = new LoyaltyService();

        String checkout(String user, String sku, int qty, long amount, String address) {
            inventory.reserve(sku, qty);
            PaymentResult paid = payment.pay("ORD-" + System.currentTimeMillis(), amount);
            if (!paid.success()) throw new IllegalStateException("Thanh toán thất bại: " + paid.errorCode());
            String tracking = shipping.schedule(address);
            mail.send(user, "Đơn hàng đang được giao, mã vận đơn " + tracking);
            loyalty.addPoints(user, amount);
            return tracking;
        }
    }

    static void facade() {
        System.out.println("\n--- Facade ---");
        String tracking = new CheckoutFacade().checkout("an@shop.vn", "LAPTOP", 1, 22_000_000, "Hà Nội");
        System.out.println("Controller chỉ nhận về: " + tracking);
    }

    static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
