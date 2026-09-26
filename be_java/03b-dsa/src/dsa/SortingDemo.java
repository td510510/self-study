package dsa;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Random;

/** Tự cài các thuật toán sắp xếp, so tốc độ với Arrays.sort, và thấy tính "ổn định" quan trọng thế nào. */
public class SortingDemo {

    public static void main(String[] args) {
        int[] sample = {5, 2, 8, 1, 9, 3, 7};
        System.out.println("--- Kết quả ---");
        System.out.println("insertion: " + Arrays.toString(insertionSort(sample.clone())));
        System.out.println("merge    : " + Arrays.toString(mergeSort(sample.clone())));
        int[] q = sample.clone();
        quickSort(q, 0, q.length - 1);
        System.out.println("quick    : " + Arrays.toString(q));

        soSanhTocDo();
        tinhOnDinh();
    }

    /** O(n²) nhưng rất nhanh với mảng nhỏ hoặc gần như đã sắp xếp. TimSort dùng nó cho đoạn ngắn. */
    static int[] insertionSort(int[] a) {
        for (int i = 1; i < a.length; i++) {
            int key = a[i];
            int j = i - 1;
            while (j >= 0 && a[j] > key) {          // dịch các phần tử lớn hơn sang phải
                a[j + 1] = a[j];
                j--;
            }
            a[j + 1] = key;
        }
        return a;
    }

    /** Chia đôi -> sắp từng nửa -> trộn. Luôn O(n log n), ổn định, tốn O(n) bộ nhớ phụ. */
    static int[] mergeSort(int[] a) {
        if (a.length <= 1) return a;
        int mid = a.length / 2;
        int[] left = mergeSort(Arrays.copyOfRange(a, 0, mid));
        int[] right = mergeSort(Arrays.copyOfRange(a, mid, a.length));

        int[] result = new int[a.length];
        int i = 0, j = 0, k = 0;
        while (i < left.length && j < right.length) {
            result[k++] = left[i] <= right[j] ? left[i++] : right[j++];   // <= giữ tính ổn định
        }
        while (i < left.length) result[k++] = left[i++];
        while (j < right.length) result[k++] = right[j++];
        return result;
    }

    /**
     * Chọn chốt, dồn phần tử nhỏ hơn sang trái, lớn hơn sang phải, đệ quy hai phía.
     * Trung bình O(n log n), xấu nhất O(n²) nếu chốt tệ (mảng đã sắp + chọn chốt là phần tử cuối).
     * Chọn chốt ngẫu nhiên để tránh trường hợp xấu.
     */
    static final Random RANDOM = new Random();

    static void quickSort(int[] a, int lo, int hi) {
        if (lo >= hi) return;
        int p = partition(a, lo, hi);
        quickSort(a, lo, p - 1);
        quickSort(a, p + 1, hi);
    }

    static int partition(int[] a, int lo, int hi) {
        swap(a, lo + RANDOM.nextInt(hi - lo + 1), hi);   // chốt ngẫu nhiên, đưa về cuối
        int pivot = a[hi];
        int i = lo;
        for (int j = lo; j < hi; j++) {
            if (a[j] < pivot) swap(a, i++, j);
        }
        swap(a, i, hi);
        return i;
    }

    static void swap(int[] a, int i, int j) {
        int t = a[i];
        a[i] = a[j];
        a[j] = t;
    }

    static void soSanhTocDo() {
        System.out.println("\n--- Tốc độ (ms) ---");
        System.out.printf("%10s %12s %10s %10s %12s%n", "n", "insertion", "merge", "quick", "Arrays.sort");
        for (int n : new int[]{10_000, 50_000, 200_000}) {
            int[] data = new Random(1).ints(n).toArray();

            String insertion = "-";
            if (n <= 50_000) {
                long t = System.nanoTime();
                insertionSort(data.clone());
                insertion = String.valueOf((System.nanoTime() - t) / 1_000_000);
            }
            long t1 = System.nanoTime();
            mergeSort(data.clone());
            long merge = (System.nanoTime() - t1) / 1_000_000;

            int[] qs = data.clone();
            long t2 = System.nanoTime();
            quickSort(qs, 0, qs.length - 1);
            long quick = (System.nanoTime() - t2) / 1_000_000;

            int[] js = data.clone();
            long t3 = System.nanoTime();
            Arrays.sort(js);
            long jdk = (System.nanoTime() - t3) / 1_000_000;

            System.out.printf("%10d %12s %10d %10d %12d%n", n, insertion, merge, quick, jdk);
        }
        System.out.println("-> Đi làm: luôn dùng Arrays.sort / List.sort. Tự viết chỉ để hiểu và để phỏng vấn.");
    }

    record Employee(String name, String dept) { }

    /** Stable sort: sắp theo tên, rồi sắp theo phòng ban -> trong mỗi phòng vẫn giữ thứ tự tên. */
    static void tinhOnDinh() {
        System.out.println("\n--- Tính ổn định (stable) ---");
        List<Employee> list = new ArrayList<>(List.of(
                new Employee("Nam", "IT"), new Employee("An", "HR"),
                new Employee("Bình", "IT"), new Employee("Chi", "HR"), new Employee("Dũng", "IT")));
        list.sort(Comparator.comparing(Employee::name));
        list.sort(Comparator.comparing(Employee::dept));    // TimSort ổn định
        list.forEach(e -> System.out.println("  " + e.dept() + " - " + e.name()));
        System.out.println("-> Trong phòng HR và IT, tên vẫn theo A-Z nhờ List.sort ổn định.");
    }
}
