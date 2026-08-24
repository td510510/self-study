package com.learn.library.service;

import com.learn.library.exception.BusinessRuleException;
import com.learn.library.exception.NotFoundException;
import com.learn.library.model.Book;
import com.learn.library.model.Loan;
import com.learn.library.model.Member;
import com.learn.library.repository.BookRepository;
import com.learn.library.repository.InMemoryBookRepository;
import com.learn.library.repository.InMemoryLoanRepository;
import com.learn.library.repository.InMemoryMemberRepository;
import com.learn.library.repository.LoanRepository;
import com.learn.library.repository.MemberRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Test nghiệp vụ thư viện.
 * Dùng repository in-memory thật (nhanh, không cần mock) — đây là "sociable unit test".
 * Xem thêm LibraryServiceMockTest để so sánh với cách dùng Mockito.
 */
@DisplayName("LibraryService")
class LibraryServiceTest {

    LibraryService service;
    LocalDate today;

    @BeforeEach
    void setUp() {
        BookRepository bookRepo = new InMemoryBookRepository();
        MemberRepository memberRepo = new InMemoryMemberRepository();
        LoanRepository loanRepo = new InMemoryLoanRepository();
        service = new LibraryService(bookRepo, memberRepo, loanRepo);
        today = LocalDate.of(2026, 8, 24);

        service.addBook(new Book("B1", "Clean Code", "Martin", "Lập trình", 2));
        service.addBook(new Book("B2", "Effective Java", "Bloch", "Lập trình", 1));
        service.addBook(new Book("B3", "Sapiens", "Harari", "Lịch sử", 1));
        service.addBook(new Book("B4", "Nhà Giả Kim", "Coelho", "Văn học", 1));
        service.addMember(new Member("M1", "An", "an@example.com", "0900000001", today));
        service.addMember(new Member("M2", "Bình", "binh@example.com", "0900000002", today));
    }

    @Nested
    @DisplayName("Thêm sách")
    class AddBook {

        @Test
        void isbnTrung_bịTuChoi() {
            assertThatThrownBy(() -> service.addBook(new Book("B1", "Khác", "X", "Y", 1)))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("đã tồn tại");
        }

        @Test
        void soBanKhongHopLe_bịTuChoi() {
            assertThatThrownBy(() -> new Book("B9", "Sách", "A", "B", 0))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Mượn sách")
    class Borrow {

        @Test
        @DisplayName("hợp lệ -> tạo lượt mượn, giảm số bản, hạn trả sau 14 ngày")
        void thanhCong() {
            Loan loan = service.borrowBook("M1", "B1", today);

            assertThat(loan.getMemberCode()).isEqualTo("M1");
            assertThat(loan.getDueDate()).isEqualTo(today.plusDays(Loan.LOAN_DAYS));
            assertThat(loan.isReturned()).isFalse();
            assertThat(service.getBook("B1").getAvailableCopies()).isEqualTo(1);
        }

        @Test
        @DisplayName("sách hết bản -> từ chối")
        void hetBan() {
            service.borrowBook("M1", "B2", today);      // B2 chỉ có 1 bản

            assertThatThrownBy(() -> service.borrowBook("M2", "B2", today))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("hết bản");
        }

        @Test
        @DisplayName("vượt hạn mức 3 cuốn -> từ chối")
        void vuotHanMuc() {
            service.borrowBook("M1", "B1", today);
            service.borrowBook("M1", "B2", today);
            service.borrowBook("M1", "B3", today);

            assertThatThrownBy(() -> service.borrowBook("M1", "B4", today))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("tối đa");
        }

        @Test
        @DisplayName("đang giữ đúng cuốn đó -> từ chối")
        void mượnTrungCuon() {
            service.borrowBook("M1", "B1", today);

            assertThatThrownBy(() -> service.borrowBook("M1", "B1", today))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("đang giữ cuốn này");
        }

        @Test
        @DisplayName("có sách quá hạn -> không được mượn thêm")
        void coSachQuaHan() {
            service.borrowBook("M1", "B1", today.minusDays(20));   // đã quá hạn 6 ngày

            assertThatThrownBy(() -> service.borrowBook("M1", "B2", today))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("quá hạn");
        }

        @Test
        @DisplayName("thành viên bị khóa -> từ chối")
        void thanhVienBiKhoa() {
            service.getMember("M1").suspend();

            assertThatThrownBy(() -> service.borrowBook("M1", "B1", today))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("bị khóa");
        }

        @Test
        void thanhVienKhongTonTai() {
            assertThatThrownBy(() -> service.borrowBook("KHONG_CO", "B1", today))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        void sachKhongTonTai() {
            assertThatThrownBy(() -> service.borrowBook("M1", "KHONG_CO", today))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Trả sách")
    class Return {

        @Test
        @DisplayName("đúng hạn -> không mất phí, số bản được hoàn lại")
        void dungHan() {
            Loan loan = service.borrowBook("M1", "B1", today);

            long fee = service.returnBook(loan.getId(), today.plusDays(10));

            assertThat(fee).isZero();
            assertThat(service.getBook("B1").getAvailableCopies()).isEqualTo(2);
            assertThat(service.activeLoansOf("M1")).isEmpty();
        }

        @Test
        @DisplayName("trả trễ 5 ngày -> phí 25.000đ")
        void traTre() {
            Loan loan = service.borrowBook("M1", "B1", today);

            long fee = service.returnBook(loan.getId(), today.plusDays(19));   // hạn 14 ngày

            assertThat(fee).isEqualTo(5 * Loan.FEE_PER_LATE_DAY);
            assertThat(service.totalFeeCollected()).isEqualTo(25_000L);
        }

        @Test
        @DisplayName("đúng ngày hạn -> vẫn không tính phí (ranh giới)")
        void dungNgayHan() {
            Loan loan = service.borrowBook("M1", "B1", today);

            long fee = service.returnBook(loan.getId(), today.plusDays(Loan.LOAN_DAYS));

            assertThat(fee).isZero();
        }

        @Test
        void traHaiLan_bịTuChoi() {
            Loan loan = service.borrowBook("M1", "B1", today);
            service.returnBook(loan.getId(), today.plusDays(1));

            assertThatThrownBy(() -> service.returnBook(loan.getId(), today.plusDays(2)))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("đã được trả");
        }

        @Test
        void luotMuonKhongTonTai() {
            assertThatThrownBy(() -> service.returnBook("KHONG_CO", today))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Xóa sách")
    class Delete {

        @Test
        void sachDangDuocMuon_khongXoaDuoc() {
            service.borrowBook("M1", "B1", today);

            assertThatThrownBy(() -> service.removeBook("B1"))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("đang có người mượn");
        }

        @Test
        void sachRanh_xoaDuoc() {
            service.removeBook("B4");

            assertThat(service.allBooks()).hasSize(3);
        }
    }

    @Nested
    @DisplayName("Thống kê")
    class Stats {

        @Test
        void quaHan_dungDanhSach() {
            service.borrowBook("M1", "B1", today.minusDays(20));   // quá hạn
            service.borrowBook("M2", "B2", today.minusDays(2));    // chưa quá hạn

            assertThat(service.overdueLoans(today))
                    .hasSize(1)
                    .allSatisfy(l -> assertThat(l.getMemberCode()).isEqualTo("M1"));
        }

        @Test
        void topSachMuonNhieu() {
            service.borrowBook("M1", "B1", today);
            service.returnBook("L0001", today.plusDays(1));
            service.borrowBook("M2", "B1", today.plusDays(2));
            service.borrowBook("M1", "B2", today.plusDays(2));

            assertThat(service.topBorrowedBooks(2))
                    .containsEntry("Clean Code", 2L)
                    .containsEntry("Effective Java", 1L);
        }

        @Test
        void sachTheoTheLoai() {
            assertThat(service.booksByCategory())
                    .containsEntry("Lập trình", 2L)
                    .containsEntry("Lịch sử", 1L)
                    .containsEntry("Văn học", 1L);
        }

        @Test
        void sachSapHet() {
            service.borrowBook("M1", "B2", today);      // B2 còn 0

            assertThat(service.lowStockBooks(0))
                    .extracting(Book::getIsbn)
                    .containsExactly("B2");
        }
    }
}
