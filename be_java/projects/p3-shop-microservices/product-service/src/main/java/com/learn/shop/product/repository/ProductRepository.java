package com.learn.shop.product.repository;

import com.learn.shop.product.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    /**
     * Trừ kho NGUYÊN TỬ. Kiểm tra và trừ nằm trong CÙNG MỘT câu lệnh, DB khóa dòng trong lúc chạy
     * -> 100 request đồng thời mua món cuối cùng thì đúng 1 request được 1 dòng, 99 request được 0 dòng.
     *
     * Trả về số dòng bị ảnh hưởng: 0 nghĩa là không đủ hàng (hoặc sản phẩm ngừng bán).
     * Tăng version để lần sửa của admin đang cầm bản cũ bị phát hiện (optimistic lock).
     *
     * clearAutomatically: sau câu UPDATE hàng loạt, các entity Product đang nằm trong persistence context
     * mang tồn kho CŨ -> xóa đi để lần đọc sau lấy số mới từ DB.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
           UPDATE Product p
           SET p.stock = p.stock - :qty, p.version = p.version + 1
           WHERE p.id = :id AND p.active = true AND p.stock >= :qty
           """)
    int decreaseStock(@Param("id") Long id, @Param("qty") int qty);

    /** Hoàn kho (bù trừ của saga). Không clear persistence context: release không nạp Product nào. */
    @Modifying(flushAutomatically = true)
    @Query("""
           UPDATE Product p
           SET p.stock = p.stock + :qty, p.version = p.version + 1
           WHERE p.id = :id
           """)
    int increaseStock(@Param("id") Long id, @Param("qty") int qty);
}
