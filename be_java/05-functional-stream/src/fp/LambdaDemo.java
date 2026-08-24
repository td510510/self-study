package fp;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.function.BiFunction;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.function.Supplier;
import java.util.function.UnaryOperator;

/** Lambda, functional interface chuẩn, method reference. */
public class LambdaDemo {

    @FunctionalInterface
    interface Calculator {
        int apply(int a, int b);
        default Calculator then(UnaryOperator<Integer> after) {
            return (a, b) -> after.apply(apply(a, b));
        }
    }

    record User(String name, int age, String email) { }

    public static void main(String[] args) {
        tuVietFunctionalInterface();
        sauInterfaceChuan();
        ketHopHam();
        methodReference();
        effectivelyFinal();
    }

    static void tuVietFunctionalInterface() {
        System.out.println("--- Functional interface tự viết ---");
        Calculator add = (a, b) -> a + b;
        Calculator mul = (a, b) -> a * b;
        System.out.println("add(2,3)          = " + add.apply(2, 3));
        System.out.println("mul(2,3)          = " + mul.apply(2, 3));
        System.out.println("add rồi nhân đôi  = " + add.then(x -> x * 2).apply(2, 3));
    }

    static void sauInterfaceChuan() {
        System.out.println("\n--- 6 functional interface chuẩn ---");
        Function<String, Integer> doDai = String::length;
        Predicate<String> rong = String::isBlank;
        Consumer<String> in = s -> System.out.println("  Consumer nhận: " + s);
        Supplier<List<String>> taoList = ArrayList::new;
        BiFunction<Integer, Integer, Integer> cong = Integer::sum;
        UnaryOperator<String> chuanHoa = s -> s.trim().toLowerCase();

        System.out.println("Function  : " + doDai.apply("backend"));
        System.out.println("Predicate : " + rong.test("   "));
        in.accept("xin chào");
        System.out.println("Supplier  : " + taoList.get());
        System.out.println("BiFunction: " + cong.apply(3, 4));
        System.out.println("UnaryOp   : [" + chuanHoa.apply("  JAVA  ") + "]");
    }

    static void ketHopHam() {
        System.out.println("\n--- Kết hợp hàm ---");
        Predicate<String> khongRong = s -> !s.isBlank();
        Predicate<String> daiHon5 = s -> s.length() > 5;

        System.out.println("and       : " + khongRong.and(daiHon5).test("hello world"));
        System.out.println("or        : " + khongRong.or(daiHon5).test("hi"));
        System.out.println("negate    : " + khongRong.negate().test(""));

        Function<Integer, Integer> themMot = x -> x + 1;
        System.out.println("andThen   : " + themMot.andThen(x -> x * 2).apply(3) + "  ((3+1)*2)");
        System.out.println("compose   : " + themMot.compose((Integer x) -> x * 2).apply(3) + "  ((3*2)+1)");
    }

    static void methodReference() {
        System.out.println("\n--- Method reference ---");
        List<User> users = new ArrayList<>(List.of(
                new User("Cường", 30, "cuong@example.com"),
                new User("An", 25, "an@example.com"),
                new User("Bình", 35, "binh@example.com")));

        users.sort(Comparator.comparing(User::name));                    // instance của kiểu
        System.out.println("Sắp theo tên  : " + users.stream().map(User::name).toList());

        users.sort(Comparator.comparingInt(User::age).reversed());
        System.out.println("Tuổi giảm dần : " + users.stream().map(u -> u.name() + "(" + u.age() + ")").toList());

        System.out.println("Static ref    : " + List.of("1", "2", "3").stream().map(Integer::parseInt).toList());
        System.out.print("Object ref    : ");
        users.stream().map(User::email).forEach(e -> System.out.print(e + " "));
        System.out.println();

        Supplier<ArrayList<String>> ctor = ArrayList::new;                 // constructor ref
        System.out.println("Ctor ref      : " + ctor.get());
    }

    static void effectivelyFinal() {
        System.out.println("\n--- Biến trong lambda phải effectively final ---");
        int base = 10;
        Function<Integer, Integer> f = x -> x + base;      // OK vì base không bị gán lại
        System.out.println("f(5) = " + f.apply(5));

        // base = 20;   // ❌ bỏ comment sẽ lỗi biên dịch: "must be final or effectively final"

        // Cần biến thay đổi: dùng mảng hoặc AtomicInteger
        int[] counter = {0};
        List.of("a", "b", "c").forEach(s -> counter[0]++);
        System.out.println("Đếm bằng mảng 1 phần tử = " + counter[0]);
        System.out.println("(Cách sạch hơn: dùng stream().count() hoặc reduce)");
    }
}
