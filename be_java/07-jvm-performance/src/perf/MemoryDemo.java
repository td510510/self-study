package perf;

import java.util.ArrayList;
import java.util.List;

/**
 * Quan sát bộ nhớ JVM: heap, GC, OutOfMemoryError, StackOverflowError.
 * Chạy thử với giới hạn heap nhỏ để thấy rõ:
 *   java -Xmx64m -cp out perf.MemoryDemo
 */
public class MemoryDemo {

    public static void main(String[] args) {
        thongTinBoNho();
        quanSatGC();
        stackOverflow();
        outOfMemory();
    }

    static void thongTinBoNho() {
        Runtime rt = Runtime.getRuntime();
        System.out.println("--- Bộ nhớ JVM ---");
        System.out.printf("Số nhân CPU : %d%n", rt.availableProcessors());
        System.out.printf("Heap tối đa : %,d MB   (-Xmx)%n", rt.maxMemory() / 1024 / 1024);
        System.out.printf("Heap cấp phát: %,d MB  (-Xms, co giãn dần)%n", rt.totalMemory() / 1024 / 1024);
        System.out.printf("Đang trống  : %,d MB%n", rt.freeMemory() / 1024 / 1024);
    }

    static void quanSatGC() {
        System.out.println("\n--- Tạo rác và quan sát GC ---");
        Runtime rt = Runtime.getRuntime();
        long before = used(rt);

        List<byte[]> keep = new ArrayList<>();
        for (int i = 0; i < 500; i++) {
            byte[] rac = new byte[100_000];        // 100KB, không giữ tham chiếu -> thành rác ngay
            if (i % 100 == 0) keep.add(new byte[100_000]);   // giữ lại vài cái
        }
        long afterAlloc = used(rt);

        System.gc();                                // chỉ là GỢI Ý cho JVM
        sleep(200);
        long afterGc = used(rt);

        System.out.printf("Trước       : %,6d KB%n", before / 1024);
        System.out.printf("Sau cấp phát: %,6d KB%n", afterAlloc / 1024);
        System.out.printf("Sau gợi ý GC: %,6d KB  (giảm vì phần lớn object là rác)%n", afterGc / 1024);
        System.out.println("Số object còn giữ: " + keep.size());
        System.out.println("Lưu ý: System.gc() KHÔNG ép GC chạy, chỉ gợi ý.");
    }

    static void stackOverflow() {
        System.out.println("\n--- StackOverflowError ---");
        try {
            deQuyVoHan(0);
        } catch (StackOverflowError e) {
            System.out.println("Đệ quy không có điều kiện dừng -> StackOverflowError");
            System.out.println("Độ sâu đạt được ~ " + depth + " khung stack");
            System.out.println("Nguyên nhân thật: sai logic, không phải thiếu bộ nhớ. Tăng -Xss chỉ là tạm.");
        }
    }

    static int depth = 0;
    static void deQuyVoHan(int n) { depth = n; deQuyVoHan(n + 1); }

    static void outOfMemory() {
        System.out.println("\n--- OutOfMemoryError (có kiểm soát) ---");
        List<byte[]> leak = new ArrayList<>();
        try {
            while (true) {
                leak.add(new byte[10 * 1024 * 1024]);      // 10MB mỗi lần
                System.out.printf("  Đã cấp phát %,d MB%n", leak.size() * 10);
                if (leak.size() > 500) break;              // chặn an toàn
            }
        } catch (OutOfMemoryError e) {
            leak.clear();                                   // nhả ngay để in được thông báo
            System.out.println("OutOfMemoryError: " + e.getMessage());
            System.out.println("""
                    Trên production cần bật:
                      -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/log/app/
                    rồi mở file .hprof bằng Eclipse MAT để tìm object chiếm bộ nhớ.""");
        }
    }

    static long used(Runtime rt) { return rt.totalMemory() - rt.freeMemory(); }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
