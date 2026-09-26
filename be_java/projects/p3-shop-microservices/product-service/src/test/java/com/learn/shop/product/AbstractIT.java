package com.learn.shop.product;

import com.learn.shop.product.domain.Product;
import com.learn.shop.product.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.UUID;

/**
 * Integration test chạy trên PostgreSQL và Redis THẬT (Docker), không dùng H2 hay cache giả:
 *  - UPDATE nguyên tử, SELECT FOR UPDATE, ràng buộc UNIQUE phải được kiểm chứng trên đúng DB production dùng.
 *  - Cache Redis phải kiểm chứng serialize/deserialize thật (lỗi "not Serializable" chỉ lộ ra ở đây).
 *
 * Mỗi test tự tạo sản phẩm riêng (SKU ngẫu nhiên) nên các test không giẫm tồn kho của nhau.
 *
 * "Singleton container": khởi động MỘT lần trong static block, dùng chung cho mọi lớp test.
 * ⚠ Không dùng @Testcontainers + @Container ở lớp cha: JUnit sẽ dừng container sau lớp test đầu tiên,
 *   trong khi Spring vẫn cache ApplicationContext trỏ tới cổng cũ -> lớp test thứ hai lỗi kết nối.
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class AbstractIT {

    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @ServiceConnection(name = "redis")
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

    static {
        POSTGRES.start();
        REDIS.start();
    }

    @Autowired
    protected ProductRepository productRepository;

    protected Product newProduct(long price, int stock) {
        String sku = "T-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return productRepository.save(new Product(sku, "Sản phẩm " + sku, "Test", price, stock));
    }

    protected int stockOf(Long productId) {
        return productRepository.findById(productId).orElseThrow().getStock();
    }
}
