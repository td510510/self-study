package com.learn.library.util;

import com.learn.library.model.Book;
import com.learn.library.model.Member;
import com.learn.library.service.LibraryService;

import java.time.LocalDate;

/** Nạp dữ liệu mẫu để chạy thử ngay. */
public final class SampleData {

    public static void load(LibraryService service) {
        LocalDate today = LocalDate.now();

        service.addBook(new Book("978-604-1", "Clean Code", "Robert C. Martin", "Lập trình", 3));
        service.addBook(new Book("978-604-2", "Effective Java", "Joshua Bloch", "Lập trình", 2));
        service.addBook(new Book("978-604-3", "Design Patterns", "Gang of Four", "Lập trình", 1));
        service.addBook(new Book("978-604-4", "Nhà Giả Kim", "Paulo Coelho", "Văn học", 4));
        service.addBook(new Book("978-604-5", "Đắc Nhân Tâm", "Dale Carnegie", "Kỹ năng", 5));
        service.addBook(new Book("978-604-6", "Sapiens", "Yuval Noah Harari", "Lịch sử", 2));

        service.addMember(new Member("TV001", "Nguyễn Văn An", "an@example.com", "0912345678", today.minusMonths(6)));
        service.addMember(new Member("TV002", "Trần Thị Bình", "binh@example.com", "0987654321", today.minusMonths(3)));
        service.addMember(new Member("TV003", "Lê Văn Cường", "cuong@example.com", "0909090909", today.minusDays(20)));

        // Vài lượt mượn có sẵn, trong đó một lượt đã quá hạn để thấy phí phạt
        service.borrowBook("TV001", "978-604-1", today.minusDays(20));   // quá hạn 6 ngày
        service.borrowBook("TV002", "978-604-4", today.minusDays(3));
        service.borrowBook("TV002", "978-604-5", today.minusDays(1));
    }

    private SampleData() { }
}
