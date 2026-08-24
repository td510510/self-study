package conc;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/** ExecutorService: thread pool, Future, invokeAll, shutdown đúng cách. */
public class ExecutorDemo {

    public static void main(String[] args) throws Exception {
        submitVaFuture();
        invokeAll();
        xuLyLoiTrongTask();
        chayTheoLich();
        shutdownDungCach();
    }

    static void submitVaFuture() throws Exception {
        System.out.println("--- submit & Future ---");
        ExecutorService pool = Executors.newFixedThreadPool(3);

        Future<Integer> f = pool.submit(() -> {
            Thread.sleep(200);
            return 40 + 2;
        });
        System.out.println("Đã submit, chưa chặn. isDone = " + f.isDone());
        System.out.println("Kết quả (get chặn tới khi xong) = " + f.get());

        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
    }

    static void invokeAll() throws Exception {
        System.out.println("\n--- invokeAll: chạy nhiều task, chờ tất cả ---");
        ExecutorService pool = Executors.newFixedThreadPool(4);

        List<Callable<String>> tasks = new ArrayList<>();
        for (int i = 1; i <= 8; i++) {
            final int id = i;
            tasks.add(() -> {
                Thread.sleep(100);
                return "task-" + id + " xong trên " + Thread.currentThread().getName();
            });
        }

        long t = System.currentTimeMillis();
        List<Future<String>> results = pool.invokeAll(tasks);
        for (Future<String> r : results) System.out.println("  " + r.get());
        System.out.println("8 task × 100ms trên pool 4 thread mất " + (System.currentTimeMillis() - t)
                + "ms (~200ms, chứ không phải 800ms)");

        pool.shutdown();
    }

    static void xuLyLoiTrongTask() {
        System.out.println("\n--- Lỗi trong task ---");
        ExecutorService pool = Executors.newSingleThreadExecutor();

        Future<Integer> f = pool.submit(() -> 10 / 0);
        try {
            f.get();
        } catch (ExecutionException e) {
            System.out.println("submit + get -> ExecutionException, cause = " + e.getCause());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Cảnh báo: execute() (khác submit) làm exception "biến mất" nếu không có handler
        pool.execute(() -> { throw new IllegalStateException("lỗi này sẽ in ra stderr rồi thôi"); });
        pool.shutdown();
        System.out.println("=> Dùng submit + get, hoặc CompletableFuture.exceptionally, để không nuốt lỗi.");
    }

    static void chayTheoLich() throws Exception {
        System.out.println("\n--- ScheduledExecutorService ---");
        ScheduledExecutorService sched = Executors.newScheduledThreadPool(1);

        sched.schedule(() -> System.out.println("  Chạy trễ 300ms"), 300, TimeUnit.MILLISECONDS);

        var handle = sched.scheduleAtFixedRate(
                () -> System.out.println("  Job định kỳ mỗi 200ms"), 0, 200, TimeUnit.MILLISECONDS);

        Thread.sleep(700);
        handle.cancel(true);
        sched.shutdown();
        System.out.println("(Trong Spring: dùng @Scheduled thay cho đoạn này)");
    }

    static void shutdownDungCach() throws Exception {
        System.out.println("\n--- Shutdown đúng cách ---");
        ExecutorService pool = Executors.newFixedThreadPool(2);
        pool.submit(() -> { Thread.sleep(300); System.out.println("  Task dài đã xong"); return null; });

        pool.shutdown();                                   // không nhận task mới
        if (!pool.awaitTermination(5, TimeUnit.SECONDS)) { // chờ task đang chạy
            pool.shutdownNow();                            // quá hạn thì hủy
        }
        System.out.println("Pool đã tắt: " + pool.isTerminated());
        System.out.println("⚠ Quên shutdown() -> JVM không thoát vì thread pool là non-daemon.");
    }
}
