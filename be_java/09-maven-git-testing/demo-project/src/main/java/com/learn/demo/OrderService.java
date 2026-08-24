package com.learn.demo;

import java.util.Optional;

/** Nghiệp vụ đặt hàng. Mọi phụ thuộc đều nhận qua constructor -> test được. */
public class OrderService {

    private static final long MAX_AMOUNT = 50_000_000L;

    private final OrderRepository repository;
    private final PaymentGateway paymentGateway;

    public OrderService(OrderRepository repository, PaymentGateway paymentGateway) {
        this.repository = repository;
        this.paymentGateway = paymentGateway;
    }

    public Order placeOrder(Long userId, long amount) {
        if (amount > MAX_AMOUNT) {
            throw new IllegalArgumentException("Đơn hàng vượt hạn mức " + MAX_AMOUNT);
        }
        Order order = new Order(userId, amount);

        if (!paymentGateway.charge(userId, amount)) {
            throw new PaymentFailedException("Thanh toán thất bại cho user " + userId);
        }
        order.markPaid();
        return repository.save(order);
    }

    public Order cancelOrder(Long orderId) {
        Order order = repository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn " + orderId));
        order.cancel();
        return repository.save(order);
    }

    public long totalSpent(Long userId) {
        return repository.findByUserId(userId).stream()
                .filter(o -> o.getStatus() == Order.Status.PAID)
                .mapToLong(Order::getAmount)
                .sum();
    }

    public Optional<Order> find(Long id) { return repository.findById(id); }
}
