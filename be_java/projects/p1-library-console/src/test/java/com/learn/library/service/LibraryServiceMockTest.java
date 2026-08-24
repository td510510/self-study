package com.learn.library.service;

import com.learn.library.exception.BusinessRuleException;
import com.learn.library.model.Book;
import com.learn.library.model.Loan;
import com.learn.library.model.Member;
import com.learn.library.repository.BookRepository;
import com.learn.library.repository.LoanRepository;
import com.learn.library.repository.MemberRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Cùng nghiệp vụ, nhưng test bằng Mockito: cô lập hoàn toàn LibraryService khỏi repository.
 * Ưu điểm: kiểm chứng được service GỌI GÌ xuống repository.
 * Nhược điểm: dài dòng hơn, dễ vỡ khi refactor.
 * Thực tế nên dùng cả hai kiểu, tuỳ chỗ.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LibraryService — kiểu test với mock")
class LibraryServiceMockTest {

    @Mock BookRepository bookRepo;
    @Mock MemberRepository memberRepo;
    @Mock LoanRepository loanRepo;
    @InjectMocks LibraryService service;

    final LocalDate today = LocalDate.of(2026, 8, 24);

    @Test
    @DisplayName("mượn hợp lệ -> lưu sách đã giảm bản và lưu lượt mượn mới")
    void borrow_hopLe() {
        Member member = new Member("M1", "An", "an@example.com", null, today);
        Book book = new Book("B1", "Clean Code", "Martin", "Lập trình", 2);

        given(memberRepo.findById("M1")).willReturn(Optional.of(member));
        given(bookRepo.findById("B1")).willReturn(Optional.of(book));
        given(loanRepo.findActiveByMember("M1")).willReturn(List.of());
        given(loanRepo.nextId()).willReturn("L0001");
        given(loanRepo.save(any(Loan.class))).willAnswer(inv -> inv.getArgument(0));

        Loan loan = service.borrowBook("M1", "B1", today);

        assertThat(loan.getId()).isEqualTo("L0001");

        ArgumentCaptor<Book> bookCaptor = ArgumentCaptor.forClass(Book.class);
        verify(bookRepo).save(bookCaptor.capture());
        assertThat(bookCaptor.getValue().getAvailableCopies()).isEqualTo(1);

        verify(loanRepo).save(any(Loan.class));
    }

    @Test
    @DisplayName("sách hết bản -> KHÔNG tạo lượt mượn nào")
    void borrow_hetBan_khongLuu() {
        Member member = new Member("M1", "An", null, null, today);
        Book book = new Book("B1", "Clean Code", "Martin", "Lập trình", 1);
        book.borrowOne();                                  // đưa về 0 bản

        given(memberRepo.findById("M1")).willReturn(Optional.of(member));
        given(bookRepo.findById("B1")).willReturn(Optional.of(book));

        assertThatThrownBy(() -> service.borrowBook("M1", "B1", today))
                .isInstanceOf(BusinessRuleException.class);

        verify(loanRepo, never()).save(any());
        verify(bookRepo, never()).save(any());
    }

    @Test
    @DisplayName("thêm thành viên trùng email -> từ chối trước khi lưu")
    void addMember_trungEmail() {
        Member existing = new Member("M0", "Cũ", "a@example.com", null, today);
        given(memberRepo.findById("M1")).willReturn(Optional.empty());
        given(memberRepo.findByEmail("a@example.com")).willReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.addMember(new Member("M1", "Mới", "a@example.com", null, today)))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Email đã được dùng");

        verify(memberRepo, never()).save(any());
    }

    @Test
    @DisplayName("xóa sách đang được mượn -> không gọi deleteById")
    void removeBook_dangMuon() {
        Book book = new Book("B1", "Clean Code", "Martin", "Lập trình", 1);
        given(bookRepo.findById("B1")).willReturn(Optional.of(book));
        given(loanRepo.findActiveByIsbn("B1"))
                .willReturn(List.of(new Loan("L1", "B1", "M1", today)));

        assertThatThrownBy(() -> service.removeBook("B1"))
                .isInstanceOf(BusinessRuleException.class);

        verify(bookRepo, never()).deleteById(anyString());
    }
}
