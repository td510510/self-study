package com.learn.blog.repository;

import com.learn.blog.domain.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    /** Bình luận gốc của một bài (parent = null), kèm tác giả để tránh N+1. */
    @EntityGraph(attributePaths = {"author"})
    Page<Comment> findByPostIdAndParentIsNullOrderByCreatedAtDesc(Long postId, Pageable pageable);

    /** Tất cả trả lời của một tập bình luận — nạp 1 lần thay vì mỗi comment 1 query. */
    @EntityGraph(attributePaths = {"author"})
    @Query("SELECT c FROM Comment c WHERE c.parent.id IN :parentIds ORDER BY c.createdAt")
    List<Comment> findRepliesByParentIds(@Param("parentIds") List<Long> parentIds);

    @EntityGraph(attributePaths = {"author", "post"})
    Optional<Comment> findWithAuthorById(Long id);

    long countByPostId(Long postId);
}
