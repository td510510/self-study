package io;

import java.util.List;
import java.util.Map;

/** Exception: các loại thường gặp, custom exception, bọc lỗi giữ nguyên cause. */
public class ExceptionDemo {

    // ---- Exception nghiệp vụ: kế thừa RuntimeException, mang theo dữ liệu ngữ cảnh ----
    static class InsufficientFundsException extends RuntimeException {
        private final long balance, requested;
        InsufficientFundsException(long balance, long requested) {
            super("Không đủ số dư: có %d, cần %d".formatted(balance, requested));
            this.balance = balance;
            this.requested = requested;
        }
        long shortfall() { return requested - balance; }
    }

    static class DataAccessException extends RuntimeException {
        DataAccessException(String message, Throwable cause) { super(message, cause); }
    }

    public static void main(String[] args) {
        loiThuongGap();
        customException();
        bocLoiGiuCause();
        finallyVaTryWithResources();
    }

    static void loiThuongGap() {
        System.out.println("--- Các exception hay gặp ---");

        try {
            String s = null;
            s.length();
        } catch (NullPointerException e) {
            System.out.println("NPE          : " + e.getMessage());
        }

        try {
            System.out.println(10 / 0);
        } catch (ArithmeticException e) {
            System.out.println("Chia 0       : " + e.getMessage());
        }

        try {
            List.of(1, 2, 3).get(5);
        } catch (IndexOutOfBoundsException e) {
            System.out.println("Index        : " + e.getMessage());
        }

        try {
            Integer.parseInt("abc");
        } catch (NumberFormatException e) {
            System.out.println("Parse số     : " + e.getMessage());
        }

        try {
            Object o = "chuỗi";
            Integer i = (Integer) o;
        } catch (ClassCastException e) {
            System.out.println("Ép kiểu      : " + e.getMessage());
        }

        try {
            Map.of("a", 1).put("b", 2);
        } catch (UnsupportedOperationException e) {
            System.out.println("Map bất biến : UnsupportedOperationException");
        }
    }

    static void customException() {
        System.out.println("\n--- Custom exception mang dữ liệu ---");
        try {
            withdraw(1_000_000, 1_500_000);
        } catch (InsufficientFundsException e) {
            System.out.println("Thông điệp : " + e.getMessage());
            System.out.println("Còn thiếu  : " + e.shortfall() + "đ  <- tầng trên dùng số này dựng response");
        }

        try {
            withdraw(1_000_000, -5);
        } catch (IllegalArgumentException e) {
            System.out.println("Tham số sai: " + e.getMessage());
        }
    }

    static void withdraw(long balance, long amount) {
        if (amount <= 0) throw new IllegalArgumentException("Số tiền phải > 0, nhận được " + amount);
        if (amount > balance) throw new InsufficientFundsException(balance, amount);
        System.out.println("Rút thành công " + amount);
    }

    static void bocLoiGiuCause() {
        System.out.println("\n--- Bọc lỗi nhưng GIỮ nguyên nhân gốc ---");
        try {
            saveUser("u-01");
        } catch (DataAccessException e) {
            System.out.println("Bắt được   : " + e.getMessage());
            System.out.println("Caused by  : " + e.getCause());
            System.out.println("=> Không truyền cause thì mất sạch dấu vết lỗi gốc.");
        }
    }

    static void saveUser(String id) {
        try {
            throw new java.sql.SQLException("connection refused: localhost:5432");
        } catch (java.sql.SQLException e) {
            throw new DataAccessException("Không lưu được user " + id, e);
        }
    }

    static void finallyVaTryWithResources() {
        System.out.println("\n--- finally & try-with-resources ---");
        System.out.println("Kết quả method có finally: " + demoFinally());

        class FakeResource implements AutoCloseable {
            private final String name;
            FakeResource(String name) { this.name = name; System.out.println("  Mở " + name); }
            void use() { System.out.println("  Dùng " + name); }
            @Override public void close() { System.out.println("  Đóng " + name); }
        }

        try (FakeResource a = new FakeResource("A");
             FakeResource b = new FakeResource("B")) {
            a.use(); b.use();
            throw new IllegalStateException("Có lỗi giữa chừng!");
        } catch (IllegalStateException e) {
            System.out.println("  Bắt lỗi: " + e.getMessage() + " (tài nguyên vẫn được đóng ngược thứ tự)");
        }
    }

    @SuppressWarnings("finally")
    static int demoFinally() {
        try {
            return 1;
        } finally {
            System.out.println("  finally vẫn chạy dù đã return");
        }
    }
}
