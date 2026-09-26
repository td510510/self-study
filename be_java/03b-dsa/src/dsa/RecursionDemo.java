package dsa;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Đệ quy: điều kiện dừng, tính lại vô ích, memoization, quay lui. */
public class RecursionDemo {

    public static void main(String[] args) {
        System.out.println("--- Đệ quy cơ bản ---");
        System.out.println("5! = " + factorial(5));
        System.out.println("Tổng chữ số 98765 = " + digitSum(98765));
        System.out.println("2^10 = " + power(2, 10) + " (chỉ ~log2(10) lần gọi)");

        System.out.println("\n--- Fibonacci: đệ quy thô vs ghi nhớ ---");
        calls = 0;
        long t1 = System.nanoTime();
        long f1 = fibNaive(35);
        System.out.printf("fibNaive(35) = %d, %,d lần gọi, %d ms%n",
                f1, calls, (System.nanoTime() - t1) / 1_000_000);

        calls = 0;
        long t2 = System.nanoTime();
        long f2 = fibMemo(35, new HashMap<>());
        System.out.printf("fibMemo(35)  = %d, %,d lần gọi, %d ms%n",
                f2, calls, (System.nanoTime() - t2) / 1_000_000);
        System.out.println("fibMemo(90)  = " + fibMemo(90, new HashMap<>()));

        System.out.println("\n--- StackOverflowError ---");
        try {
            infinite(0);
        } catch (StackOverflowError e) {
            System.out.println("Đệ quy không điểm dừng -> StackOverflowError sau " + maxDepth + " tầng");
        }

        System.out.println("\n--- Quay lui (backtracking) ---");
        List<List<Integer>> perms = new ArrayList<>();
        permute(List.of(1, 2, 3), new ArrayList<>(), new boolean[3], perms);
        System.out.println("Hoán vị của [1,2,3]: " + perms);

        List<List<String>> subsets = new ArrayList<>();
        subsets(List.of("a", "b", "c"), 0, new ArrayList<>(), subsets);
        System.out.println("Tập con của [a,b,c]: " + subsets);
    }

    static long factorial(int n) {
        if (n <= 1) return 1;                   // điều kiện dừng
        return n * factorial(n - 1);            // bài nhỏ hơn
    }

    static int digitSum(int n) {
        if (n < 10) return n;
        return n % 10 + digitSum(n / 10);
    }

    /** Lũy thừa nhanh: x^n = (x^(n/2))². O(log n) thay vì O(n). */
    static long power(long x, int n) {
        if (n == 0) return 1;
        long half = power(x, n / 2);
        return n % 2 == 0 ? half * half : half * half * x;
    }

    static long calls;

    static long fibNaive(int n) {
        calls++;
        if (n < 2) return n;
        return fibNaive(n - 1) + fibNaive(n - 2);
    }

    static long fibMemo(int n, Map<Integer, Long> memo) {
        calls++;
        if (n < 2) return n;
        Long cached = memo.get(n);
        if (cached != null) return cached;
        long result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
        memo.put(n, result);
        return result;
    }

    static int maxDepth;

    static void infinite(int depth) {
        maxDepth = depth;
        infinite(depth + 1);                    // thiếu điều kiện dừng
    }

    /**
     * Khuôn quay lui: chọn -> đi tiếp -> bỏ chọn.
     * Độ phức tạp O(n · n!) — chỉ dùng được khi n rất nhỏ (≤ 10).
     */
    static void permute(List<Integer> nums, List<Integer> current, boolean[] used,
                        List<List<Integer>> result) {
        if (current.size() == nums.size()) {
            result.add(new ArrayList<>(current));   // PHẢI copy, vì current còn bị sửa tiếp
            return;
        }
        for (int i = 0; i < nums.size(); i++) {
            if (used[i]) continue;
            used[i] = true;                          // chọn
            current.add(nums.get(i));
            permute(nums, current, used, result);    // đi tiếp
            current.remove(current.size() - 1);      // bỏ chọn
            used[i] = false;
        }
    }

    /** Mỗi phần tử có 2 lựa chọn: lấy hoặc không lấy -> 2^n tập con. */
    static void subsets(List<String> items, int index, List<String> current,
                        List<List<String>> result) {
        if (index == items.size()) {
            result.add(new ArrayList<>(current));
            return;
        }
        subsets(items, index + 1, current, result);        // không lấy items[index]
        current.add(items.get(index));
        subsets(items, index + 1, current, result);        // lấy items[index]
        current.remove(current.size() - 1);
    }
}
