package com.learn.demo;

public interface PaymentGateway {
    /** @return true nếu thanh toán thành công */
    boolean charge(Long userId, long amount);
}
