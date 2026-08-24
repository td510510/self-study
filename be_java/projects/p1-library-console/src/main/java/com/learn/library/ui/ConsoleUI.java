package com.learn.library.ui;

import com.learn.library.exception.LibraryException;
import com.learn.library.model.Book;
import com.learn.library.model.Loan;
import com.learn.library.model.Member;
import com.learn.library.service.LibraryService;

import java.time.LocalDate;
import java.util.List;
import java.util.Scanner;

/**
 * Tầng giao diện: CHỈ lo nhập/xuất, mọi quy tắc nghiệp vụ nằm ở LibraryService.
 * Sang Dự án 2, class này được thay bằng REST Controller — service giữ nguyên.
 */
public class ConsoleUI {

    private final LibraryService service;
    private final Scanner scanner = new Scanner(System.in);
    private LocalDate today = LocalDate.now();      // cho phép "du hành thời gian" để thử phí trễ

    public ConsoleUI(LibraryService service) { this.service = service; }

    public void run() {
        System.out.println("""
                ============================================
                     HỆ THỐNG QUẢN LÝ THƯ VIỆN v1.0
                ============================================""");
        boolean running = true;
        while (running) {
            printMenu();
            switch (readLine("Chọn chức năng: ")) {
                case "1" -> safely(this::listBooks);
                case "2" -> safely(this::searchBooks);
                case "3" -> safely(this::addBook);
                case "4" -> safely(this::listMembers);
                case "5" -> safely(this::addMember);
                case "6" -> safely(this::borrowBook);
                case "7" -> safely(this::returnBook);
                case "8" -> safely(this::memberLoans);
                case "9" -> safely(this::overdueReport);
                case "10" -> safely(this::statistics);
                case "11" -> safely(this::travelInTime);
                case "0" -> running = false;
                default -> System.out.println("⚠ Lựa chọn không hợp lệ.");
            }
        }
        System.out.println("Tạm biệt!");
    }

    private void printMenu() {
        System.out.printf("""

                --------- MENU (hôm nay: %s) ---------
                 1. Danh sách sách            7. Trả sách
                 2. Tìm sách                  8. Sách đang mượn của thành viên
                 3. Thêm sách                 9. Báo cáo quá hạn
                 4. Danh sách thành viên     10. Thống kê
                 5. Thêm thành viên          11. Đổi ngày hệ thống (thử phí trễ)
                 6. Mượn sách                 0. Thoát
                """, today);
    }

    // ------------------------------------------------------- Chức năng
    private void listBooks() {
        List<Book> books = service.allBooks();
        System.out.println("\nISBN           | Tên sách                             | Tác giả            | Thể loại    | Còn/Tổng");
        System.out.println("-".repeat(110));
        books.forEach(b -> System.out.println(b));
        System.out.println("Tổng: " + books.size() + " đầu sách");
    }

    private void searchBooks() {
        String kw = readLine("Từ khóa (tên sách/tác giả): ");
        List<Book> found = service.searchBooks(kw);
        if (found.isEmpty()) {
            System.out.println("Không tìm thấy sách nào khớp \"" + kw + "\".");
            return;
        }
        found.forEach(System.out::println);
        System.out.println("Tìm thấy " + found.size() + " kết quả.");
    }

    private void addBook() {
        String isbn = readLine("ISBN: ");
        String title = readLine("Tên sách: ");
        String author = readLine("Tác giả: ");
        String category = readLine("Thể loại: ");
        int copies = readInt("Số bản: ");
        service.addBook(new Book(isbn, title, author, category, copies));
        System.out.println("✅ Đã thêm sách.");
    }

    private void listMembers() {
        System.out.println("\nMã      | Họ tên               | Email                    | SĐT         | Trạng thái");
        System.out.println("-".repeat(100));
        service.allMembers().forEach(System.out::println);
    }

    private void addMember() {
        String code = readLine("Mã thành viên: ");
        String name = readLine("Họ tên: ");
        String email = readLine("Email: ");
        String phone = readLine("SĐT: ");
        service.addMember(new Member(code, name, email, phone, today));
        System.out.println("✅ Đã thêm thành viên.");
    }

    private void borrowBook() {
        String code = readLine("Mã thành viên: ");
        String isbn = readLine("ISBN sách: ");
        Loan loan = service.borrowBook(code, isbn, today);
        System.out.printf("✅ Mượn thành công. Mã lượt mượn %s, hạn trả %s%n", loan.getId(), loan.getDueDate());
    }

    private void returnBook() {
        String loanId = readLine("Mã lượt mượn: ");
        long fee = service.returnBook(loanId, today);
        if (fee > 0) {
            System.out.printf("✅ Đã trả. Trả trễ — phí phạt %,dđ%n", fee);
        } else {
            System.out.println("✅ Đã trả đúng hạn, không mất phí.");
        }
    }

    private void memberLoans() {
        String code = readLine("Mã thành viên: ");
        List<Loan> loans = service.activeLoansOf(code);
        if (loans.isEmpty()) {
            System.out.println("Thành viên này không giữ cuốn nào.");
            return;
        }
        loans.forEach(l -> System.out.printf("  %s | %-36s | hạn %s%s%n",
                l.getId(),
                service.getBook(l.getIsbn()).getTitle(),
                l.getDueDate(),
                l.isOverdue(today) ? "  ⚠ QUÁ HẠN " + l.lateDays(today) + " ngày" : ""));
    }

    private void overdueReport() {
        List<Loan> overdue = service.overdueLoans(today);
        if (overdue.isEmpty()) {
            System.out.println("🎉 Không có lượt mượn nào quá hạn.");
            return;
        }
        System.out.println("\nDANH SÁCH QUÁ HẠN");
        long totalFee = 0;
        for (Loan l : overdue) {
            long days = l.lateDays(today);
            long fee = days * Loan.FEE_PER_LATE_DAY;
            totalFee += fee;
            System.out.printf("  %s | %-8s | %-34s | trễ %2d ngày | phí dự kiến %,8dđ%n",
                    l.getId(), l.getMemberCode(), service.getBook(l.getIsbn()).getTitle(), days, fee);
        }
        System.out.printf("Tổng phí dự kiến: %,dđ%n", totalFee);
    }

    private void statistics() {
        System.out.println("\n===== THỐNG KÊ =====");
        System.out.println("Số đầu sách        : " + service.allBooks().size());
        System.out.println("Số thành viên      : " + service.allMembers().size());
        System.out.println("Tổng lượt mượn     : " + service.allLoans().size());
        System.out.println("Đang mượn          : " + service.allLoans().stream().filter(l -> !l.isReturned()).count());
        System.out.printf("Phí phạt đã thu    : %,dđ%n", service.totalFeeCollected());

        System.out.println("\nSách theo thể loại:");
        service.booksByCategory().forEach((k, v) -> System.out.printf("  %-14s %d%n", k, v));

        System.out.println("\nTop sách mượn nhiều:");
        service.topBorrowedBooks(5).forEach((k, v) -> System.out.printf("  %-38s %d lượt%n", k, v));

        System.out.println("\nSách sắp hết (còn <= 1 bản):");
        service.lowStockBooks(1).forEach(b -> System.out.printf("  %-38s còn %d%n", b.getTitle(), b.getAvailableCopies()));
    }

    private void travelInTime() {
        int days = readInt("Tiến bao nhiêu ngày (âm để lùi): ");
        today = today.plusDays(days);
        System.out.println("Ngày hệ thống giờ là: " + today);
    }

    // --------------------------------------------------------- Tiện ích
    /** Bắt lỗi nghiệp vụ tại đúng một chỗ — chương trình không bao giờ crash vì nhập sai. */
    private void safely(Runnable action) {
        try {
            action.run();
        } catch (LibraryException | IllegalArgumentException | IllegalStateException e) {
            System.out.println("❌ " + e.getMessage());
        } catch (RuntimeException e) {
            System.out.println("❌ Lỗi không mong đợi: " + e);
        }
    }

    private String readLine(String prompt) {
        System.out.print(prompt);
        return scanner.nextLine().trim();
    }

    private int readInt(String prompt) {
        while (true) {
            String s = readLine(prompt);
            try {
                return Integer.parseInt(s);
            } catch (NumberFormatException e) {
                System.out.println("⚠ Phải nhập số nguyên.");
            }
        }
    }
}
