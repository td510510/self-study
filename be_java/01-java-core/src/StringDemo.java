/**
 * Module 01 — String: bất biến, so sánh, và vì sao cần StringBuilder.
 * Chạy: java 01-java-core/src/StringDemo.java
 */
public class StringDemo {

    public static void main(String[] args) {
        batBien();
        soSanh();
        apiThongDung();
        doHieuNang();
    }

    static void batBien() {
        System.out.println("--- String là immutable ---");
        String s = "hello";
        s.toUpperCase();                 // kết quả bị vứt đi
        System.out.println("Sau toUpperCase() không gán: " + s);
        s = s.toUpperCase();
        System.out.println("Sau khi gán lại            : " + s);
    }

    static void soSanh() {
        System.out.println("\n--- So sánh chuỗi ---");
        String a = "hello";
        String b = "hello";
        String c = new String("hello");

        System.out.println("a == b          = " + (a == b));        // true  (String Pool)
        System.out.println("a == c          = " + (a == c));        // false (object mới)
        System.out.println("a.equals(c)     = " + a.equals(c));     // true
        System.out.println("equalsIgnoreCase= " + a.equalsIgnoreCase("HELLO"));

        String role = null;
        // Viết hằng số trước để không bao giờ NPE:
        System.out.println("\"ADMIN\".equals(null) = " + "ADMIN".equals(role));
    }

    static void apiThongDung() {
        System.out.println("\n--- API hay dùng ---");
        String s = "  Java Backend Developer  ";
        System.out.println("length      = " + s.length());
        System.out.println("trim        = [" + s.trim() + "]");
        System.out.println("isBlank     = " + "   ".isBlank());
        System.out.println("contains    = " + s.contains("Backend"));
        System.out.println("indexOf     = " + s.indexOf("Backend"));
        System.out.println("substring   = " + s.trim().substring(0, 4));
        System.out.println("replace     = " + s.trim().replace("Java", "Kotlin"));
        System.out.println("split       = " + String.join(" | ", "a,b,c".split(",")));
        System.out.println("format      = " + String.format("%s có điểm %.2f", "An", 8.567));

        String block = """
                Text block (Java 15+):
                  giữ nguyên xuống dòng và thụt lề.
                """;
        System.out.print(block);
    }

    static void doHieuNang() {
        System.out.println("\n--- + vs StringBuilder trong vòng lặp (20.000 lần) ---");
        int n = 20_000;

        long t1 = System.currentTimeMillis();
        String s = "";
        for (int i = 0; i < n; i++) s += "x";
        long concat = System.currentTimeMillis() - t1;

        long t2 = System.currentTimeMillis();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) sb.append("x");
        String r = sb.toString();
        long builder = System.currentTimeMillis() - t2;

        System.out.println("Nối bằng +       : " + concat + " ms (độ dài " + s.length() + ")");
        System.out.println("StringBuilder    : " + builder + " ms (độ dài " + r.length() + ")");
    }
}
