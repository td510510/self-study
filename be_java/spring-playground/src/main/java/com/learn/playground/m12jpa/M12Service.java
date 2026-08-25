package com.learn.playground.m12jpa;

import com.learn.playground.m12jpa.Repositories.ArticleRepository;
import com.learn.playground.m12jpa.Repositories.AuthorRepository;
import com.learn.playground.m12jpa.Repositories.ProductRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.function.Supplier;

/** Module 12 — nghiệp vụ + công cụ ĐẾM SỐ CÂU SQL để chứng minh N+1 bằng số liệu. */
@Service
public class M12Service {

    private static final Logger log = LoggerFactory.getLogger(M12Service.class);

    private final AuthorRepository authorRepository;
    private final ArticleRepository articleRepository;
    private final ProductRepository productRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public M12Service(AuthorRepository authorRepository,
                      ArticleRepository articleRepository,
                      ProductRepository productRepository) {
        this.authorRepository = authorRepository;
        this.articleRepository = articleRepository;
        this.productRepository = productRepository;
    }

    /**
     * Đếm chính xác số câu SQL mà một đoạn code sinh ra.
     * Đây là công cụ bạn nên mang theo suốt sự nghiệp: đừng đoán, hãy ĐẾM.
     */
    public <T> QueryCount<T> countQueries(Supplier<T> action) {
        Statistics stats = entityManager.getEntityManagerFactory()
                .unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
        stats.clear();

        long start = System.nanoTime();
        T result = action.get();
        double ms = (System.nanoTime() - start) / 1e6;

        return new QueryCount<>(result, stats.getPrepareStatementCount(), ms);
    }

    public record QueryCount<T>(T result, long queryCount, double millis) { }

    // ---------------------------------------------------------- N+1
    /** ❌ Cách gây N+1: 1 query lấy danh sách + N query lấy tác giả. */
    @Transactional(readOnly = true)
    public List<String> listBad() {
        return articleRepository.findAllByOrderByIdAsc().stream()
                .map(a -> a.getTitle() + " — " + a.getAuthor().getName())   // chạm lazy -> +1 query MỖI bài
                .toList();
    }

    /** ✅ JOIN FETCH: đúng 1 query. */
    @Transactional(readOnly = true)
    public List<String> listJoinFetch() {
        return articleRepository.findAllWithAuthorJoinFetch().stream()
                .map(a -> a.getTitle() + " — " + a.getAuthor().getName())
                .toList();
    }

    /** ✅ @EntityGraph: cũng 1 query, khai báo gọn hơn. */
    @Transactional(readOnly = true)
    public List<String> listEntityGraph() {
        return articleRepository.findAllWithAuthorEntityGraph().stream()
                .map(a -> a.getTitle() + " — " + a.getAuthor().getName())
                .toList();
    }

    /** ✅ DTO projection: 1 query và chỉ lấy đúng 3 cột. */
    @Transactional(readOnly = true)
    public List<String> listProjection() {
        return articleRepository.findAllViews().stream()
                .map(v -> v.title() + " — " + v.authorName())
                .toList();
    }

    // ------------------------------------------------- Dirty checking
    /**
     * Sửa entity trong transaction mà KHÔNG gọi save().
     * Hibernate tự so sánh trạng thái và sinh UPDATE lúc commit.
     */
    @Transactional
    public String dirtyChecking(Long articleId) {
        Article article = articleRepository.findById(articleId).orElseThrow();
        String cu = article.getTitle();
        article.setTitle(cu + " (đã sửa lúc " + System.currentTimeMillis() % 100000 + ")");
        // Không có repository.save(article) ở đây — vẫn được ghi xuống DB.
        return "Tiêu đề cũ: '%s' -> mới: '%s'. Không hề gọi save()."
                .formatted(cu, article.getTitle());
    }

    // ------------------------------------------------------ Rollback
    /** Ném RuntimeException giữa chừng -> toàn bộ thay đổi bị hủy. */
    @Transactional
    public void rollbackDemo(Long authorId) {
        Author author = authorRepository.findById(authorId).orElseThrow();
        author.setName("TÊN NÀY SẼ BỊ HỦY");
        author.addArticle(new Article("Bài viết cũng sẽ bị hủy"));
        authorRepository.save(author);

        log.info("[ROLLBACK] Đã sửa dữ liệu trong transaction, giờ ném exception...");
        throw new IllegalStateException("Lỗi giả lập giữa transaction");
    }

    @Transactional(readOnly = true)
    public String readAuthorName(Long authorId) {
        return authorRepository.findById(authorId).map(Author::getName).orElse("(không có)");
    }

    // ------------------------------------------------ Tồn kho an toàn
    /** ❌ Đọc - kiểm tra - ghi trong Java: nhiều thread sẽ bán quá số lượng. */
    @Transactional
    public boolean buyUnsafe(Long productId) {
        Product p = productRepository.findById(productId).orElseThrow();
        if (p.getStock() > 0) {
            p.setStock(p.getStock() - 1);      // hai thread cùng đọc stock=1 -> cùng bán được
            return true;
        }
        return false;
    }

    /** ✅ UPDATE nguyên tử ở DB: chỉ đúng số lượng tồn được bán. */
    @Transactional
    public boolean buySafe(Long productId) {
        return productRepository.decreaseStockAtomic(productId) == 1;
    }

    @Transactional
    public void resetStock(Long productId, int stock) {
        productRepository.findById(productId).ifPresent(p -> p.setStock(stock));
    }

    @Transactional(readOnly = true)
    public int currentStock(Long productId) {
        return productRepository.findById(productId).map(Product::getStock).orElse(-1);
    }

    @Transactional(readOnly = true)
    public Long anyArticleId() {
        return articleRepository.findAllByOrderByIdAsc().stream()
                .findFirst().map(Article::getId).orElse(null);
    }

    @Transactional(readOnly = true)
    public Long anyAuthorId() {
        return authorRepository.findAll().stream().findFirst().map(Author::getId).orElse(null);
    }
}
