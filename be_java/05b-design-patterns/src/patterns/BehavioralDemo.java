package patterns;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;

/** Nhóm hành vi: Strategy, Template Method, Observer, Chain of Responsibility, State. */
public class BehavioralDemo {

    public static void main(String[] args) {
        strategy();
        templateMethod();
        observer();
        chainOfResponsibility();
        state();
    }

    // ============================================================ STRATEGY

    @FunctionalInterface
    interface ShippingFeeStrategy {
        long fee(int weightGrams, String province);
    }

    enum ShippingMethod { STANDARD, EXPRESS, PICKUP }

    /** Trong Spring: mỗi strategy là một @Component, tiêm vào dưới dạng Map. */
    static final Map<ShippingMethod, ShippingFeeStrategy> STRATEGIES = new EnumMap<>(Map.of(
            ShippingMethod.STANDARD, (w, p) -> 15_000 + (w / 1000) * 5_000,
            ShippingMethod.EXPRESS, (w, p) -> (p.equals("HN") ? 30_000 : 50_000) + (w / 1000) * 10_000,
            ShippingMethod.PICKUP, (w, p) -> 0));

    static void strategy() {
        System.out.println("--- Strategy ---");
        for (ShippingMethod m : ShippingMethod.values()) {
            System.out.printf("  %-8s 2.5kg tới HCM: %,d đ%n", m, STRATEGIES.get(m).fee(2500, "HCM"));
        }
        System.out.println("  Comparator cũng là Strategy: list.sort(Comparator.comparing(...)).");
    }

    // ============================================================ TEMPLATE METHOD

    record ImportReport(String source, int total, int valid) { }

    abstract static class DataImporter<T> {
        /** final: khung cố định, class con không đổi được thứ tự các bước. */
        public final ImportReport run(String source) {
            List<String> rows = readRows(source);
            List<T> valid = new ArrayList<>();
            for (String row : rows) {
                try {
                    T item = parse(row);
                    if (validate(item)) valid.add(item);
                } catch (RuntimeException e) {
                    System.out.println("    bỏ qua dòng lỗi: '" + row + "'");
                }
            }
            save(valid);
            return new ImportReport(source, rows.size(), valid.size());
        }

        protected abstract List<String> readRows(String source);

        protected abstract T parse(String row);

        protected boolean validate(T item) {            // hook: có mặc định, ghi đè nếu cần
            return true;
        }

        protected void save(List<T> items) {
            System.out.println("    lưu " + items.size() + " bản ghi");
        }
    }

    record Product(String sku, long price) { }

    static class CsvProductImporter extends DataImporter<Product> {
        @Override
        protected List<String> readRows(String source) {
            return List.of("LT-01,22000000", "MS-02,abc", "KB-03,-5", "HP-04,1500000");
        }

        @Override
        protected Product parse(String row) {
            String[] cols = row.split(",");
            return new Product(cols[0], Long.parseLong(cols[1]));
        }

        @Override
        protected boolean validate(Product p) {
            return p.price() > 0;
        }
    }

    static void templateMethod() {
        System.out.println("\n--- Template Method ---");
        System.out.println("  " + new CsvProductImporter().run("products.csv"));
        System.out.println("  JdbcTemplate.query(sql, rowMapper) là cùng ý tưởng, dùng callback thay cho kế thừa.");
    }

    // ============================================================ OBSERVER

    record OrderPlacedEvent(long orderId, String email, long amount) { }

    /** Phiên bản thu nhỏ của ApplicationEventPublisher trong Spring. */
    static class EventBus {
        private final List<Consumer<OrderPlacedEvent>> listeners = new ArrayList<>();

        void subscribe(Consumer<OrderPlacedEvent> listener) {
            listeners.add(listener);
        }

        void publish(OrderPlacedEvent event) {
            for (Consumer<OrderPlacedEvent> l : listeners) {
                try {
                    l.accept(event);
                } catch (RuntimeException e) {          // một listener lỗi không làm hỏng các listener khác
                    System.out.println("    listener lỗi: " + e.getMessage());
                }
            }
        }
    }

    static void observer() {
        System.out.println("\n--- Observer ---");
        EventBus bus = new EventBus();
        bus.subscribe(e -> System.out.println("    [mail] gửi xác nhận đơn " + e.orderId() + " tới " + e.email()));
        bus.subscribe(e -> System.out.println("    [loyalty] cộng " + e.amount() / 10_000 + " điểm"));
        bus.subscribe(e -> { throw new RuntimeException("dịch vụ thống kê đang bảo trì"); });
        bus.subscribe(e -> System.out.println("    [kho] cập nhật báo cáo bán hàng"));

        System.out.println("  OrderService chỉ phát sự kiện, không biết ai nghe:");
        bus.publish(new OrderPlacedEvent(1001, "an@shop.vn", 2_500_000));
    }

    // ============================================================ CHAIN OF RESPONSIBILITY

    record Request(String path, String token, String ip) { }

    interface Filter {
        void doFilter(Request req, FilterChain chain);
    }

    /** Giống hệt jakarta.servlet.FilterChain: mỗi filter quyết định có gọi tiếp hay không. */
    static class FilterChain {
        private final List<Filter> filters;
        private final Consumer<Request> endpoint;
        private int position = 0;

        FilterChain(List<Filter> filters, Consumer<Request> endpoint) {
            this.filters = filters;
            this.endpoint = endpoint;
        }

        void doFilter(Request req) {
            if (position < filters.size()) filters.get(position++).doFilter(req, this);
            else endpoint.accept(req);
        }
    }

    static final Set<String> BLOCKED_IPS = Set.of("6.6.6.6");

    static void chainOfResponsibility() {
        System.out.println("\n--- Chain of Responsibility (filter chain) ---");
        Filter logging = (req, chain) -> {
            System.out.println("    [log] " + req.path() + " từ " + req.ip());
            chain.doFilter(req);
        };
        Filter ipBlock = (req, chain) -> {
            if (BLOCKED_IPS.contains(req.ip())) System.out.println("    [ip] 403 — IP bị chặn, DỪNG chuỗi");
            else chain.doFilter(req);
        };
        Filter auth = (req, chain) -> {
            if (req.path().startsWith("/api/admin") && !"admin-token".equals(req.token()))
                System.out.println("    [auth] 401 — thiếu token, DỪNG chuỗi");
            else chain.doFilter(req);
        };
        List<Filter> filters = List.of(logging, ipBlock, auth);
        Consumer<Request> controller = req -> System.out.println("    [controller] xử lý " + req.path() + " -> 200 OK");

        for (Request r : List.of(
                new Request("/api/products", null, "1.2.3.4"),
                new Request("/api/admin/users", null, "1.2.3.4"),
                new Request("/api/admin/users", "admin-token", "1.2.3.4"),
                new Request("/api/products", null, "6.6.6.6"))) {
            System.out.println("  Request " + r.path() + (r.token() != null ? " (có token)" : ""));
            new FilterChain(filters, controller).doFilter(r);
        }
    }

    // ============================================================ STATE

    enum OrderStatus {
        PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED;

        private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED = new EnumMap<>(Map.of(
                PENDING, Set.of(CONFIRMED, CANCELLED),
                CONFIRMED, Set.of(SHIPPED, CANCELLED),
                SHIPPED, Set.of(DELIVERED),
                DELIVERED, Set.of(),
                CANCELLED, Set.of()));

        OrderStatus transitionTo(OrderStatus next) {
            if (!ALLOWED.get(this).contains(next)) {
                throw new IllegalStateException("Không thể chuyển " + this + " -> " + next);
            }
            return next;
        }

        boolean isFinal() {
            return ALLOWED.get(this).isEmpty();
        }
    }

    static void state() {
        System.out.println("\n--- State (máy trạng thái đơn hàng) ---");
        OrderStatus s = OrderStatus.PENDING;
        for (OrderStatus next : List.of(OrderStatus.CONFIRMED, OrderStatus.SHIPPED,
                OrderStatus.CANCELLED, OrderStatus.DELIVERED)) {
            try {
                s = s.transitionTo(next);
                System.out.println("  -> " + s + (s.isFinal() ? " (trạng thái cuối)" : ""));
            } catch (IllegalStateException e) {
                System.out.println("  ✗ " + e.getMessage());
            }
        }
    }
}
