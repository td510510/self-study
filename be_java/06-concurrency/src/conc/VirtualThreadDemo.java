package conc;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Virtual Threads (Java 21+): chạy 10.000 tác vụ I/O.
 * So sánh platform thread pool vs virtual thread.
 */
public class VirtualThreadDemo {

    static final int TASKS = 10_000;
    static final int IO_MS = 100;     // giả lập chờ I/O (gọi API / query DB)

    public static void main(String[] args) throws Exception {
        soSanhCoBan();
        chayTacVuIO();
        thongTinThread();
    }

    static void soSanhCoBan() throws Exception {
        System.out.println("--- Tạo thread ---");
        Thread platform = Thread.ofPlatform().name("platform-1").start(() ->
                System.out.println("  Platform thread: " + Thread.currentThread()));
        platform.join();

        Thread virtual = Thread.ofVirtual().name("virtual-1").start(() ->
                System.out.println("  Virtual thread : " + Thread.currentThread()));
        virtual.join();
    }

    static void chayTacVuIO() throws Exception {
        System.out.printf("%n--- %,d tác vụ, mỗi tác vụ chờ I/O %dms ---%n", TASKS, IO_MS);

        System.out.println("Nếu chạy tuần tự sẽ mất: " + (TASKS * IO_MS / 1000) + " giây");

        AtomicInteger done1 = new AtomicInteger();
        Instant t = Instant.now();
        try (ExecutorService pool = Executors.newFixedThreadPool(200)) {
            for (int i = 0; i < TASKS; i++) {
                pool.submit(() -> { sleep(IO_MS); done1.incrementAndGet(); });
            }
        }
        System.out.printf("Platform pool (200 thread): %,d task trong %,d ms%n",
                done1.get(), Duration.between(t, Instant.now()).toMillis());

        AtomicInteger done2 = new AtomicInteger();
        t = Instant.now();
        try (ExecutorService vpool = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < TASKS; i++) {
                vpool.submit(() -> { sleep(IO_MS); done2.incrementAndGet(); });
            }
        }
        System.out.printf("Virtual thread (1/task)   : %,d task trong %,d ms%n",
                done2.get(), Duration.between(t, Instant.now()).toMillis());

        System.out.println("""

                Giải thích: virtual thread khi gặp lệnh chờ I/O sẽ "nhả" thread hệ điều hành
                cho task khác dùng, nên 10.000 tác vụ chờ đồng thời không cần 10.000 OS thread.
                Với Spring Boot 3.2+: spring.threads.virtual.enabled=true""");
    }

    static void thongTinThread() {
        System.out.println("\n--- Thông tin ---");
        System.out.println("Số nhân CPU khả dụng : " + Runtime.getRuntime().availableProcessors());
        System.out.println("Bộ nhớ tối đa JVM    : " + Runtime.getRuntime().maxMemory() / 1024 / 1024 + " MB");
        System.out.println("""

                Khi nào dùng gì:
                  - Tác vụ I/O (gọi API, DB, đọc file)  -> virtual thread
                  - Tác vụ nặng CPU (tính toán, mã hóa) -> pool cố định = số nhân CPU
                  - Trong virtual thread: dùng ReentrantLock thay synchronized""");
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
