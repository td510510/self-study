package com.learn.playground.m10core;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;

/**
 * Spring tự dựng Map<tênBean, PaymentGateway> rồi tiêm vào đây.
 * Đây chính là đoạn code bạn viết TAY ở Module 02 (PaymentDemo) — giờ framework làm hộ.
 *
 * Thêm cổng thanh toán mới = thêm 1 class có @Component("TÊN"), class này KHÔNG đổi.
 */
@Service
public class PaymentService {

    private final Map<String, PaymentGateway> gateways;

    public PaymentService(Map<String, PaymentGateway> gateways) {
        this.gateways = gateways;
    }

    public String pay(String type, String orderId, long amount) {
        PaymentGateway gateway = gateways.get(type);
        if (gateway == null) {
            throw new IllegalArgumentException(
                    "Không hỗ trợ cổng '%s'. Đang có: %s".formatted(type, gateways.keySet()));
        }
        return gateway.pay(orderId, amount);
    }

    public Set<String> supported() { return gateways.keySet(); }
}
