package com.learn.library.service;

import com.learn.library.exception.BusinessRuleException;
import com.learn.library.exception.NotFoundException;
import com.learn.library.model.Book;
import com.learn.library.model.Loan;
import com.learn.library.model.Member;
import com.learn.library.repository.BookRepository;
import com.learn.library.repository.LoanRepository;
import com.learn.library.repository.MemberRepository;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Toàn bộ nghiệp vụ của thư viện.
 *
 * Ba phụ thuộc đều là INTERFACE và được tiêm qua constructor:
 *   - đổi cách lưu trữ không cần sửa class này
 *   - test được bằng mock (xem LibraryServiceTest)
 * Đây chính là mô hình bạn sẽ viết trong Spring, chỉ khác là Spring tự tiêm hộ.
 */
public class LibraryService {

    /** Quy tắc nghiệp vụ: mỗi thành viên giữ tối đa 3 cuốn cùng lúc. */
    public static final int MAX_BOOKS_PER_MEMBER = 3;

    private final BookRepository bookRepo;
    private final MemberRepository memberRepo;
    private final LoanRepository loanRepo;

    public LibraryService(BookRepository bookRepo, MemberRepository memberRepo, LoanRepository loanRepo) {
        this.bookRepo = bookRepo;
        this.memberRepo = memberRepo;
        this.loanRepo = loanRepo;
    }

    // ------------------------------------------------------------- Sách
    public Book addBook(Book book) {
        bookRepo.findById(book.getIsbn()).ifPresent(b -> {
            throw new BusinessRuleException("ISBN đã tồn tại: " + book.getIsbn());
        });
        return bookRepo.save(book);
    }

    public Book getBook(String isbn) {
        return bookRepo.findById(isbn).orElseThrow(() -> new NotFoundException("sách", isbn));
    }

    public List<Book> searchBooks(String keyword) { return bookRepo.searchByTitle(keyword); }

    public List<Book> allBooks() { return bookRepo.findAll(); }

    public List<Book> availableBooks() { return bookRepo.findAvailable(); }

    public void removeBook(String isbn) {
        getBook(isbn);
        if (!loanRepo.findActiveByIsbn(isbn).isEmpty()) {
            throw new BusinessRuleException("Không thể xóa: sách đang có người mượn");
        }
        bookRepo.deleteById(isbn);
    }

    // -------------------------------------------------------- Thành viên
    public Member addMember(Member member) {
        memberRepo.findById(member.getCode()).ifPresent(m -> {
            throw new BusinessRuleException("Mã thành viên đã tồn tại: " + member.getCode());
        });
        if (member.getEmail() != null) {
            memberRepo.findByEmail(member.getEmail()).ifPresent(m -> {
                throw new BusinessRuleException("Email đã được dùng: " + member.getEmail());
            });
        }
        return memberRepo.save(member);
    }

    public Member getMember(String code) {
        return memberRepo.findById(code).orElseThrow(() -> new NotFoundException("thành viên", code));
    }

    public List<Member> allMembers() { return memberRepo.findAll(); }

    // ------------------------------------------------------- Mượn / trả
    /**
     * Mượn sách. Các quy tắc kiểm tra theo thứ tự:
     *   1. Thành viên tồn tại và đang hoạt động
     *   2. Sách tồn tại và còn bản sẵn có
     *   3. Thành viên chưa mượn quá hạn mức
     *   4. Thành viên không đang giữ đúng cuốn này
     *   5. Thành viên không có sách quá hạn
     */
    public Loan borrowBook(String memberCode, String isbn, LocalDate today) {
        Member member = getMember(memberCode);
        if (!member.isActive()) {
            throw new BusinessRuleException("Thành viên đang bị khóa: " + memberCode);
        }

        Book book = getBook(isbn);
        if (!book.isAvailable()) {
            throw new BusinessRuleException("Sách đã hết bản sẵn có: " + book.getTitle());
        }

        List<Loan> active = loanRepo.findActiveByMember(memberCode);
        if (active.size() >= MAX_BOOKS_PER_MEMBER) {
            throw new BusinessRuleException(
                    "Đã mượn tối đa " + MAX_BOOKS_PER_MEMBER + " cuốn, phải trả bớt trước");
        }
        if (active.stream().anyMatch(l -> l.getIsbn().equals(isbn))) {
            throw new BusinessRuleException("Thành viên đang giữ cuốn này rồi: " + book.getTitle());
        }
        if (active.stream().anyMatch(l -> l.isOverdue(today))) {
            throw new BusinessRuleException("Có sách quá hạn chưa trả, không thể mượn thêm");
        }

        book.borrowOne();
        bookRepo.save(book);

        Loan loan = new Loan(loanRepo.nextId(), isbn, memberCode, today);
        return loanRepo.save(loan);
    }

    /** Trả sách, trả về số tiền phạt (0 nếu đúng hạn). */
    public long returnBook(String loanId, LocalDate returnDate) {
        Loan loan = loanRepo.findById(loanId)
                .orElseThrow(() -> new NotFoundException("lượt mượn", loanId));
        if (loan.isReturned()) {
            throw new BusinessRuleException("Lượt mượn này đã được trả: " + loanId);
        }

        long fee = loan.markReturned(returnDate);
        loanRepo.save(loan);

        Book book = getBook(loan.getIsbn());
        book.returnOne();
        bookRepo.save(book);

        return fee;
    }

    public List<Loan> activeLoansOf(String memberCode) {
        getMember(memberCode);
        return loanRepo.findActiveByMember(memberCode);
    }

    public List<Loan> overdueLoans(LocalDate today) { return loanRepo.findOverdue(today); }

    public List<Loan> allLoans() { return loanRepo.findAll(); }

    // ---------------------------------------------------------- Thống kê
    /** Top sách được mượn nhiều nhất. */
    public Map<String, Long> topBorrowedBooks(int limit) {
        return loanRepo.findAll().stream()
                .collect(Collectors.groupingBy(Loan::getIsbn, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .collect(Collectors.toMap(
                        e -> bookRepo.findById(e.getKey()).map(Book::getTitle).orElse(e.getKey()),
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new));
    }

    public long totalFeeCollected() {
        return loanRepo.findAll().stream().mapToLong(Loan::getFee).sum();
    }

    public Map<String, Long> booksByCategory() {
        return bookRepo.findAll().stream()
                .collect(Collectors.groupingBy(
                        b -> b.getCategory() == null ? "(chưa phân loại)" : b.getCategory(),
                        java.util.TreeMap::new,
                        Collectors.counting()));
    }

    public List<Member> membersWithMostLoans(int limit) {
        Map<String, Long> counts = loanRepo.findAll().stream()
                .collect(Collectors.groupingBy(Loan::getMemberCode, Collectors.counting()));
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(e -> memberRepo.findById(e.getKey()).orElse(null))
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    public List<Book> lowStockBooks(int threshold) {
        return bookRepo.findAll().stream()
                .filter(b -> b.getAvailableCopies() <= threshold)
                .sorted(Comparator.comparingInt(Book::getAvailableCopies))
                .toList();
    }
}
