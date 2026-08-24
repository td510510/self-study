package com.learn.demo;

/** Đơn hàng — model đơn giản để minh họa test. */
public class Order {

    public enum Status { PENDING, PAID, CANCELLED }

    private Long id;
    private final Long userId;
    private final long amount;
    private Status status = Status.PENDING;

    public Order(Long userId, long amount) {
        if (userId == null) throw new IllegalArgumentException("userId không được null");
        if (amount <= 0) throw new IllegalArgumentException("Số tiền phải > 0");
        this.userId = userId;
        this.amount = amount;
    }

    public void markPaid() {
        if (status != Status.PENDING) {
            throw new IllegalStateException("Chỉ đơn PENDING mới thanh toán được, hiện tại: " + status);
        }
        status = Status.PAID;
    }

    public void cancel() {
        if (status == Status.PAID) throw new IllegalStateException("Đơn đã thanh toán, không hủy được");
        status = Status.CANCELLED;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public long getAmount() { return amount; }
    public Status getStatus() { return status; }
}
