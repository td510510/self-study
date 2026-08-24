package com.learn.library;

import com.learn.library.repository.BookRepository;
import com.learn.library.repository.InMemoryBookRepository;
import com.learn.library.repository.InMemoryLoanRepository;
import com.learn.library.repository.InMemoryMemberRepository;
import com.learn.library.repository.LoanRepository;
import com.learn.library.repository.MemberRepository;
import com.learn.library.service.LibraryService;
import com.learn.library.ui.ConsoleUI;
import com.learn.library.util.SampleData;

/**
 * Điểm khởi động — cũng chính là "composition root": nơi duy nhất lắp ráp các phụ thuộc.
 *
 * Chú ý: cả ứng dụng chỉ có ĐÚNG chỗ này gọi `new` các implementation.
 * Ở Dự án 2, Spring sẽ làm chính xác việc này thay bạn (@Component + @Autowired).
 */
public class LibraryApplication {

    public static void main(String[] args) {
        BookRepository bookRepo = new InMemoryBookRepository();
        MemberRepository memberRepo = new InMemoryMemberRepository();
        LoanRepository loanRepo = new InMemoryLoanRepository();

        LibraryService service = new LibraryService(bookRepo, memberRepo, loanRepo);

        SampleData.load(service);

        new ConsoleUI(service).run();
    }
}
