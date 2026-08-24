package com.learn.blog.repository;

import com.learn.blog.domain.Post;
import com.learn.blog.domain.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    boolean existsBySlug(String slug);

    /**
     * Lấy chi tiết bài viết KÈM tác giả và tag trong 1 query.
     * Không có JOIN FETCH ở đây thì mỗi lần đọc author/tags sẽ thêm 1 query (N+1).
     */
    @Query("""
           SELECT p FROM Post p
           JOIN FETCH p.author
           LEFT JOIN FETCH p.tags
           WHERE p.slug = :slug
           """)
    Optional<Post> findBySlugWithDetails(@Param("slug") String slug);

    @Query("SELECT p FROM Post p JOIN FETCH p.author WHERE p.id = :id")
    Optional<Post> findByIdWithAuthor(@Param("id") Long id);

    /**
     * Danh sách bài viết có phân trang.
     *
     * Dùng @EntityGraph thay vì JOIN FETCH: với Pageable, JOIN FETCH trên collection
     * sẽ khiến Hibernate phân trang trong bộ nhớ (cảnh báo HHH90003004).
     * @EntityGraph chỉ nạp thêm quan hệ @ManyToOne nên vẫn phân trang ở DB được.
     */
    @EntityGraph(attributePaths = {"author"})
    Page<Post> findByStatus(PostStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"author"})
    @Query("""
           SELECT p FROM Post p
           WHERE p.status = :status
             AND (:keyword IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                   OR LOWER(p.summary) LIKE LOWER(CONCAT('%', :keyword, '%')))
             AND (:tag IS NULL OR EXISTS (SELECT 1 FROM p.tags t WHERE t.name = :tag))
           """)
    Page<Post> search(@Param("status") PostStatus status,
                      @Param("keyword") String keyword,
                      @Param("tag") String tag,
                      Pageable pageable);

    @EntityGraph(attributePaths = {"author"})
    Page<Post> findByAuthorId(Long authorId, Pageable pageable);

    /**
     * Tăng lượt xem bằng UPDATE nguyên tử ở DB.
     * Nếu đọc entity -> +1 -> lưu, hai request đồng thời sẽ ghi đè nhau (Module 06).
     */
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    void increaseViewCount(@Param("id") Long id);

    /** Thống kê: top bài viết nhiều lượt xem. */
    @EntityGraph(attributePaths = {"author"})
    List<Post> findTop5ByStatusOrderByViewCountDesc(PostStatus status);

    @Query("SELECT COUNT(p) FROM Post p WHERE p.author.id = :authorId AND p.status = :status")
    long countByAuthorAndStatus(@Param("authorId") Long authorId, @Param("status") PostStatus status);
}
