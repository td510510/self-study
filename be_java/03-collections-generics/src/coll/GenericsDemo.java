package coll;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** Generics: class generic, method generic, bounded type, PECS, type erasure. */
public class GenericsDemo {

    // ----- Class generic -----
    static class Box<T> {
        private T value;
        void set(T value) { this.value = value; }
        T get() { return value; }
        @Override public String toString() { return "Box(" + value + ")"; }
    }

    // ----- Nhiều tham số kiểu -----
    record Pair<K, V>(K key, V value) { }

    // ----- Mẫu ApiResponse (sẽ dùng lại ở Module 11) -----
    record ApiResponse<T>(boolean success, String message, T data) {
        static <T> ApiResponse<T> ok(T data) { return new ApiResponse<>(true, "OK", data); }
        static <T> ApiResponse<T> error(String msg) { return new ApiResponse<>(false, msg, null); }
    }

    // ----- Repository generic: mô hình bạn sẽ gặp trong Spring Data -----
    interface Repository<T, ID> {
        void save(T entity);
        Optional<T> findById(ID id);
        List<T> findAll();
    }

    record User(Long id, String name) { }

    static class InMemoryUserRepository implements Repository<User, Long> {
        private final List<User> data = new ArrayList<>();
        @Override public void save(User u) { data.add(u); }
        @Override public Optional<User> findById(Long id) {
            return data.stream().filter(u -> u.id().equals(id)).findFirst();
        }
        @Override public List<User> findAll() { return List.copyOf(data); }
    }

    // ----- Method generic + bounded type -----
    static <T> void printAll(List<T> list) {
        for (T t : list) System.out.print(t + " ");
        System.out.println();
    }

    static <T extends Number> double sum(List<T> list) {
        double s = 0;
        for (T n : list) s += n.doubleValue();
        return s;
    }

    static <T extends Comparable<T>> T max(List<T> list) {
        T best = list.get(0);
        for (T t : list) if (t.compareTo(best) > 0) best = t;
        return best;
    }

    // ----- PECS: Producer Extends -----
    static double total(List<? extends Number> nums) {
        double s = 0;
        for (Number n : nums) s += n.doubleValue();
        return s;
    }

    // ----- PECS: Consumer Super -----
    static void addIntegers(List<? super Integer> list) {
        list.add(1);
        list.add(2);
    }

    public static void main(String[] args) {
        System.out.println("--- Class generic ---");
        Box<String> b1 = new Box<>(); b1.set("xin chào");
        Box<Integer> b2 = new Box<>(); b2.set(42);
        System.out.println(b1 + " / " + b2);
        System.out.println("Pair: " + new Pair<>("tuoi", 25));

        System.out.println("\n--- Method generic ---");
        printAll(List.of("a", "b", "c"));
        System.out.println("sum(int)    = " + sum(List.of(1, 2, 3)));
        System.out.println("sum(double) = " + sum(List.of(1.5, 2.5)));
        System.out.println("max(String) = " + max(List.of("pear", "apple", "zebra")));

        System.out.println("\n--- PECS ---");
        System.out.println("total(List<Integer>) = " + total(List.of(1, 2, 3)));
        System.out.println("total(List<Double>)  = " + total(List.of(1.5, 2.5)));
        List<Number> nums = new ArrayList<>();
        addIntegers(nums);
        System.out.println("Sau addIntegers      = " + nums);

        System.out.println("\n--- Repository generic ---");
        Repository<User, Long> repo = new InMemoryUserRepository();
        repo.save(new User(1L, "An"));
        repo.save(new User(2L, "Binh"));
        System.out.println("findById(2) = " + repo.findById(2L).orElse(null));
        System.out.println("findById(9) = " + repo.findById(9L).orElse(null));
        System.out.println("findAll     = " + repo.findAll());

        System.out.println("\n--- ApiResponse ---");
        System.out.println(ApiResponse.ok(repo.findAll()));
        System.out.println(ApiResponse.error("Không tìm thấy người dùng"));

        System.out.println("\n--- Type erasure ---");
        List<String> ls = new ArrayList<>();
        List<Integer> li = new ArrayList<>();
        System.out.println("List<String>.getClass() == List<Integer>.getClass() : "
                + (ls.getClass() == li.getClass()));
        System.out.println("=> Lúc chạy JVM không biết kiểu generic; nên không thể new T() hay tạo mảng generic.");
    }
}
