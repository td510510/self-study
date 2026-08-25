package com.learn.playground.m12jpa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "articles")
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false)
    private long viewCount = 0;

    /**
     * ⚠ @ManyToOne mặc định là EAGER — LUÔN phải đổi thành LAZY.
     * Nhưng LAZY không tự chữa N+1: nếu vòng lặp chạm vào article.getAuthor().getName()
     * thì mỗi bài lại sinh thêm 1 câu SELECT. Xem M12Controller để đếm tận mắt.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private Author author;

    protected Article() { }

    public Article(String title) { this.title = title; }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public long getViewCount() { return viewCount; }
    public Author getAuthor() { return author; }
    public void setAuthor(Author author) { this.author = author; }
}
