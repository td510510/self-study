package fp;

import fp.Shop.Customer;
import fp.Shop.Item;
import fp.Shop.Order;
import fp.Shop.Status;

import java.math.BigDecimal;
import java.time.format.TextStyle;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

/** Collectors: groupingBy, partitioningBy, thống kê — phần giá trị nhất của Stream API. */
public class CollectorsDemo {

    public static void main(String[] args) {
        gomNhomCoBan();
        gomNhomNangCao();
        chiaDoi();
        thongKe();
        baoCaoTongHop();
    }

    static void gomNhomCoBan() {
        System.out.println("--- groupingBy ---");
        List<Customer> customers = Shop.customers();

        Map<String, List<String>> theoThanhPho = customers.stream()
                .collect(Collectors.groupingBy(Customer::city,
                         Collectors.mapping(Customer::name, Collectors.toList())));
        System.out.println("Khách theo TP     : " + theoThanhPho);

        Map<String, Long> demTheoTP = customers.stream()
                .collect(Collectors.groupingBy(Customer::city, Collectors.counting()));
        System.out.println("Đếm theo TP       : " + demTheoTP);

        Map<String, Double> tuoiTB = customers.stream()
                .collect(Collectors.groupingBy(Customer::city, Collectors.averagingInt(Customer::age)));
        System.out.println("Tuổi TB theo TP   : " + tuoiTB);
    }

    static void gomNhomNangCao() {
        System.out.println("\n--- groupingBy nâng cao ---");
        List<Order> orders = Shop.orders();

        // Doanh thu theo trạng thái đơn
        Map<Status, BigDecimal> doanhThuTheoTrangThai = orders.stream()
                .collect(Collectors.groupingBy(Order::status,
                         Collectors.reducing(BigDecimal.ZERO, Order::total, BigDecimal::add)));
        System.out.println("Doanh thu/trạng thái : " + doanhThuTheoTrangThai);

        // Doanh thu theo danh mục sản phẩm (flatMap + groupingBy)
        Map<String, BigDecimal> theoDanhMuc = orders.stream()
                .flatMap(o -> o.items().stream())
                .collect(Collectors.groupingBy(Item::category,
                         Collectors.reducing(BigDecimal.ZERO, Item::lineTotal, BigDecimal::add)));
        System.out.println("Doanh thu/danh mục   : " + theoDanhMuc);

        // Gom nhóm 2 tầng: thành phố -> trạng thái -> số đơn
        Map<String, Map<Status, Long>> haiTang = orders.stream()
                .collect(Collectors.groupingBy(o -> o.customer().city(),
                         Collectors.groupingBy(Order::status, Collectors.counting())));
        System.out.println("2 tầng TP/trạng thái : " + haiTang);

        // Nhóm theo tháng, dùng TreeMap để có thứ tự
        Map<String, List<Long>> theoThang = orders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.date().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH),
                        TreeMap::new,
                        Collectors.mapping(Order::id, Collectors.toList())));
        System.out.println("Đơn theo tháng       : " + theoThang);

        // Đơn hàng lớn nhất mỗi khách
        Map<String, Optional<Order>> donLonNhat = orders.stream()
                .collect(Collectors.groupingBy(o -> o.customer().name(),
                         Collectors.maxBy(Comparator.comparing(Order::total))));
        donLonNhat.forEach((k, v) -> System.out.println("  " + k + " -> đơn " +
                v.map(o -> o.id() + " (" + o.total() + ")").orElse("-")));
    }

    static void chiaDoi() {
        System.out.println("\n--- partitioningBy ---");
        Map<Boolean, List<String>> nguoiLon = Shop.customers().stream()
                .collect(Collectors.partitioningBy(c -> c.age() >= 18,
                         Collectors.mapping(Customer::name, Collectors.toList())));
        System.out.println("Đủ 18 tuổi   : " + nguoiLon.get(true));
        System.out.println("Chưa đủ 18   : " + nguoiLon.get(false));
    }

    static void thongKe() {
        System.out.println("\n--- Thống kê ---");
        var stats = Shop.customers().stream().collect(Collectors.summarizingInt(Customer::age));
        System.out.println("Tuổi: min=" + stats.getMin() + ", max=" + stats.getMax()
                + ", avg=" + stats.getAverage() + ", count=" + stats.getCount());

        System.out.println("joining      : " + Shop.customers().stream()
                .map(Customer::name).collect(Collectors.joining(" | ")));

        System.out.println("toSet (TP)   : " + Shop.customers().stream()
                .map(Customer::city).collect(Collectors.toSet()));

        System.out.println("teeing (min & max tuổi): " + Shop.customers().stream()
                .collect(Collectors.teeing(
                        Collectors.minBy(Comparator.comparingInt(Customer::age)),
                        Collectors.maxBy(Comparator.comparingInt(Customer::age)),
                        (min, max) -> min.map(Customer::name).orElse("-") + " / "
                                    + max.map(Customer::name).orElse("-"))));
    }

    static void baoCaoTongHop() {
        System.out.println("\n--- Báo cáo bán hàng (giống việc thật) ---");
        List<Order> orders = Shop.orders();

        BigDecimal doanhThu = orders.stream()
                .filter(o -> o.status() != Status.CANCELLED)
                .map(Order::total).reduce(BigDecimal.ZERO, BigDecimal::add);

        System.out.printf("Tổng doanh thu (bỏ đơn hủy): %,d VND%n", doanhThu.longValue());
        System.out.println("Số đơn theo trạng thái     : " + orders.stream()
                .collect(Collectors.groupingBy(Order::status, TreeMap::new, Collectors.counting())));

        System.out.println("\nTop sản phẩm theo số lượng bán:");
        orders.stream()
                .flatMap(o -> o.items().stream())
                .collect(Collectors.groupingBy(Item::product, Collectors.summingInt(Item::qty)))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(5)
                .forEach(e -> System.out.printf("  %-18s %d cái%n", e.getKey(), e.getValue()));

        System.out.println("\nKhách chi nhiều nhất:");
        orders.stream()
                .filter(o -> o.status() != Status.CANCELLED)
                .collect(Collectors.groupingBy(o -> o.customer().name(),
                         Collectors.reducing(BigDecimal.ZERO, Order::total, BigDecimal::add)))
                .entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .forEach(e -> System.out.printf("  %-8s %,15d VND%n", e.getKey(), e.getValue().longValue()));
    }
}
