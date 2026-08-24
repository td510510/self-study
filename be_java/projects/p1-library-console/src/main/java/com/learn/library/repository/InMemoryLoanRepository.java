package com.learn.library.repository;

import com.learn.library.model.Loan;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicInteger;

public class InMemoryLoanRepository implements LoanRepository {

    private final Map<String, Loan> data = new LinkedHashMap<>();
    private final AtomicInteger sequence = new AtomicInteger(0);

    @Override public Loan save(Loan loan) { data.put(loan.getId(), loan); return loan; }

    @Override public Optional<Loan> findById(String id) { return Optional.ofNullable(data.get(id)); }

    @Override public List<Loan> findAll() { return new ArrayList<>(data.values()); }

    @Override public boolean deleteById(String id) { return data.remove(id) != null; }

    @Override public long count() { return data.size(); }

    @Override public List<Loan> findActiveByMember(String memberCode) {
        return data.values().stream()
                .filter(l -> !l.isReturned() && l.getMemberCode().equals(memberCode))
                .toList();
    }

    @Override public List<Loan> findActiveByIsbn(String isbn) {
        return data.values().stream()
                .filter(l -> !l.isReturned() && l.getIsbn().equals(isbn))
                .toList();
    }

    @Override public List<Loan> findOverdue(LocalDate today) {
        return data.values().stream().filter(l -> l.isOverdue(today)).toList();
    }

    @Override public String nextId() {
        return "L%04d".formatted(sequence.incrementAndGet());
    }
}
