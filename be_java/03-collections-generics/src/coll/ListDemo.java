package coll;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;

/** List: thao tác cơ bản, các bẫy, và so sánh hiệu năng ArrayList vs LinkedList. */
public class ListDemo {

    public static void main(String[] args) {
        coBan();
        bayXoaKhiDuyet();
        bayRemoveIntVsObject();
        bayListOfBatBien();
        hieuNang();
    }

    static void coBan() {
        System.out.println("--- Thao tác cơ bản ---");
        List<String> list = new ArrayList<>();
        list.add("Java");
        list.add("Spring");
        list.add(0, "Backend");
        System.out.println(list);
        System.out.println("get(0)     = " + list.get(0));
        System.out.println("indexOf    = " + list.indexOf("Spring"));
        list.set(0, "BE");
        list.remove("Java");
        System.out.println("Sau khi sửa = " + list);
    }

    static void bayXoaKhiDuyet() {
        System.out.println("\n--- Bẫy: xóa trong lúc for-each ---");
        List<String> list = new ArrayList<>(List.of("apple", "banana", "avocado", "cherry"));
        try {
            for (String s : list) {
                if (s.startsWith("a")) list.remove(s);
            }
        } catch (java.util.ConcurrentModificationException e) {
            System.out.println("for-each + remove -> " + e.getClass().getSimpleName());
        }

        List<String> l2 = new ArrayList<>(List.of("apple", "banana", "avocado", "cherry"));
        l2.removeIf(s -> s.startsWith("a"));
        System.out.println("removeIf         -> " + l2);

        List<String> l3 = new ArrayList<>(List.of("apple", "banana", "avocado", "cherry"));
        Iterator<String> it = l3.iterator();
        while (it.hasNext()) {
            if (it.next().startsWith("a")) it.remove();
        }
        System.out.println("Iterator.remove  -> " + l3);
    }

    static void bayRemoveIntVsObject() {
        System.out.println("\n--- Bẫy: remove(int) vs remove(Object) ---");
        List<Integer> a = new ArrayList<>(List.of(10, 20, 30));
        a.remove(1);
        System.out.println("remove(1)                -> " + a + "  (xóa theo chỉ số)");

        List<Integer> b = new ArrayList<>(List.of(10, 20, 30));
        b.remove(Integer.valueOf(10));
        System.out.println("remove(Integer.valueOf(10)) -> " + b + "  (xóa theo giá trị)");
    }

    static void bayListOfBatBien() {
        System.out.println("\n--- Bẫy: List.of / Arrays.asList ---");
        List<String> immutable = List.of("a", "b");
        try {
            immutable.add("c");
        } catch (UnsupportedOperationException e) {
            System.out.println("List.of().add()        -> UnsupportedOperationException");
        }
        List<String> fixed = Arrays.asList("a", "b");
        fixed.set(0, "z");
        System.out.println("Arrays.asList().set()  -> " + fixed + " (set được)");
        try {
            fixed.add("c");
        } catch (UnsupportedOperationException e) {
            System.out.println("Arrays.asList().add()  -> UnsupportedOperationException");
        }
    }

    static void hieuNang() {
        int n = 100_000;
        System.out.println("\n--- Hiệu năng với " + n + " phần tử ---");

        List<Integer> arrayList = new ArrayList<>();
        List<Integer> linkedList = new LinkedList<>();
        for (int i = 0; i < n; i++) { arrayList.add(i); linkedList.add(i); }

        long t = System.nanoTime();
        for (int i = 0; i < 10_000; i++) arrayList.get(i * 5);
        System.out.printf("ArrayList  get()  : %6.2f ms%n", (System.nanoTime() - t) / 1e6);

        t = System.nanoTime();
        for (int i = 0; i < 10_000; i++) linkedList.get(i * 5);
        System.out.printf("LinkedList get()  : %6.2f ms  <- chậm hơn nhiều%n", (System.nanoTime() - t) / 1e6);

        List<Integer> a2 = new ArrayList<>();
        t = System.nanoTime();
        for (int i = 0; i < 50_000; i++) a2.add(0, i);
        System.out.printf("ArrayList  add(0) : %6.2f ms%n", (System.nanoTime() - t) / 1e6);

        List<Integer> l2 = new LinkedList<>();
        t = System.nanoTime();
        for (int i = 0; i < 50_000; i++) l2.add(0, i);
        System.out.printf("LinkedList add(0) : %6.2f ms  <- nhanh hơn%n", (System.nanoTime() - t) / 1e6);

        System.out.println("\nKết luận: thực tế đọc theo chỉ số nhiều hơn chèn đầu -> mặc định ArrayList.");
    }
}
