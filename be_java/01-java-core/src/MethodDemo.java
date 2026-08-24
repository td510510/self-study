/**
 * Module 01 — Method: overloading, varargs, và "Java pass by value".
 * Chạy: java 01-java-core/src/MethodDemo.java
 */
public class MethodDemo {

    public static void main(String[] args) {
        System.out.println("--- Overloading ---");
        System.out.println("cong(2, 3)       = " + cong(2, 3));
        System.out.println("cong(2.5, 3.1)   = " + cong(2.5, 3.1));
        System.out.println("cong(1, 2, 3)    = " + cong(1, 2, 3));

        System.out.println("\n--- Varargs ---");
        System.out.println("tong()           = " + tong());
        System.out.println("tong(1,2,3,4,5)  = " + tong(1, 2, 3, 4, 5));

        System.out.println("\n--- Pass by value ---");
        int n = 5;
        doiSo(n);
        System.out.println("primitive sau khi gọi doiSo   : " + n);   // vẫn 5

        Person p = new Person("A");
        doiTen(p);
        System.out.println("object sau khi doiTen         : " + p.name);   // B
        thayThe(p);
        System.out.println("object sau khi thayThe        : " + p.name);   // vẫn B
    }

    static int cong(int a, int b) { return a + b; }
    static double cong(double a, double b) { return a + b; }
    static int cong(int a, int b, int c) { return a + b + c; }

    static int tong(int... so) {
        int t = 0;
        for (int x : so) t += x;
        return t;
    }

    static void doiSo(int x) { x = 100; }

    /** Sửa nội dung object -> bên ngoài THẤY được. */
    static void doiTen(Person p) { p.name = "B"; }

    /** Gán lại tham chiếu (bản sao) -> bên ngoài KHÔNG thấy. */
    static void thayThe(Person p) { p = new Person("C"); }

    static class Person {
        String name;
        Person(String name) { this.name = name; }
    }
}
