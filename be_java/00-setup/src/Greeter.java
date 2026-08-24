/**
 * Ví dụ đọc tham số dòng lệnh.
 * Chạy: java 00-setup/src/Greeter.java Thinh
 */
public class Greeter {
    public static void main(String[] args) {
        String name = (args.length > 0) ? args[0] : "người lạ";
        System.out.println("Chào " + name + "!");
        System.out.println("Số tham số nhận được: " + args.length);
    }
}
