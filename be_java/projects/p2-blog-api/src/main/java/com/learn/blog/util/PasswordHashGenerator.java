package com.learn.blog.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Tiện ích sinh hash BCrypt cho dữ liệu mẫu.
 *
 * Chạy trong IDE, hoặc:
 *   mvn compile exec:java -Dexec.mainClass=com.learn.blog.util.PasswordHashGenerator -Dexec.args=matkhau
 *
 * Sau đó cập nhật vào DB:
 *   UPDATE users SET password = '<hash>' WHERE email = 'admin@blog.com';
 */
public final class PasswordHashGenerator {

    public static void main(String[] args) {
        String raw = args.length > 0 ? args[0] : "Password123";
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

        System.out.println("Mật khẩu gốc : " + raw);
        for (int i = 1; i <= 3; i++) {
            String hash = encoder.encode(raw);
            System.out.printf("Hash lần %d   : %s  (matches = %b)%n", i, hash, encoder.matches(raw, hash));
        }
        System.out.println("""

                3 hash khác nhau vì BCrypt tự sinh salt ngẫu nhiên cho mỗi lần băm,
                nhưng matches() vẫn đúng vì salt được lưu ngay trong chuỗi hash.""");
    }

    private PasswordHashGenerator() { }
}
