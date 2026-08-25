package com.learn.playground.m12jpa;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/** Module 12 — 3 repository, gom một file cho dễ đọc khi học. */
public final class Repositories {

    public interface AuthorRepository extends JpaRepository<Author, Long> { }

    public interface ArticleRepository extends JpaRepository<Article, Long> {

        /** ❌ Cách gây N+1: chỉ lấy article, chạm getAuthor() là thêm 1 query mỗi bài. */
        List<Article> findAllByOrderByIdAsc();

        /** ✅ Cách 1: JOIN FETCH — lấy article + author trong ĐÚNG 1 query. */
        @Query("SELECT a FROM Article a JOIN FETCH a.author ORDER BY a.id")
        List<Article> findAllWithAuthorJoinFetch();

        /** ✅ Cách 2: @EntityGraph — cùng kết quả, khai báo thay vì viết JPQL. */
        @EntityGraph(attributePaths = {"author"})
        @Query("SELECT a FROM Article a ORDER BY a.id")
        List<Article> findAllWithAuthorEntityGraph();

        /** ✅ Cách 3: DTO projection — nhẹ nhất khi chỉ cần đọc để hiển thị. */
        @Query("""
               SELECT new com.learn.playground.m12jpa.ArticleView(a.id, a.title, au.name)
               FROM Article a JOIN a.author au ORDER BY a.id
               """)
        List<ArticleView> findAllViews();
    }

    public interface ProductRepository extends JpaRepository<Product, Long> {

        Optional<Product> findByName(String name);

        /**
         * ✅ Trừ tồn kho NGUYÊN TỬ ngay tại DB.
         * Trả về 0 = không đủ hàng. Không bao giờ bán quá số lượng, kể cả 1000 request đồng thời.
         * clearAutomatically: xóa persistence context để lần đọc sau lấy dữ liệu mới.
         */
        @Modifying(clearAutomatically = true)
        @Query("UPDATE Product p SET p.stock = p.stock - 1 WHERE p.id = :id AND p.stock > 0")
        int decreaseStockAtomic(@Param("id") Long id);
    }

    private Repositories() { }
}
