package fp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Dữ liệu mẫu dùng chung cho StreamDemo và CollectorsDemo. */
public final class Shop {

    public enum Status { PENDING, PAID, SHIPPED, CANCELLED }

    public record Item(String product, String category, BigDecimal price, int qty) {
        public BigDecimal lineTotal() { return price.multiply(BigDecimal.valueOf(qty)); }
    }

    public record Customer(Long id, String name, String city, int age) { }

    public record Order(Long id, Customer customer, LocalDate date, Status status, List<Item> items) {
        public BigDecimal total() {
            return items.stream().map(Item::lineTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        }
    }

    public static final Customer AN = new Customer(1L, "An", "Hà Nội", 25);
    public static final Customer BINH = new Customer(2L, "Bình", "TP.HCM", 34);
    public static final Customer CUONG = new Customer(3L, "Cường", "Hà Nội", 17);
    public static final Customer DUNG = new Customer(4L, "Dung", "Đà Nẵng", 42);

    public static List<Customer> customers() { return List.of(AN, BINH, CUONG, DUNG); }

    public static List<Order> orders() {
        return List.of(
            new Order(101L, AN, LocalDate.of(2026, 1, 15), Status.PAID, List.of(
                    new Item("Bàn phím cơ", "Phụ kiện", bd("1200000"), 1),
                    new Item("Chuột không dây", "Phụ kiện", bd("450000"), 2))),
            new Order(102L, BINH, LocalDate.of(2026, 1, 20), Status.SHIPPED, List.of(
                    new Item("Laptop Dell", "Máy tính", bd("22000000"), 1))),
            new Order(103L, AN, LocalDate.of(2026, 2, 3), Status.CANCELLED, List.of(
                    new Item("Tai nghe", "Phụ kiện", bd("890000"), 1))),
            new Order(104L, CUONG, LocalDate.of(2026, 2, 10), Status.PAID, List.of(
                    new Item("Màn hình 24\"", "Máy tính", bd("3500000"), 2),
                    new Item("Cáp HDMI", "Phụ kiện", bd("120000"), 3))),
            new Order(105L, DUNG, LocalDate.of(2026, 3, 1), Status.PENDING, List.of(
                    new Item("Laptop MacBook", "Máy tính", bd("35000000"), 1),
                    new Item("Bàn phím cơ", "Phụ kiện", bd("1200000"), 1))),
            new Order(106L, BINH, LocalDate.of(2026, 3, 12), Status.PAID, List.of(
                    new Item("Ổ cứng SSD", "Linh kiện", bd("1800000"), 2)))
        );
    }

    static BigDecimal bd(String s) { return new BigDecimal(s); }

    private Shop() { }
}
