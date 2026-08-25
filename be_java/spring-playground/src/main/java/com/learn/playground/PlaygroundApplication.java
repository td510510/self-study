package com.learn.playground;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.cache.annotation.EnableCaching;
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
@EnableAsync
@EnableScheduling
public class PlaygroundApplication {

    public static void main(String[] args) {
        SpringApplication.run(PlaygroundApplication.class, args);
    }
}
