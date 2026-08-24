package com.learn.blog.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * Bài viết.
 *
 * Điểm cần chú ý:
 *  - @ManyToOne author để LAZY (mặc định là EAGER — luôn phải đổi).
 *  - Trạng thái đổi qua method nghiệp vụ (publish/archive), không set trực tiếp từ ngoài.
 *  - @Version để khóa lạc quan khi 2 người cùng sửa một bài.
 */
@Entity
@Table(name = "posts")
@Getter @Setter
@NoArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String slug;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 500)
    private String summary;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PostStatus status = PostStatus.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "post_tags",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new HashSet<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> comments = new ArrayList<>();

    @Column(name = "view_count", nullable = false)
    private long viewCount = 0;

    @Column(name = "published_at")
    private Instant publishedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    @Version
    private Integer version;

    public Post(String slug, String title, String summary, String content, User author) {
        this.slug = slug;
        this.title = title;
        this.summary = summary;
        this.content = content;
        this.author = author;
    }

    // ------------------------------------------------- hành vi nghiệp vụ
    public void publish() {
        if (status == PostStatus.PUBLISHED) {
            throw new IllegalStateException("Bài viết đã được xuất bản");
        }
        this.status = PostStatus.PUBLISHED;
        this.publishedAt = Instant.now();
    }

    public void archive() {
        this.status = PostStatus.ARCHIVED;
    }

    public boolean isPublished() { return status == PostStatus.PUBLISHED; }

    public boolean isOwnedBy(Long userId) {
        return author != null && author.getId() != null && author.getId().equals(userId);
    }

    public void increaseView() { this.viewCount++; }

    public void addTag(Tag tag) { tags.add(tag); }

    public void replaceTags(Set<Tag> newTags) {
        tags.clear();
        tags.addAll(newTags);
    }

    /** Giữ hai chiều đồng bộ — luôn thêm comment qua method này. */
    public void addComment(Comment comment) {
        comments.add(comment);
        comment.setPost(this);
    }

    @Override public boolean equals(Object o) {
        return o instanceof Post p && slug != null && slug.equals(p.slug);
    }
    @Override public int hashCode() { return Objects.hashCode(slug); }
}
