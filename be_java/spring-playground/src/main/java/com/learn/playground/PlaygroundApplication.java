package com.learn.playground;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Sân tập Spring cho Module 10–14.
 *
 * Chạy:  mvn spring-boot:run
 * Rồi mở http://localhost:8080/ để xem danh sách endpoint demo.
 */
@SpringBootApplication
@ConfigurationPropertiesScan          // Module 10: quét @ConfigurationProperties
@EnableCaching                        // Module 14
// Các repository của Module 12 là interface LỒNG trong class Repositories cho gọn khi học.
// Mặc định Spring Data bỏ qua interface lồng -> phải bật considerNestedRepositories.
@EnableJpaRepositories(considerNestedRepositories = true)
@EnableAsync
@EnableScheduling
public class PlaygroundApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlaygroundApplication.class, args);
    }
}
