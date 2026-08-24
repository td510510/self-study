package conc;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Race condition: nhìn tận mắt dữ liệu bị sai, rồi 3 cách sửa.
 * Chạy nhiều lần — kết quả sai sẽ khác nhau mỗi lần (đó là lý do bug này khó chịu).
 */
public class RaceConditionDemo {

    static final int THREADS = 100;
    static final int LOOPS = 10_000;
    static final int EXPECTED = THREADS * LOOPS;

    // ---- Các phiên bản counter ----
    static class UnsafeCounter {
        private int count = 0;
        void increment() { count++; }              // đọc - cộng - ghi: KHÔNG nguyên tử
        int get() { return count; }
    }

    static class SyncCounter {
        private int count = 0;
        synchronized void increment() { count++; }
        synchronized int get() { return count; }
    }

    static class AtomicCounter {
        private final AtomicInteger count = new AtomicInteger();
        void increment() { count.incrementAndGet(); }
        int get() { return count.get(); }
    }

    public static void main(String[] args) throws Exception {
        System.out.println("Kỳ vọng: " + EXPECTED + " (100 thread × 10.000 lần)\n");

        UnsafeCounter unsafe = new UnsafeCounter();
        runAll(unsafe::increment);
        System.out.printf("Không đồng bộ  : %,7d  %s%n", unsafe.get(),
                unsafe.get() == EXPECTED ? "(may mắn đúng, chạy lại sẽ sai)" : "❌ MẤT DỮ LIỆU");

        SyncCounter sync = new SyncCounter();
        long t = System.nanoTime();
        runAll(sync::increment);
        long syncTime = System.nanoTime() - t;
        System.out.printf("synchronized   : %,7d  ✅  (%.0f ms)%n", sync.get(), syncTime / 1e6);

        AtomicCounter atomic = new AtomicCounter();
        t = System.nanoTime();
        runAll(atomic::increment);
        long atomicTime = System.nanoTime() - t;
        System.out.printf("AtomicInteger  : %,7d  ✅  (%.0f ms — thường nhanh hơn)%n", atomic.get(), atomicTime / 1e6);

        collectionKhongAnToan();
        visibilityVolatile();
    }

    static void runAll(Runnable action) throws InterruptedException {
        ExecutorService pool = Executors.newFixedThreadPool(THREADS);
        CountDownLatch latch = new CountDownLatch(THREADS);
        for (int i = 0; i < THREADS; i++) {
            pool.submit(() -> {
                try {
                    for (int j = 0; j < LOOPS; j++) action.run();
                } finally {
                    latch.countDown();
                }
            });
        }
        latch.await();
        pool.shutdown();
        pool.awaitTermination(30, TimeUnit.SECONDS);
    }

    static void collectionKhongAnToan() throws InterruptedException {
        System.out.println("\n--- Collection không an toàn ---");
        List<Integer> arrayList = new ArrayList<>();
        Map<String, Integer> hashMap = new HashMap<>();
        List<Integer> syncList = java.util.Collections.synchronizedList(new ArrayList<>());
        Map<String, Integer> concurrentMap = new ConcurrentHashMap<>();

        ExecutorService pool = Executors.newFixedThreadPool(20);
        CountDownLatch latch = new CountDownLatch(20);
        for (int i = 0; i < 20; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    for (int j = 0; j < 1000; j++) {
                        try { arrayList.add(j); } catch (Exception ignored) { }
                        try { hashMap.put(id + "-" + j, j); } catch (Exception ignored) { }
                        syncList.add(j);
                        concurrentMap.put(id + "-" + j, j);
                    }
                } finally { latch.countDown(); }
            });
        }
        latch.await();
        pool.shutdown();

        System.out.printf("ArrayList          : %,6d / 20.000  %s%n", arrayList.size(),
                arrayList.size() == 20_000 ? "" : "❌ mất phần tử");
        System.out.printf("HashMap            : %,6d / 20.000  %s%n", hashMap.size(),
                hashMap.size() == 20_000 ? "" : "❌ mất phần tử");
        System.out.printf("synchronizedList   : %,6d / 20.000  ✅%n", syncList.size());
        System.out.printf("ConcurrentHashMap  : %,6d / 20.000  ✅%n", concurrentMap.size());
    }

    static void visibilityVolatile() throws InterruptedException {
        System.out.println("\n--- volatile: vấn đề hiển thị (visibility) ---");
        var holder = new Object() { volatile boolean running = true; };

        Thread worker = new Thread(() -> {
            long i = 0;
            while (holder.running) i++;
            System.out.println("  Worker dừng sau " + i + " vòng lặp");
        });
        worker.start();
        Thread.sleep(100);
        holder.running = false;
        worker.join(2000);
        System.out.println("  Có volatile -> thread thấy thay đổi và dừng đúng lúc.");
        System.out.println("  Không volatile -> JIT có thể cache biến vào thanh ghi và lặp vô hạn.");
    }
}
