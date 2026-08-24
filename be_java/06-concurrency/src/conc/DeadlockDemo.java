package conc;

import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Deadlock: tạo ra, phát hiện, và 2 cách sửa.
 * Chạy: java conc.DeadlockDemo  (chương trình tự thoát sau ~3 giây)
 */
public class DeadlockDemo {

    static final Object LOCK_A = new Object();
    static final Object LOCK_B = new Object();

    public static void main(String[] args) throws Exception {
        taoDeadlock();
        suaBangThuTuKhoa();
        suaBangTryLock();
    }

    static void taoDeadlock() throws Exception {
        System.out.println("--- Tạo deadlock ---");

        Thread t1 = new Thread(() -> {
            synchronized (LOCK_A) {
                System.out.println("  T1 giữ A, chờ B...");
                sleep(100);
                synchronized (LOCK_B) { System.out.println("  T1 lấy được B"); }
            }
        }, "T1");

        Thread t2 = new Thread(() -> {
            synchronized (LOCK_B) {                       // thứ tự NGƯỢC lại -> deadlock
                System.out.println("  T2 giữ B, chờ A...");
                sleep(100);
                synchronized (LOCK_A) { System.out.println("  T2 lấy được A"); }
            }
        }, "T2");

        t1.setDaemon(true); t2.setDaemon(true);           // daemon để JVM vẫn thoát được
        t1.start(); t2.start();
        t1.join(1000); t2.join(1000);

        System.out.println("  Sau 1 giây: T1 alive=" + t1.isAlive() + ", T2 alive=" + t2.isAlive()
                + "  -> cả hai treo vĩnh viễn ❌");
        System.out.println("  (Thực tế: dùng `jstack <pid>` hoặc jconsole để phát hiện deadlock)");
    }

    static void suaBangThuTuKhoa() throws Exception {
        System.out.println("\n--- Sửa cách 1: luôn lấy khóa theo CÙNG thứ tự ---");
        // Dùng khóa mới: LOCK_A/LOCK_B vẫn đang bị 2 thread deadlock ở trên giữ.
        Object first = new Object(), second = new Object();

        Runnable task = () -> {
            synchronized (first) {
                sleep(50);
                synchronized (second) {
                    System.out.println("  " + Thread.currentThread().getName() + " hoàn thành");
                }
            }
        };
        Thread t1 = new Thread(task, "T3");
        Thread t2 = new Thread(task, "T4");
        t1.start(); t2.start();
        t1.join(); t2.join();
        System.out.println("  Cả hai chạy xong ✅");
    }

    static void suaBangTryLock() throws Exception {
        System.out.println("\n--- Sửa cách 2: ReentrantLock.tryLock có timeout ---");
        ReentrantLock lockA = new ReentrantLock();
        ReentrantLock lockB = new ReentrantLock();

        Runnable task = () -> {
            String name = Thread.currentThread().getName();
            boolean gotA = false, gotB = false;
            try {
                gotA = lockA.tryLock(500, TimeUnit.MILLISECONDS);
                if (gotA) {
                    sleep(50);
                    gotB = lockB.tryLock(500, TimeUnit.MILLISECONDS);
                }
                if (gotA && gotB) {
                    System.out.println("  " + name + " lấy được cả 2 khóa, xử lý xong");
                } else {
                    System.out.println("  " + name + " không lấy đủ khóa -> nhả ra và thử lại sau (không treo)");
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                if (gotB) lockB.unlock();
                if (gotA) lockA.unlock();
            }
        };

        Thread t1 = new Thread(task, "T5");
        Thread t2 = new Thread(task, "T6");
        t1.start(); t2.start();
        t1.join(); t2.join();
        System.out.println("  Không có deadlock ✅ — tryLock luôn có đường thoát");
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
