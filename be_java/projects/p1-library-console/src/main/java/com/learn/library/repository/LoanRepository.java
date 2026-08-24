package com.learn.library.repository;

import com.learn.library.model.Loan;
import java.time.LocalDate;
import java.util.List;

public interface LoanRepository extends Repository<Loan, String> {
    List<Loan> findActiveByMember(String memberCode);
    List<Loan> findActiveByIsbn(String isbn);
    List<Loan> findOverdue(LocalDate today);
    String nextId();
}
