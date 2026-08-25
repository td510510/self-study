package com.learn.playground.m10core;

import org.springframework.stereotype.Component;

/**
 * Module 10 — nhiều bean cùng một kiểu.
 *
 * Tên bean (giá trị trong @Component) chính là KEY khi Spring tiêm vào Map<String, PaymentGateway>.
 * Nhờ vậy: thêm cổng thanh toán mới = thêm 1 class, KHÔNG sửa PaymentService (nguyên tắc Open/Closed).
 */
public interface PaymentGateway {

    String pay(String orderId, long amount);

    @Component("MOMO")
    class MomoGateway implements PaymentGateway {
        @Override public String pay(String orderId, long amount) {
            return "[Momo] thanh toán %,dđ cho đơn %s".formatted(amount, orderId);
        }
    }

    @Component("VNPAY")
    class VnPayGateway implements PaymentGateway {
        @Override public String pay(String orderId, long amount) {
            return "[VNPay] thanh toán %,dđ cho đơn %s".formatted(amount, orderId);
        }
    }

    @Component("ZALOPAY")
    class ZaloPayGateway implements PaymentGateway {
        @Override public String pay(String orderId, long amount) {
            return "[ZaloPay] thanh toán %,dđ cho đơn %s".formatted(amount, orderId);
        }
    }
}
