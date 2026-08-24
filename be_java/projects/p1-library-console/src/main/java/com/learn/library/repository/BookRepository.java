package com.learn.library.repository;

import com.learn.library.model.Book;
import java.util.List;

public interface BookRepository extends Repository<Book, String> {
    List<Book> searchByTitle(String keyword);
    List<Book> findByCategory(String category);
    List<Book> findAvailable();
}
