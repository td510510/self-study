package perf;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;

/**
 * 5 kiểu memory leak kinh điển trong Java — và cách sửa từng cái.
 * Chạy: java -Xmx128m -cp out perf.LeakDemo
 */
public class LeakDemo {

    // ❌ Leak #1: cache static không giới hạn, không TTL
    static final Map<String, byte[]> BAD_CACHE = new HashMap<>();

    // ✅ Sửa: cache có giới hạn (LRU). Thực tế nên dùng Caffeine/Redis.
    static final Map<String, byte[]> GOOD_CACHE = new LinkedHashMap<>(16, 0.75f, true) {
        @Override protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) {
            return size() > 100;
        }
    };

    public static void main(String[] args) {
        cacheKhongGioiHan();
        threadLocalLeak();
        innerClassLeak();
        weakHashMap();
        tongKet();
    }

    static void cacheKhongGioiHan() {
        System.out.println("--- Leak #1: cache static không giới hạn ---");
        for (int i = 0; i < 2_000; i++) {
            BAD_CACHE.put("key-" + i, new byte[10_000]);
            GOOD_CACHE.put("key-" + i, new byte[10_000]);
        }
        System.out.printf("BAD_CACHE  giữ %,d entry (~%,d KB) — tăng mãi tới khi OOM%n",
                BAD_CACHE.size(), BAD_CACHE.size() * 10);
        System.out.printf("GOOD_CACHE giữ %,d entry — LRU tự loại phần tử cũ ✅%n", GOOD_CACHE.size());
        BAD_CACHE.clear();
    }

    static void threadLocalLeak() {
        System.out.println("\n--- Leak #2: ThreadLocal trong thread pool ---");
        ThreadLocal<byte[]> ctx = new ThreadLocal<>();

        // ❌ set mà không remove: thread trong pool sống mãi -> object sống mãi
        ctx.set(new byte[1_000_000]);
        System.out.println("Sau set, còn giữ: " + (ctx.get() != null));

        // ✅ luôn remove trong finally
        try {
            ctx.set(new byte[1_000_000]);
        } finally {
            ctx.remove();
        }
        System.out.println("Sau remove()   : " + (ctx.get() != null) + "  ✅");
        System.out.println("Spring dùng ThreadLocal cho SecurityContext/transaction — framework tự remove.");
    }

    static void innerClassLeak() {
        System.out.println("\n--- Leak #3: inner class không static ---");
        System.out.println("""
                class Outer {
                    byte[] duLieuLon = new byte[10_000_000];
                    class Inner { }              // ❌ Inner giữ tham chiếu ngầm tới Outer
                    static class SafeInner { }   // ✅ không giữ Outer
                }
                Nếu bạn trả một Inner ra ngoài và giữ nó lâu dài, cả Outer (10MB) không được dọn.""");
    }

    static void weakHashMap() {
        System.out.println("\n--- WeakHashMap: key hết tham chiếu thì entry tự biến mất ---");
        Map<Object, String> strong = new HashMap<>();
        Map<Object, String> weak = new WeakHashMap<>();

        List<Object> keysGiuLai = new ArrayList<>();
        for (int i = 0; i < 1000; i++) {
            Object key = new Object();
            strong.put(key, "value-" + i);
            weak.put(key, "value-" + i);
            if (i < 10) keysGiuLai.add(key);       // chỉ giữ 10 key
        }

        System.gc();
        sleep(300);
        System.out.println("HashMap     còn: " + strong.size() + " entry (giữ luôn key -> không dọn được)");
        System.out.println("WeakHashMap còn: " + weak.size() + " entry (chỉ còn key được tham chiếu ngoài)");
        System.out.println("Số key giữ lại : " + keysGiuLai.size());
    }

    static void tongKet() {
        System.out.println("""

                --- Quy trình truy memory leak trên production ---
                1. Triệu chứng: RAM tăng dần, Full GC ngày càng nhiều, cuối cùng OOM.
                2. jstat -gc <pid> 1000        -> xem Old Gen có giảm sau Full GC không.
                3. jmap -histo <pid> | head    -> class nào chiếm nhiều nhất.
                4. jmap -dump:live,format=b,file=heap.hprof <pid>
                5. Mở heap.hprof bằng Eclipse MAT -> Leak Suspects -> đường tham chiếu giữ object.
                6. Sửa code (thường là cache/listener/ThreadLocal), rồi kiểm chứng lại.""");
    }

    static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
