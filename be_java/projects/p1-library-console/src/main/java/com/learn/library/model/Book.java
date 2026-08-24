package com.learn.library.model;

import java.util.Objects;

/** Sách trong thư viện. Mutable vì số bản sẵn có thay đổi theo lượt mượn/trả. */
public class Book {

    private final String isbn;
    private String title;
    private String author;
    private String category;
    private int totalCopies;
    private int availableCopies;

    public Book(String isbn, String title, String author, String category, int totalCopies) {
        if (isbn == null || isbn.isBlank()) throw new IllegalArgumentException("ISBN không được rỗng");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("Tên sách không được rỗng");
        if (totalCopies <= 0) throw new IllegalArgumentException("Số bản phải > 0");
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        this.category = category;
        this.totalCopies = totalCopies;
        this.availableCopies = totalCopies;
    }

    public boolean isAvailable() { return availableCopies > 0; }

    /** Chỉ LoanService (qua BookService) được phép đổi số bản — nên để package-private. */
    public void borrowOne() {
        if (!isAvailable()) throw new IllegalStateException("Hết bản sẵn có: " + title);
        availableCopies--;
    }

    public void returnOne() {
        if (availableCopies >= totalCopies) throw new IllegalStateException("Trả vượt số bản đã có: " + title);
        availableCopies++;
    }

    public String getIsbn() { return isbn; }
    public String getTitle() { return title; }
    public String getAuthor() { return author; }
    public String getCategory() { return category; }
    public int getTotalCopies() { return totalCopies; }
    public int getAvailableCopies() { return availableCopies; }

    public void setTitle(String title) { this.title = title; }
    public void setAuthor(String author) { this.author = author; }
    public void setCategory(String category) { this.category = category; }

    public void setTotalCopies(int totalCopies) {
        int borrowed = this.totalCopies - this.availableCopies;
        if (totalCopies < borrowed) {
            throw new IllegalArgumentException("Không thể giảm dưới số bản đang được mượn: " + borrowed);
        }
        this.totalCopies = totalCopies;
        this.availableCopies = totalCopies - borrowed;
    }

    /** Sách được định danh bằng ISBN -> equals/hashCode chỉ dựa trên ISBN. */
    @Override public boolean equals(Object o) {
        return o instanceof Book b && isbn.equals(b.isbn);
    }
    @Override public int hashCode() { return Objects.hash(isbn); }

    @Override public String toString() {
        return "%-14s | %-36s | %-18s | %-11s | %d/%d".formatted(
                isbn, title, author == null ? "-" : author,
                category == null ? "-" : category, availableCopies, totalCopies);
    }
}
