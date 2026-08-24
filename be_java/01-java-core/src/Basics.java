import java.math.BigDecimal;
import java.util.Arrays;

/**
 * Module 01 — chạy để TẬN MẮT thấy các cạm bẫy kinh điển của Java.
 * Chạy: java 01-java-core/src/Basics.java
 */
public class Basics {

    public static void main(String[] args) {
        tranSo();
        soThuc();
        chiaNguyen();
        soSanhWrapper();
        mangCoBan();
    }

    /** Bẫy 1: int tràn số mà không hề báo lỗi. */
    static void tranSo() {
        System.out.println("--- Tràn số ---");
        int max = Integer.MAX_VALUE;
        System.out.println("Integer.MAX_VALUE     = " + max);
        System.out.println("MAX_VALUE + 1         = " + (max + 1));      // âm!
        long safe = (long) max + 1;
        System.out.println("Ép sang long          = " + safe);
    }

    /** Bẫy 2: double không chính xác -> không dùng cho tiền. */
    static void soThuc() {
        System.out.println("\n--- Số thực ---");
        System.out.println("0.1 + 0.2             = " + (0.1 + 0.2));
        System.out.println("0.1 + 0.2 == 0.3      = " + (0.1 + 0.2 == 0.3));

        BigDecimal a = new BigDecimal("0.1");   // luôn khởi tạo từ String
        BigDecimal b = new BigDecimal("0.2");
        System.out.println("BigDecimal 0.1 + 0.2  = " + a.add(b));
    }

    /** Bẫy 3: int / int luôn ra int. */
    static void chiaNguyen() {
        System.out.println("\n--- Chia ---");
        int x = 7, y = 2;
        System.out.println("7 / 2                 = " + (x / y));
        System.out.println("7 % 2                 = " + (x % y));
        System.out.println("(double) 7 / 2        = " + ((double) x / y));
    }

    /** Bẫy 4: == trên wrapper phụ thuộc Integer cache (-128..127). */
    static void soSanhWrapper() {
        System.out.println("\n--- So sánh wrapper ---");
        Integer a = 127, b = 127;
        Integer c = 128, d = 128;
        System.out.println("127 == 127            = " + (a == b));       // true
        System.out.println("128 == 128            = " + (c == d));       // false
        System.out.println("128.equals(128)       = " + c.equals(d));    // true
    }

    /** Bẫy 5: in mảng phải dùng Arrays.toString. */
    static void mangCoBan() {
        System.out.println("\n--- Mảng ---");
        int[] arr = {5, 2, 9, 1};
        System.out.println("println(arr)          = " + arr);
        System.out.println("Arrays.toString(arr)  = " + Arrays.toString(arr));
        Arrays.sort(arr);
        System.out.println("Sau khi sort          = " + Arrays.toString(arr));
        System.out.println("Độ dài                = " + arr.length);

        try {
            System.out.println(arr[10]);
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("Truy cập arr[10]      -> " + e);
        }
    }
}
