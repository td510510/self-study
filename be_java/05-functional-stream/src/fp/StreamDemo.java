package fp;

import fp.Shop.Item;
import fp.Shop.Order;
import fp.Shop.Status;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.IntStream;
import java.util.stream.Stream;

/** Stream API: tạo, phép trung gian, phép kết thúc, lazy, và các bẫy. */
public class StreamDemo {

    public static void main(String[] args) {
        taoStream();
        phepTrungGian();
        phepKetThuc();
        lazyEvaluation();
        cacBay();
        congThucThucTe();
    }

    static void taoStream() {
        System.out.println("--- Tạo stream ---");
        System.out.println("Stream.of        : " + Stream.of("a", "b", "c").toList());
        System.out.println("IntStream.range  : " + IntStream.range(1, 6).boxed().toList());
        System.out.println("rangeClosed      : " + IntStream.rangeClosed(1, 5).sum());
        System.out.println("iterate + limit  : " + Stream.iterate(1, x -> x * 2).limit(8).toList());
        System.out.println("generate         : " + Stream.generate(() -> "x").limit(3).toList());
    }

    static void phepTrungGian() {
        System.out.println("\n--- Phép trung gian ---");
        List<Order> orders = Shop.orders();

        System.out.println("filter (PAID)    : " + orders.stream()
                .filter(o -> o.status() == Status.PAID).map(Order::id).toList());

        System.out.println("map (tên KH)     : " + orders.stream()
                .map(o -> o.customer().name()).distinct().toList());

        System.out.println("flatMap (mọi SP) : " + orders.stream()
                .flatMap(o -> o.items().stream()).map(Item::product).distinct().toList());

        System.out.println("sorted theo tiền : " + orders.stream()
                .sorted(Comparator.comparing(Order::total).reversed())
                .map(o -> o.id() + "=" + o.total()).toList());

        System.out.println("skip+limit (trang 2, cỡ 2): " + orders.stream()
                .skip(2).limit(2).map(Order::id).toList());
    }

    static void phepKetThuc() {
        System.out.println("\n--- Phép kết thúc ---");
        List<Order> orders = Shop.orders();

        System.out.println("count PAID       : " + orders.stream().filter(o -> o.status() == Status.PAID).count());
        System.out.println("anyMatch > 30tr  : " + orders.stream().anyMatch(o -> o.total().compareTo(new BigDecimal("30000000")) > 0));
        System.out.println("allMatch có item : " + orders.stream().allMatch(o -> !o.items().isEmpty()));
        System.out.println("noneMatch rỗng   : " + orders.stream().noneMatch(o -> o.items().isEmpty()));

        System.out.println("max (đơn lớn nhất): " + orders.stream()
                .max(Comparator.comparing(Order::total)).map(Order::id).orElse(null));
        System.out.println("findFirst PENDING : " + orders.stream()
                .filter(o -> o.status() == Status.PENDING).findFirst().map(Order::id).orElse(null));

        BigDecimal doanhThu = orders.stream()
                .filter(o -> o.status() != Status.CANCELLED)
                .map(Order::total)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        System.out.println("reduce doanh thu : " + doanhThu);

        System.out.println("summaryStatistics: " + Shop.customers().stream()
                .mapToInt(Shop.Customer::age).summaryStatistics());
    }

    static void lazyEvaluation() {
        System.out.println("\n--- Lazy: không có phép kết thúc thì KHÔNG chạy gì ---");
        Stream<String> s = Stream.of("a", "b", "c")
                .filter(x -> { System.out.println("  filter " + x); return true; })
                .map(x -> { System.out.println("  map " + x); return x.toUpperCase(); });
        System.out.println("Đã khai báo stream, chưa in gì cả.");
        System.out.println("Gọi toList() -> lúc này mới chạy, và chạy theo từng phần tử:");
        System.out.println("  kết quả = " + s.toList());

        System.out.println("\nshort-circuit: findFirst dừng ngay khi tìm thấy");
        String found = Stream.of("a", "bb", "ccc", "dddd")
                .peek(x -> System.out.println("  duyệt " + x))
                .filter(x -> x.length() >= 2)
                .findFirst().orElse(null);
        System.out.println("  tìm được = " + found);
    }

    static void cacBay() {
        System.out.println("\n--- Các bẫy ---");

        Stream<String> s = Stream.of("a", "b");
        s.toList();
        try {
            s.toList();
        } catch (IllegalStateException e) {
            System.out.println("Dùng lại stream  -> IllegalStateException (stream chỉ dùng 1 lần)");
        }

        try {
            Stream.of(new Shop.Customer(1L, "A", "HN", 20), new Shop.Customer(1L, "B", "HN", 30))
                  .collect(java.util.stream.Collectors.toMap(Shop.Customer::id, c -> c));
        } catch (IllegalStateException e) {
            System.out.println("toMap trùng key   -> IllegalStateException; phải truyền hàm merge");
        }
        var map = Stream.of(new Shop.Customer(1L, "A", "HN", 20), new Shop.Customer(1L, "B", "HN", 30))
                .collect(java.util.stream.Collectors.toMap(Shop.Customer::id, c -> c, (a, b) -> a));
        System.out.println("Có hàm merge      -> " + map);

        List<String> withNull = java.util.Arrays.asList("a", null, "b");
        System.out.println("Lọc null          -> " + withNull.stream().filter(Objects::nonNull).toList());

        System.out.println("Boxing: dùng mapToInt thay Stream<Integer> khi tính toán số lượng lớn");
    }

    static void congThucThucTe() {
        System.out.println("\n--- Công thức dùng hằng ngày ---");
        List<Order> orders = Shop.orders();

        System.out.println("Danh sách id      : " + orders.stream().map(Order::id).toList());

        var byId = orders.stream().collect(java.util.stream.Collectors.toMap(Order::id, o -> o));
        System.out.println("Map tra cứu O(1)  : keys = " + byId.keySet());

        System.out.println("Top 3 đơn giá trị : " + orders.stream()
                .sorted(Comparator.comparing(Order::total).reversed()).limit(3)
                .map(o -> o.id() + " (" + o.total() + ")").toList());

        System.out.println("Email nối chuỗi   : " + Shop.customers().stream()
                .map(Shop.Customer::name).collect(java.util.stream.Collectors.joining(", ", "[", "]")));

        System.out.println("Tổng số lượng SP  : " + orders.stream()
                .flatMap(o -> o.items().stream()).mapToInt(Item::qty).sum());
    }
}
