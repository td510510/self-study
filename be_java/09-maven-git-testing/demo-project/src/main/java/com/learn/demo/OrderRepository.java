package com.learn.demo;

import java.util.List;
import java.util.Optional;

/** Interface -> cho phép thay bằng mock khi test (đây là lý do phải tiêm phụ thuộc). */
public interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(Long id);
    List<Order> findByUserId(Long userId);
}
