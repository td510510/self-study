package com.learn.library.model;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/** Một lượt mượn sách. */
public class Loan {

    public static final int LOAN_DAYS = 14;
    public static final long FEE_PER_LATE_DAY = 5_000L;

    private final String id;
    private final String isbn;
    private final String memberCode;
    private final LocalDate borrowedAt;
    private final LocalDate dueDate;
    private LocalDate returnedAt;
    private long fee;

    public Loan(String id, String isbn, String memberCode, LocalDate borrowedAt) {
        this.id = Objects.requireNonNull(id, "id");
        this.isbn = Objects.requireNonNull(isbn, "isbn");
        this.memberCode = Objects.requireNonNull(memberCode, "memberCode");
        this.borrowedAt = borrowedAt == null ? LocalDate.now() : borrowedAt;
        this.dueDate = this.borrowedAt.plusDays(LOAN_DAYS);
    }

    public boolean isReturned() { return returnedAt != null; }

    public boolean isOverdue(LocalDate today) {
        return !isReturned() && today.isAfter(dueDate);
    }

    /** Số ngày trễ tính tới ngày trả (nếu đã trả) hoặc tới hôm nay. */
    public long lateDays(LocalDate today) {
        LocalDate mark = returnedAt != null ? returnedAt : today;
        return Math.max(0, ChronoUnit.DAYS.between(dueDate, mark));
    }

    /** Đánh dấu đã trả, tính phí trễ và trả về số tiền phạt. */
    public long markReturned(LocalDate returnDate) {
        if (isReturned()) throw new IllegalStateException("Lượt mượn " + id + " đã được trả rồi");
        LocalDate date = returnDate == null ? LocalDate.now() : returnDate;
        if (date.isBefore(borrowedAt)) {
            throw new IllegalArgumentException("Ngày trả không thể trước ngày mượn");
        }
        this.returnedAt = date;
        this.fee = lateDays(date) * FEE_PER_LATE_DAY;
        return this.fee;
    }

    public String getId() { return id; }
    public String getIsbn() { return isbn; }
    public String getMemberCode() { return memberCode; }
    public LocalDate getBorrowedAt() { return borrowedAt; }
    public LocalDate getDueDate() { return dueDate; }
    public LocalDate getReturnedAt() { return returnedAt; }
    public long getFee() { return fee; }

    @Override public boolean equals(Object o) { return o instanceof Loan l && id.equals(l.id); }
    @Override public int hashCode() { return Objects.hash(id); }

    @Override public String toString() {
        return "%-6s | %-14s | %-8s | %s -> %s | %-10s | %,8d".formatted(
                id, isbn, memberCode, borrowedAt, dueDate,
                returnedAt == null ? "chưa trả" : returnedAt.toString(), fee);
    }
}
