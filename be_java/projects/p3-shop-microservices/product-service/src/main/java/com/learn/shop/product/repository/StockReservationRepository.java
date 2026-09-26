package com.learn.shop.product.repository;

import com.learn.shop.product.domain.StockReservation;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;

public interface StockReservationRepository extends JpaRepository<StockReservation, Long> {

    List<StockReservation> findByOrderIdOrderByProductId(Long orderId);

    /**
     * SELECT ... FOR UPDATE: khóa các dòng reservation của đơn hàng tới hết transaction.
     * Hai request release cùng orderId tới cùng lúc: request sau phải CHỜ, và khi được chạy thì
     * PostgreSQL đánh giá lại điều kiện status = RESERVED -> không còn dòng nào -> không hoàn kho lần hai.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<StockReservation> findByOrderIdAndStatus(Long orderId, StockReservation.Status status);
}
