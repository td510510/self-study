package oop;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

/**
 * equals/hashCode: vì sao phải override CẢ HAI.
 * Chạy để thấy dữ liệu "biến mất" trong HashSet khi làm sai.
 */
public class EqualsDemo {

    /** SAI: không override gì cả -> so sánh theo địa chỉ object. */
    static class UserWrong {
        final String email;
        UserWrong(String email) { this.email = email; }
        @Override public String toString() { return "UserWrong(" + email + ")"; }
    }

    /** SAI TINH VI: override equals nhưng quên hashCode -> HashSet hỏng. */
    static class UserHalf {
        final String email;
        UserHalf(String email) { this.email = email; }
        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof UserHalf u)) return false;
            return Objects.equals(email, u.email);
        }
        @Override public String toString() { return "UserHalf(" + email + ")"; }
    }

    /** ĐÚNG: override cả hai, dựa trên cùng một tập field. */
    static class User {
        final String email;
        User(String email) { this.email = email; }
        @Override public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof User u)) return false;
            return Objects.equals(email, u.email);
        }
        @Override public int hashCode() { return Objects.hash(email); }
        @Override public String toString() { return "User(" + email + ")"; }
    }

    /** Cách gọn nhất: record tự sinh equals/hashCode đúng chuẩn. */
    record UserRecord(String email) { }

    public static void main(String[] args) {
        String mail = "a@example.com";

        System.out.println("--- equals ---");
        System.out.println("UserWrong  : " + new UserWrong(mail).equals(new UserWrong(mail)));   // false
        System.out.println("UserHalf   : " + new UserHalf(mail).equals(new UserHalf(mail)));     // true
        System.out.println("User       : " + new User(mail).equals(new User(mail)));             // true
        System.out.println("UserRecord : " + new UserRecord(mail).equals(new UserRecord(mail))); // true

        System.out.println("\n--- HashSet: mong đợi size = 1 ---");
        Set<UserWrong> s1 = new HashSet<>();
        s1.add(new UserWrong(mail)); s1.add(new UserWrong(mail));
        System.out.println("UserWrong  size = " + s1.size() + "  (sai: trùng vẫn thêm)");

        Set<UserHalf> s2 = new HashSet<>();
        s2.add(new UserHalf(mail)); s2.add(new UserHalf(mail));
        System.out.println("UserHalf   size = " + s2.size() + "  (sai: equals đúng nhưng hash khác nhau)");

        Set<User> s3 = new HashSet<>();
        s3.add(new User(mail)); s3.add(new User(mail));
        System.out.println("User       size = " + s3.size() + "  ✅");

        System.out.println("\n--- Tìm lại phần tử trong HashSet ---");
        System.out.println("s2.contains(UserHalf) = " + s2.contains(new UserHalf(mail)) + "  (mất dấu!)");
        System.out.println("s3.contains(User)     = " + s3.contains(new User(mail)));

        System.out.println("\nBài học: equals và hashCode phải luôn đi cùng nhau,");
        System.out.println("và nên dựa trên đúng những field định danh object.");
    }
}
