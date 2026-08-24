package io;

import java.util.List;
import java.util.Optional;

/** Optional: dùng đúng cách để loại bỏ NullPointerException. */
public class OptionalDemo {

    record User(Long id, String name, String email, String phone) { }

    static class UserRepository {
        private final List<User> data = List.of(
                new User(1L, "An", "an@example.com", null),
                new User(2L, "Bình", "binh@example.com", "0912345678"));

        /** Kiểu trả về Optional nói rõ: "có thể không tìm thấy". */
        Optional<User> findById(Long id) {
            return data.stream().filter(u -> u.id().equals(id)).findFirst();
        }

        /** ❌ Cách cũ: trả null -> người gọi rất dễ quên kiểm tra. */
        User findByIdOrNull(Long id) {
            return data.stream().filter(u -> u.id().equals(id)).findFirst().orElse(null);
        }
    }

    static class UserNotFoundException extends RuntimeException {
        UserNotFoundException(Long id) { super("Không tìm thấy user id=" + id); }
    }

    public static void main(String[] args) {
        UserRepository repo = new UserRepository();

        System.out.println("--- Vấn đề của null ---");
        try {
            System.out.println(repo.findByIdOrNull(99L).name());
        } catch (NullPointerException e) {
            System.out.println("Trả null -> NPE khi người gọi quên kiểm tra");
        }

        System.out.println("\n--- Các cách dùng Optional ---");
        Optional<User> found = repo.findById(1L);
        Optional<User> missing = repo.findById(99L);

        found.ifPresent(u -> System.out.println("ifPresent      : " + u.name()));
        missing.ifPresentOrElse(
                u -> System.out.println("có: " + u.name()),
                () -> System.out.println("ifPresentOrElse: không có user 99"));

        System.out.println("orElse         : " + missing.map(User::name).orElse("Khách"));
        System.out.println("orElseGet      : " + missing.map(User::name).orElseGet(() -> taoTenMacDinh()));
        System.out.println("map + filter   : " + found.map(User::email)
                .filter(e -> e.endsWith("example.com")).orElse("email không hợp lệ"));

        try {
            missing.orElseThrow(() -> new UserNotFoundException(99L));
        } catch (UserNotFoundException e) {
            System.out.println("orElseThrow    : " + e.getMessage());
        }

        System.out.println("\n--- Xử lý field có thể null ---");
        String phone = repo.findById(1L)
                .map(User::phone)
                .orElse("chưa cập nhật");
        System.out.println("Số điện thoại của An: " + phone);

        System.out.println("\n--- orElse vs orElseGet ---");
        System.out.println("Gọi orElse trên Optional CÓ giá trị:");
        found.map(User::name).orElse(taoTenMacDinh());        // vẫn chạy taoTenMacDinh!
        System.out.println("Gọi orElseGet trên Optional CÓ giá trị:");
        found.map(User::name).orElseGet(() -> taoTenMacDinh()); // KHÔNG chạy
        System.out.println("=> Nếu giá trị mặc định tốn kém (query DB), dùng orElseGet.");

        System.out.println("\n--- KHÔNG nên ---");
        System.out.println("❌ opt.get() khi chưa kiểm tra   -> NoSuchElementException");
        System.out.println("❌ Optional làm tham số method   -> dùng overload thay thế");
        System.out.println("❌ Optional làm field của entity -> không serialize được");
    }

    static String taoTenMacDinh() {
        System.out.println("   (đang tính giá trị mặc định — tốn kém)");
        return "Khách vãng lai";
    }
}
