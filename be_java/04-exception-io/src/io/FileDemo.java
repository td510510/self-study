package io;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * File I/O với NIO (java.nio.file) — cách hiện đại.
 * Chạy: java 04-exception-io/src/io/FileDemo.java   (file tạm nằm trong thư mục ./tmp-demo)
 */
public class FileDemo {

    static final Path DIR = Path.of("tmp-demo");

    public static void main(String[] args) throws IOException {
        Files.createDirectories(DIR);

        ghiVaDoc();
        themVaoCuoiFile();
        docFileLon();
        docGhiCsv();
        thaoTacFile();

        // dọn dẹp
        try (Stream<Path> paths = Files.walk(DIR)) {
            paths.sorted((a, b) -> b.getNameCount() - a.getNameCount())
                 .forEach(p -> { try { Files.deleteIfExists(p); } catch (IOException ignored) { } });
        }
        System.out.println("\nĐã dọn thư mục tạm.");
    }

    static void ghiVaDoc() throws IOException {
        System.out.println("--- Ghi & đọc toàn bộ file ---");
        Path f = DIR.resolve("note.txt");

        Files.writeString(f, "Dòng 1: học Java\nDòng 2: học Spring\n", StandardCharsets.UTF_8);
        System.out.println("Nội dung:\n" + Files.readString(f, StandardCharsets.UTF_8).indent(2).stripTrailing());

        List<String> lines = Files.readAllLines(f, StandardCharsets.UTF_8);
        System.out.println("Số dòng: " + lines.size());
        System.out.println("Kích thước: " + Files.size(f) + " bytes");
    }

    static void themVaoCuoiFile() throws IOException {
        System.out.println("\n--- Ghi thêm (APPEND) ---");
        Path log = DIR.resolve("app.log");
        for (int i = 1; i <= 3; i++) {
            Files.writeString(log, "2026-08-24 10:0" + i + ":00 INFO  UserService Đăng nhập ok\n",
                    StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        }
        Files.writeString(log, "2026-08-24 10:04:00 ERROR OrderService Không tìm thấy đơn hàng\n",
                StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.APPEND);
        System.out.print(Files.readString(log));
    }

    static void docFileLon() throws IOException {
        System.out.println("--- Đọc file lớn: KHÔNG nạp hết vào RAM ---");
        Path log = DIR.resolve("app.log");

        // Cách 1: Stream (nhớ try-with-resources để đóng file handle)
        try (Stream<String> lines = Files.lines(log, StandardCharsets.UTF_8)) {
            long errors = lines.filter(l -> l.contains("ERROR")).count();
            System.out.println("Số dòng ERROR (Files.lines): " + errors);
        }

        // Cách 2: BufferedReader — đếm theo mức log
        Map<String, Integer> byLevel = new HashMap<>();
        try (BufferedReader br = Files.newBufferedReader(log, StandardCharsets.UTF_8)) {
            String line;
            while ((line = br.readLine()) != null) {
                String[] parts = line.split("\\s+");
                if (parts.length >= 3) byLevel.merge(parts[2], 1, Integer::sum);
            }
        }
        System.out.println("Thống kê theo mức log: " + byLevel);
    }

    static void docGhiCsv() throws IOException {
        System.out.println("\n--- CSV ---");
        Path csv = DIR.resolve("students.csv");

        List<String> rows = new ArrayList<>();
        rows.add("id,name,gpa");
        rows.add("1,An,8.5");
        rows.add("2,Bình,7.2");
        rows.add("3,Cường,9.1");
        Files.write(csv, rows, StandardCharsets.UTF_8);

        record Student(int id, String name, double gpa) { }
        List<Student> students = new ArrayList<>();
        try (Stream<String> lines = Files.lines(csv, StandardCharsets.UTF_8)) {
            lines.skip(1)                                  // bỏ dòng tiêu đề
                 .map(l -> l.split(","))
                 .forEach(p -> students.add(new Student(Integer.parseInt(p[0]), p[1], Double.parseDouble(p[2]))));
        }
        students.forEach(s -> System.out.printf("  %d | %-8s | %.1f%n", s.id(), s.name(), s.gpa()));
        System.out.printf("GPA trung bình: %.2f%n",
                students.stream().mapToDouble(Student::gpa).average().orElse(0));
    }

    static void thaoTacFile() throws IOException {
        System.out.println("\n--- Thao tác file/thư mục ---");
        Path src = DIR.resolve("note.txt");
        Path backupDir = DIR.resolve("backup");
        Files.createDirectories(backupDir);
        Path copy = backupDir.resolve("note-copy.txt");

        Files.copy(src, copy, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
        System.out.println("exists(copy)      = " + Files.exists(copy));
        System.out.println("isDirectory(dir)  = " + Files.isDirectory(backupDir));
        System.out.println("fileName          = " + copy.getFileName());
        System.out.println("toAbsolutePath    = " + copy.toAbsolutePath());

        // Lỗi hay gặp: đọc file không tồn tại
        try {
            Files.readString(DIR.resolve("khong-ton-tai.txt"));
        } catch (java.nio.file.NoSuchFileException e) {
            System.out.println("Đọc file thiếu    -> NoSuchFileException: " + e.getMessage());
        }

        // Muốn dùng trong lambda/stream mà không khai báo checked exception:
        try {
            Stream.of("khong-ton-tai.txt").forEach(name -> {
                try {
                    Files.readString(DIR.resolve(name));
                } catch (IOException e) {
                    throw new UncheckedIOException(e);   // bọc checked -> unchecked
                }
            });
        } catch (UncheckedIOException e) {
            System.out.println("Trong lambda      -> bọc thành UncheckedIOException");
        }
    }
}
