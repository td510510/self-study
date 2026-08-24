package com.learn.blog;

import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Lớp cha cho integration test.
 *
 * Vì sao Testcontainers mà không phải H2?
 *   H2 hành xử khác PostgreSQL ở nhiều chỗ (kiểu TIMESTAMPTZ, ILIKE, RETURNING,
 *   ràng buộc, hàm chuỗi). Test xanh trên H2 mà vỡ trên production là chuyện thường.
 *   Testcontainers chạy PostgreSQL THẬT trong Docker, Flyway migrate y hệt production.
 *
 * Yêu cầu: Docker Desktop đang chạy.
 * Container được chia sẻ giữa các test class (static) để không phải khởi động lại nhiều lần.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
public abstract class AbstractIntegrationTest {

    @Container
    @ServiceConnection          // Spring Boot 3.1+: tự cấu hình datasource, không cần khai báo url/user/pass
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("blogdb_test")
                    .withReuse(true);

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("app.jwt.secret", () -> "chuoi-bi-mat-danh-rieng-cho-test-du-32-ky-tu");
        registry.add("app.cors.allowed-origins", () -> "http://localhost:3000");
    }
}
