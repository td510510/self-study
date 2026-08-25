package com.learn.playground.m12jpa;

import com.learn.playground.m12jpa.Repositories.AuthorRepository;
import com.learn.playground.m12jpa.Repositories.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Nạp dữ liệu mẫu lúc khởi động.
 *
 * CommandLineRunner chạy SAU KHI context sẵn sàng — đây là chỗ đúng để nạp dữ liệu demo,
 * khác với @PostConstruct (chạy sớm hơn, lúc bean vừa được tạo).
 */
@Component
public class SampleDataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SampleDataLoader.class);

    private final AuthorRepository authorRepository;
    private final ProductRepository productRepository;

    public SampleDataLoader(AuthorRepository authorRepository, ProductRepository productRepository) {
        this.authorRepository = authorRepository;
        this.productRepository = productRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (authorRepository.count() > 0) return;

        String[][] duLieu = {
                {"Nguyễn Văn An", "Học Java từ đâu", "Hiểu về N+1 trong JPA", "Spring Security và JWT"},
                {"Trần Thị Bình", "Docker cho người mới", "CI/CD với GitHub Actions"},
                {"Lê Văn Cường", "Tối ưu truy vấn PostgreSQL", "Redis dùng vào việc gì",
                 "Kafka hay RabbitMQ", "Đọc heap dump khi OOM"}
        };

        for (String[] dong : duLieu) {
            Author author = new Author(dong[0]);
            for (int i = 1; i < dong.length; i++) {
                author.addArticle(new Article(dong[i]));
            }
            authorRepository.save(author);          // cascade = ALL nên bài viết được lưu theo
        }

        productRepository.save(new Product("Laptop Demo", 10));

        log.info("Đã nạp {} tác giả và {} sản phẩm mẫu",
                authorRepository.count(), productRepository.count());
        log.info("Mở http://localhost:8080/ để xem danh sách endpoint demo");
    }
}
