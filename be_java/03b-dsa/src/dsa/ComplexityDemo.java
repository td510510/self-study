package dsa;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.IntStream;

/** Thấy tận mắt Big-O: cùng một bài toán, O(n²) và O(n) chênh nhau thế nào khi n tăng. */
public class ComplexityDemo {

    public static void main(String[] args) {
        coTrungLapKhong();
        chiPhiAnCuaContains();
        noiChuoiTrongVongLap();
    }

    /** Bài: mảng có phần tử trùng lặp không? */
    static void coTrungLapKhong() {
        System.out.println("--- Kiểm tra trùng lặp: O(n²) vs O(n) ---");
        // Chạy nháp một lần để JIT biên dịch xong, số đo phía sau mới ổn định
        hasDuplicateBruteForce(new Random(0).ints(20_000).toArray());
        hasDuplicateHashSet(new Random(0).ints(20_000).toArray());

        System.out.printf("%10s %15s %15s%n", "n", "O(n²) (ms)", "O(n) (ms)");
        for (int n : new int[]{10_000, 20_000, 40_000, 80_000}) {
            // Không có phần tử trùng -> trường hợp xấu nhất: cả hai cách phải duyệt hết mảng
            int[] a = IntStream.range(0, n).map(i -> i * 7).toArray();

            long t1 = System.nanoTime();
            boolean r1 = hasDuplicateBruteForce(a);
            long bruteMs = (System.nanoTime() - t1) / 1_000_000;

            long t2 = System.nanoTime();
            boolean r2 = hasDuplicateHashSet(a);
            long hashMs = (System.nanoTime() - t2) / 1_000_000;

            if (r1 != r2) throw new IllegalStateException("Hai cách cho kết quả khác nhau!");
            System.out.printf("%10d %15d %15d%n", n, bruteMs, hashMs);
        }
        System.out.println("-> n tăng gấp đôi: cột O(n²) tăng ~4 lần, cột O(n) chỉ tăng ~2 lần và vẫn rất nhỏ.");
    }

    static boolean hasDuplicateBruteForce(int[] a) {
        for (int i = 0; i < a.length; i++)
            for (int j = i + 1; j < a.length; j++)
                if (a[i] == a[j]) return true;
        return false;
    }

    static boolean hasDuplicateHashSet(int[] a) {
        Set<Integer> seen = new HashSet<>();
        for (int x : a) {
            if (!seen.add(x)) return true;      // add trả false nếu đã có
        }
        return false;
    }

    /** Bẫy: list.contains() trong vòng lặp biến O(n) thành O(n²). */
    static void chiPhiAnCuaContains() {
        System.out.println("\n--- Chi phí ẩn: List.contains vs Set.contains ---");
        int n = 30_000;
        List<Integer> list = new ArrayList<>();
        for (int i = 0; i < n; i++) list.add(i * 2);
        Set<Integer> set = new HashSet<>(list);

        long t1 = System.nanoTime();
        int found1 = 0;
        for (int i = 0; i < n; i++) if (list.contains(i)) found1++;
        long listMs = (System.nanoTime() - t1) / 1_000_000;

        long t2 = System.nanoTime();
        int found2 = 0;
        for (int i = 0; i < n; i++) if (set.contains(i)) found2++;
        long setMs = (System.nanoTime() - t2) / 1_000_000;

        System.out.printf("List.contains trong vòng lặp: %d ms (tìm thấy %d)%n", listMs, found1);
        System.out.printf("Set.contains  trong vòng lặp: %d ms (tìm thấy %d)%n", setMs, found2);
        System.out.println("-> Ở dự án thật, 'list' này thường là kết quả query DB. Đổi sang Set/Map trước khi lặp.");
    }

    /** Bẫy: String += trong vòng lặp là O(n²) vì mỗi lần tạo một chuỗi mới. */
    static void noiChuoiTrongVongLap() {
        System.out.println("\n--- String += vs StringBuilder ---");
        int n = 30_000;

        long t1 = System.nanoTime();
        String s = "";
        for (int i = 0; i < n; i++) s += "x";
        long plusMs = (System.nanoTime() - t1) / 1_000_000;

        long t2 = System.nanoTime();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) sb.append("x");
        long sbMs = (System.nanoTime() - t2) / 1_000_000;

        System.out.printf("String +=      : %d ms (độ dài %d)%n", plusMs, s.length());
        System.out.printf("StringBuilder  : %d ms (độ dài %d)%n", sbMs, sb.length());
    }
}
