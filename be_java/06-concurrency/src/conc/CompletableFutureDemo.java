package conc;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * CompletableFuture: rút ngắn thời gian phản hồi API bằng cách gọi song song.
 * Tình huống: trang "hồ sơ người dùng" cần gọi 3 service, mỗi cái ~300ms.
 */
public class CompletableFutureDemo {

    record User(Long id, String name) { }
    record Order(Long id, String product) { }
    record Profile(User user, List<Order> orders, int points) { }

    static final ExecutorService POOL = Executors.newFixedThreadPool(4);

    public static void main(String[] args) throws Exception {
        tuanTuVsSongSong();
        chuoiXuLy();
        xuLyLoi();
        timeout();

        POOL.shutdown();
        POOL.awaitTermination(5, TimeUnit.SECONDS);
    }

    static void tuanTuVsSongSong() {
        System.out.println("--- Tuần tự vs song song ---");

        long t = System.currentTimeMillis();
        User u = fetchUser(1L);
        List<Order> o = fetchOrders(1L);
        int p = fetchPoints(1L);
        Profile seq = new Profile(u, o, p);
        System.out.println("Tuần tự  : " + (System.currentTimeMillis() - t) + "ms  " + seq);

        t = System.currentTimeMillis();
        CompletableFuture<User> fu = CompletableFuture.supplyAsync(() -> fetchUser(1L), POOL);
        CompletableFuture<List<Order>> fo = CompletableFuture.supplyAsync(() -> fetchOrders(1L), POOL);
        CompletableFuture<Integer> fp = CompletableFuture.supplyAsync(() -> fetchPoints(1L), POOL);

        Profile par = CompletableFuture.allOf(fu, fo, fp)
                .thenApply(v -> new Profile(fu.join(), fo.join(), fp.join()))
                .join();
        System.out.println("Song song: " + (System.currentTimeMillis() - t) + "ms  " + par);
        System.out.println("=> Cùng dữ liệu, thời gian chờ giảm ~3 lần.");
    }

    static void chuoiXuLy() {
        System.out.println("\n--- Chuỗi xử lý ---");
        String result = CompletableFuture
                .supplyAsync(() -> fetchUser(2L), POOL)
                .thenApply(User::name)                       // biến đổi
                .thenApply(String::toUpperCase)
                .thenCombine(CompletableFuture.supplyAsync(() -> fetchPoints(2L), POOL),
                        (name, points) -> name + " có " + points + " điểm")   // gộp 2 luồng
                .join();
        System.out.println(result);

        CompletableFuture.supplyAsync(() -> fetchUser(3L), POOL)
                .thenAccept(user -> System.out.println("thenAccept: đã lấy " + user.name()))
                .join();
    }

    static void xuLyLoi() {
        System.out.println("\n--- Xử lý lỗi ---");

        String r1 = CompletableFuture.supplyAsync(() -> {
                    throw new IllegalStateException("Service tạm thời lỗi");
                }, POOL)
                .exceptionally(ex -> "giá trị dự phòng (" + ex.getCause().getMessage() + ")")
                .thenApply(Object::toString)
                .join();
        System.out.println("exceptionally: " + r1);

        String r2 = CompletableFuture.supplyAsync(() -> "ok", POOL)
                .handle((value, ex) -> ex != null ? "lỗi: " + ex.getMessage() : "thành công: " + value)
                .join();
        System.out.println("handle       : " + r2);
    }

    static void timeout() {
        System.out.println("\n--- Timeout ---");
        String r = CompletableFuture.supplyAsync(() -> {
                    sleep(2000);
                    return "kết quả chậm";
                }, POOL)
                .completeOnTimeout("dự phòng vì quá 500ms", 500, TimeUnit.MILLISECONDS)
                .join();
        System.out.println(r);
        System.out.println("(Trong thực tế: luôn đặt timeout khi gọi service ngoài)");
    }

    // ---- Giả lập các lệnh gọi chậm ----
    static User fetchUser(Long id) { sleep(300); return new User(id, "User-" + id); }
    static List<Order> fetchOrders(Long id) { sleep(300); return List.of(new Order(1L, "Laptop")); }
    static int fetchPoints(Long id) { sleep(300); return 1250; }

    static void sleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
