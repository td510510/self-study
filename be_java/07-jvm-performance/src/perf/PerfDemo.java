package perf;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;

/**
 * Những tối ưu thật sự tạo khác biệt (và những cái không).
 * Chạy: java -cp out perf.PerfDemo
 */
public class PerfDemo {

    record User(Long id, String name) { }
    record Order(Long id, Long userId) { }

    public static void main(String[] args) {
        warmup();
        traCuuListVsMap();
        containsListVsSet();
        boxingVsPrimitive();
        khaiBaoDungLuong();
        noiChuoi();
        ketLuan();
    }

    /** JIT cần "làm nóng" trước khi đo — nếu không số đo đầu tiên luôn sai lệch. */
    static void warmup() {
        long s = 0;
        for (int i = 0; i < 5_000_000; i++) s += i % 7;
        if (s < 0) System.out.println(s);
    }

    static void traCuuListVsMap() {
        System.out.println("--- Tra cứu: List O(n) vs Map O(1) ---");
        int n = 20_000;
        List<User> users = new ArrayList<>();
        for (int i = 0; i < n; i++) users.add(new User((long) i, "user-" + i));
        List<Order> orders = new ArrayList<>();
        for (int i = 0; i < 5_000; i++) orders.add(new Order((long) i, (long) (i % n)));

        long t = System.nanoTime();
        int found1 = 0;
        for (Order o : orders) {
            for (User u : users) { if (u.id().equals(o.userId())) { found1++; break; } }
        }
        double listTime = (System.nanoTime() - t) / 1e6;

        t = System.nanoTime();
        Map<Long, User> byId = new HashMap<>();
        for (User u : users) byId.put(u.id(), u);
        int found2 = 0;
        for (Order o : orders) { if (byId.get(o.userId()) != null) found2++; }
        double mapTime = (System.nanoTime() - t) / 1e6;

        System.out.printf("Duyệt List trong vòng lặp : %8.2f ms (%d kết quả)%n", listTime, found1);
        System.out.printf("Dựng Map rồi tra          : %8.2f ms (%d kết quả)%n", mapTime, found2);
        System.out.printf("Nhanh hơn ~%.0f lần%n", listTime / Math.max(mapTime, 0.01));
    }

    static void containsListVsSet() {
        System.out.println("\n--- contains(): List vs Set ---");
        int n = 50_000;
        List<Integer> list = new ArrayList<>();
        Set<Integer> set = new HashSet<>();
        for (int i = 0; i < n; i++) { list.add(i); set.add(i); }

        long t = System.nanoTime();
        int c1 = 0;
        for (int i = 0; i < 5_000; i++) if (list.contains(i * 7 % n)) c1++;
        double listTime = (System.nanoTime() - t) / 1e6;

        t = System.nanoTime();
        int c2 = 0;
        for (int i = 0; i < 5_000; i++) if (set.contains(i * 7 % n)) c2++;
        double setTime = (System.nanoTime() - t) / 1e6;

        System.out.printf("List.contains : %8.2f ms%n", listTime);
        System.out.printf("Set.contains  : %8.2f ms%n", setTime);
    }

    static void boxingVsPrimitive() {
        System.out.println("\n--- Boxing: Stream<Integer> vs IntStream ---");
        int n = 5_000_000;

        long t = System.nanoTime();
        long sum1 = IntStream.range(0, n).boxed().mapToLong(Integer::longValue).sum();
        double boxed = (System.nanoTime() - t) / 1e6;

        t = System.nanoTime();
        long sum2 = IntStream.range(0, n).asLongStream().sum();
        double primitive = (System.nanoTime() - t) / 1e6;

        System.out.printf("Có boxing     : %8.2f ms (tổng %d)%n", boxed, sum1);
        System.out.printf("Primitive     : %8.2f ms (tổng %d)%n", primitive, sum2);
    }

    static void khaiBaoDungLuong() {
        System.out.println("\n--- Khai báo sẵn dung lượng cho ArrayList/HashMap ---");
        int n = 1_000_000;

        long t = System.nanoTime();
        List<Integer> a = new ArrayList<>();
        for (int i = 0; i < n; i++) a.add(i);
        double khong = (System.nanoTime() - t) / 1e6;

        t = System.nanoTime();
        List<Integer> b = new ArrayList<>(n);
        for (int i = 0; i < n; i++) b.add(i);
        double co = (System.nanoTime() - t) / 1e6;

        System.out.printf("Không khai báo: %8.2f ms (phải copy mảng nhiều lần)%n", khong);
        System.out.printf("Khai báo sẵn  : %8.2f ms%n", co);
        System.out.println("(Chênh lệch nhỏ và nhiễu — thứ tự chạy, JIT và GC đều ảnh hưởng.");
        System.out.println(" Muốn đo tin cậy phải dùng JMH, đây chỉ là minh họa.)");
    }

    static void noiChuoi() {
        System.out.println("\n--- Nối chuỗi trong vòng lặp ---");
        int n = 30_000;

        long t = System.nanoTime();
        String s = "";
        for (int i = 0; i < n; i++) s += "x";
        double cong = (System.nanoTime() - t) / 1e6;

        t = System.nanoTime();
        StringBuilder sb = new StringBuilder(n);
        for (int i = 0; i < n; i++) sb.append("x");
        String r = sb.toString();
        double builder = (System.nanoTime() - t) / 1e6;

        System.out.printf("Toán tử +     : %8.2f ms (độ dài %d)%n", cong, s.length());
        System.out.printf("StringBuilder : %8.2f ms (độ dài %d)%n", builder, r.length());
    }

    static void ketLuan() {
        System.out.println("""

                --- Thứ tự ưu tiên khi tối ưu backend ---
                1. Truy vấn DB (N+1, thiếu index, SELECT *)      <- ~80% nguyên nhân API chậm
                2. Gọi mạng (tuần tự thay vì song song, thiếu cache/timeout)
                3. Thuật toán/cấu trúc dữ liệu (O(n²) -> O(n))   <- các demo ở trên
                4. Bộ nhớ & GC
                5. Vi tối ưu Java                                <- gần như không đáng kể

                Và luôn: ĐO TRƯỚC, tối ưu sau. Đừng đoán.""");
    }
}
