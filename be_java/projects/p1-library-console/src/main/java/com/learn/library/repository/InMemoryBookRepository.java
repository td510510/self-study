package com.learn.library.repository;

import com.learn.library.model.Book;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Lưu trong bộ nhớ. Đổi sang lưu file/DB chỉ cần viết class mới implement BookRepository —
 * tầng service không phải sửa một dòng nào.
 */
public class InMemoryBookRepository implements BookRepository {

    private final Map<String, Book> data = new LinkedHashMap<>();

    @Override public Book save(Book book) {
        data.put(book.getIsbn(), book);
        return book;
    }

    @Override public Optional<Book> findById(String isbn) {
        return Optional.ofNullable(data.get(isbn));
    }

    @Override public List<Book> findAll() { return new ArrayList<>(data.values()); }

    @Override public boolean deleteById(String isbn) { return data.remove(isbn) != null; }

    @Override public long count() { return data.size(); }

    @Override public List<Book> searchByTitle(String keyword) {
        if (keyword == null || keyword.isBlank()) return findAll();
        String k = keyword.toLowerCase();
        return data.values().stream()
                .filter(b -> b.getTitle().toLowerCase().contains(k)
                          || (b.getAuthor() != null && b.getAuthor().toLowerCase().contains(k)))
                .toList();
    }

    @Override public List<Book> findByCategory(String category) {
        return data.values().stream()
                .filter(b -> b.getCategory() != null && b.getCategory().equalsIgnoreCase(category))
                .toList();
    }

    @Override public List<Book> findAvailable() {
        return data.values().stream().filter(Book::isAvailable).toList();
    }
}
