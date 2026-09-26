package dsa;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Bốn kỹ thuật giải phần lớn bài mảng/chuỗi: hai con trỏ, cửa sổ trượt, prefix sum, hashing. */
public class ArrayTechniques {

    public static void main(String[] args) {
        System.out.println("--- Hai con trỏ ---");
        int[] sorted = {1, 3, 4, 6, 8, 11};
        System.out.println("twoSumSorted(10) -> chỉ số " + Arrays.toString(twoSumSorted(sorted, 10)));
        int[] dup = {1, 1, 2, 3, 3, 3, 4};
        int len = removeDuplicatesSorted(dup);
        System.out.println("Khử trùng tại chỗ -> " + Arrays.toString(Arrays.copyOf(dup, len)));
        int[] r = {1, 2, 3, 4, 5};
        reverseInPlace(r);
        System.out.println("Đảo tại chỗ -> " + Arrays.toString(r));
        System.out.println("Gộp 2 mảng đã sắp -> " + Arrays.toString(merge(new int[]{1, 4, 7}, new int[]{2, 3, 9})));

        System.out.println("\n--- Cửa sổ trượt ---");
        System.out.println("Tổng lớn nhất 3 phần tử liên tiếp của [2,1,5,1,3,2] = "
                + maxSumWindow(new int[]{2, 1, 5, 1, 3, 2}, 3));
        System.out.println("Chuỗi con dài nhất không lặp ký tự của 'abcabcbb' = "
                + longestUniqueSubstring("abcabcbb"));
        System.out.println("Đoạn con ngắn nhất có tổng >= 7 trong [2,3,1,2,4,3] dài "
                + minLengthSubarray(new int[]{2, 3, 1, 2, 4, 3}, 7));

        System.out.println("\n--- Prefix sum ---");
        int[] sales = {100, 200, 150, 300, 250};
        long[] prefix = buildPrefix(sales);
        System.out.println("Doanh thu ngày 1..3 (chỉ số 1..3) = " + rangeSum(prefix, 1, 3));
        System.out.println("Số đoạn con có tổng = 3 trong [1,2,1,2,1] = "
                + countSubarraysWithSum(new int[]{1, 2, 1, 2, 1}, 3));

        System.out.println("\n--- Hashing ---");
        System.out.println("twoSum([3,2,4], 6) -> chỉ số " + Arrays.toString(twoSum(new int[]{3, 2, 4}, 6)));
        System.out.println("Nhóm anagram: " + groupAnagrams(List.of("eat", "tea", "tan", "ate", "nat", "bat")));
        System.out.println("Ký tự đầu tiên không lặp trong 'leetcode': " + firstUniqueChar("leetcode"));
    }

    // ============================================================ HAI CON TRỎ

    /** Mảng đã sắp xếp: tìm 2 chỉ số có tổng = target. O(n) thời gian, O(1) bộ nhớ. */
    static int[] twoSumSorted(int[] a, int target) {
        int left = 0, right = a.length - 1;
        while (left < right) {
            int sum = a[left] + a[right];
            if (sum == target) return new int[]{left, right};
            if (sum < target) left++;
            else right--;
        }
        return new int[0];
    }

    /** Con trỏ "ghi" chậm, con trỏ "đọc" nhanh. Trả về độ dài phần không trùng. */
    static int removeDuplicatesSorted(int[] a) {
        if (a.length == 0) return 0;
        int write = 1;
        for (int read = 1; read < a.length; read++) {
            if (a[read] != a[write - 1]) a[write++] = a[read];
        }
        return write;
    }

    static void reverseInPlace(int[] a) {
        for (int i = 0, j = a.length - 1; i < j; i++, j--) {
            int tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
    }

    /** Gộp 2 mảng đã sắp xếp — cũng là bước "trộn" của merge sort. O(n + m). */
    static int[] merge(int[] a, int[] b) {
        int[] result = new int[a.length + b.length];
        int i = 0, j = 0, k = 0;
        while (i < a.length && j < b.length) result[k++] = a[i] <= b[j] ? a[i++] : b[j++];
        while (i < a.length) result[k++] = a[i++];
        while (j < b.length) result[k++] = b[j++];
        return result;
    }

    // ============================================================ CỬA SỔ TRƯỢT

    /** Cửa sổ cố định k. O(n). */
    static int maxSumWindow(int[] a, int k) {
        int window = 0;
        for (int i = 0; i < k; i++) window += a[i];
        int best = window;
        for (int i = k; i < a.length; i++) {
            window += a[i] - a[i - k];
            best = Math.max(best, window);
        }
        return best;
    }

    /**
     * Cửa sổ co giãn: mở rộng bên phải; khi ký tự mới đã có trong cửa sổ thì nhảy bên trái qua nó.
     * O(n) vì mỗi ký tự vào/ra cửa sổ tối đa một lần.
     */
    static int longestUniqueSubstring(String s) {
        Map<Character, Integer> lastSeen = new HashMap<>();
        int best = 0, left = 0;
        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            Integer prev = lastSeen.get(c);
            if (prev != null && prev >= left) left = prev + 1;
            lastSeen.put(c, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    /** Đoạn con ngắn nhất có tổng >= target (mảng số dương). 0 nếu không có. */
    static int minLengthSubarray(int[] a, int target) {
        int left = 0, sum = 0, best = Integer.MAX_VALUE;
        for (int right = 0; right < a.length; right++) {
            sum += a[right];
            while (sum >= target) {                  // đã thỏa -> thử thu hẹp
                best = Math.min(best, right - left + 1);
                sum -= a[left++];
            }
        }
        return best == Integer.MAX_VALUE ? 0 : best;
    }

    // ============================================================ PREFIX SUM

    static long[] buildPrefix(int[] a) {
        long[] prefix = new long[a.length + 1];
        for (int i = 0; i < a.length; i++) prefix[i + 1] = prefix[i] + a[i];
        return prefix;
    }

    /** Tổng a[from..to] (bao gồm hai đầu) trong O(1). */
    static long rangeSum(long[] prefix, int from, int to) {
        return prefix[to + 1] - prefix[from];
    }

    /**
     * Đếm số đoạn con có tổng = k (mảng có thể có số âm nên cửa sổ trượt không dùng được).
     * Ý tưởng: tổng(i..j) = prefix[j] - prefix[i-1] = k  <=>  prefix[i-1] = prefix[j] - k.
     * Đếm xem đã gặp bao nhiêu prefix bằng (prefix hiện tại - k). O(n).
     */
    static int countSubarraysWithSum(int[] a, int k) {
        Map<Long, Integer> seen = new HashMap<>();
        seen.put(0L, 1);
        long prefix = 0;
        int count = 0;
        for (int x : a) {
            prefix += x;
            count += seen.getOrDefault(prefix - k, 0);
            seen.merge(prefix, 1, Integer::sum);
        }
        return count;
    }

    // ============================================================ HASHING

    static int[] twoSum(int[] a, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < a.length; i++) {
            Integer j = seen.get(target - a[i]);
            if (j != null) return new int[]{j, i};
            seen.put(a[i], i);
        }
        return new int[0];
    }

    /** Key chung của các anagram = chuỗi sau khi sắp xếp ký tự. */
    static List<List<String>> groupAnagrams(List<String> words) {
        Map<String, List<String>> groups = new HashMap<>();
        for (String w : words) {
            char[] chars = w.toCharArray();
            Arrays.sort(chars);
            groups.computeIfAbsent(new String(chars), k -> new ArrayList<>()).add(w);
        }
        return new ArrayList<>(groups.values());
    }

    static char firstUniqueChar(String s) {
        int[] count = new int[128];
        for (char c : s.toCharArray()) count[c]++;
        for (char c : s.toCharArray()) if (count[c] == 1) return c;
        return '-';
    }
}
