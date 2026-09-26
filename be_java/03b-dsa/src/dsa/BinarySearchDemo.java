package dsa;

import java.util.Arrays;
import java.util.TreeMap;

/** Tìm kiếm nhị phân: bản chuẩn, tìm cận trái/phải, và tìm kiếm nhị phân trên đáp án. */
public class BinarySearchDemo {

    public static void main(String[] args) {
        int[] a = {1, 3, 3, 3, 5, 8, 13, 21};
        System.out.println("Mảng: " + Arrays.toString(a));
        System.out.println("binarySearch(8)  = " + binarySearch(a, 8));
        System.out.println("binarySearch(4)  = " + binarySearch(a, 4));
        System.out.println("Vị trí đầu tiên của 3 = " + lowerBound(a, 3));
        System.out.println("Vị trí sau số 3 cuối   = " + upperBound(a, 3));
        System.out.println("Số lần xuất hiện của 3 = " + (upperBound(a, 3) - lowerBound(a, 3)));

        System.out.println("\n--- Nhị phân trên đáp án ---");
        int[] packages = {3, 2, 2, 4, 1, 4};
        System.out.println("Kiện hàng " + Arrays.toString(packages) + ", chở hết trong 3 ngày");
        System.out.println("-> Sức chở nhỏ nhất của xe = " + minCapacity(packages, 3));
        System.out.println("Căn bậc hai nguyên của 2147395599 = " + sqrt(2147395599));

        System.out.println("\n--- Trong thư viện Java ---");
        System.out.println("Arrays.binarySearch(a, 13) = " + Arrays.binarySearch(a, 13));
        System.out.println("Arrays.binarySearch(a, 4)  = " + Arrays.binarySearch(a, 4)
                + "  (âm = không có; -(vị trí chèn) - 1)");

        // Ứng dụng: bảng phí vận chuyển theo cân nặng — tra "mốc gần nhất không vượt quá"
        TreeMap<Integer, Integer> shippingFee = new TreeMap<>();
        shippingFee.put(0, 15_000);
        shippingFee.put(1_000, 25_000);
        shippingFee.put(5_000, 40_000);
        shippingFee.put(20_000, 90_000);
        int grams = 3_200;
        System.out.println("Phí ship cho " + grams + "g = " + shippingFee.floorEntry(grams).getValue()
                + " (TreeMap.floorEntry, O(log n))");
    }

    static int binarySearch(int[] a, int target) {
        int lo = 0, hi = a.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;           // tránh tràn số
            if (a[mid] == target) return mid;
            if (a[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }

    /** Chỉ số đầu tiên có a[i] >= target. Khuôn [lo, hi) — nhớ khuôn này là đủ cho mọi biến thể. */
    static int lowerBound(int[] a, int target) {
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] < target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    /** Chỉ số đầu tiên có a[i] > target. */
    static int upperBound(int[] a, int target) {
        int lo = 0, hi = a.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] <= target) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    /**
     * Sức chở nhỏ nhất để chở hết kiện hàng (theo đúng thứ tự) trong `days` ngày.
     * Điều kiện "chở kịp với sức chở c" là đơn điệu: c chở kịp thì c+1 cũng kịp.
     * -> tìm c nhỏ nhất thỏa điều kiện trong khoảng [kiện nặng nhất, tổng khối lượng].
     */
    static int minCapacity(int[] weights, int days) {
        int lo = Arrays.stream(weights).max().orElse(0);
        int hi = Arrays.stream(weights).sum();
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (daysNeeded(weights, mid) <= days) hi = mid;   // chở kịp -> thử nhỏ hơn
            else lo = mid + 1;
        }
        return lo;
    }

    static int daysNeeded(int[] weights, int capacity) {
        int days = 1, load = 0;
        for (int w : weights) {
            if (load + w > capacity) {
                days++;
                load = 0;
            }
            load += w;
        }
        return days;
    }

    /** Số x lớn nhất có x*x <= n. Dùng long để x*x không tràn. */
    static int sqrt(int n) {
        long lo = 0, hi = n;
        while (lo < hi) {
            long mid = lo + (hi - lo + 1) / 2;       // làm tròn lên để không lặp vô hạn
            if (mid * mid <= n) lo = mid;
            else hi = mid - 1;
        }
        return (int) lo;
    }
}
