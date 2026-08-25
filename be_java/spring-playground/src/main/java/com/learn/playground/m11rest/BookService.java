package com.learn.playground.m11rest;

import com.learn.playground.m11rest.BookDtos.BookResponse;
import com.learn.playground.m11rest.BookDtos.CreateBookRequest;
import com.learn.playground.m11rest.BookDtos.UpdateBookRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Lưu trong bộ nhớ để Module 11 chỉ tập trung vào TẦNG WEB (DB là chuyện của Module 12).
 *
 * Chú ý: dùng ConcurrentHashMap chứ không phải HashMap — bean singleton bị nhiều
 * thread dùng chung (Module 06 + 10).
 */
@Service
public class BookService {

    private final Map<Long, BookResponse> store = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong();

    public BookService() {
        create(new CreateBookRequest("978-0001", "Clean Code", "Robert C. Martin", 3));
        create(new CreateBookRequest("978-0002", "Effective Java", "Joshua Bloch", 2));
        create(new CreateBookRequest("978-0003", "Refactoring", "Martin Fowler", 1));
        create(new CreateBookRequest("978-0004", "Domain-Driven Design", "Eric Evans", 2));
        create(new CreateBookRequest("978-0005", "The Pragmatic Programmer", "Hunt & Thomas", 4));
        create(new CreateBookRequest("978-0006", "Designing Data-Intensive Applications", "Kleppmann", 2));
        create(new CreateBookRequest("978-0007", "Java Concurrency in Practice", "Brian Goetz", 1));
    }

    public Page<BookResponse> search(String keyword, Pageable pageable) {
        List<BookResponse> all = new ArrayList<>(store.values());
        all.sort(Comparator.comparing(BookResponse::id));

        List<BookResponse> filtered = keyword == null || keyword.isBlank()
                ? all
                : all.stream()
                     .filter(b -> b.title().toLowerCase().contains(keyword.toLowerCase())
                               || b.author().toLowerCase().contains(keyword.toLowerCase()))
                     .toList();

        int from = (int) Math.min(pageable.getOffset(), filtered.size());
        int to = Math.min(from + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(from, to), pageable, filtered.size());
    }

    public BookResponse getById(Long id) {
        BookResponse book = store.get(id);
        if (book == null) throw new NotFoundException("sách", id);
        return book;
    }

    public BookResponse create(CreateBookRequest request) {
        boolean isbnTrung = store.values().stream().anyMatch(b -> b.isbn().equals(request.isbn()));
        if (isbnTrung) throw new ConflictException("ISBN đã tồn tại: " + request.isbn());

        long id = sequence.incrementAndGet();
        BookResponse book = new BookResponse(id, request.isbn(), request.title(),
                request.author(), request.copies(), Instant.now());
        store.put(id, book);
        return book;
    }

    public BookResponse update(Long id, UpdateBookRequest request) {
        BookResponse old = getById(id);
        BookResponse updated = new BookResponse(
                old.id(), old.isbn(),
                request.title() != null ? request.title() : old.title(),
                request.author() != null ? request.author() : old.author(),
                request.copies() != null ? request.copies() : old.copies(),
                old.createdAt());
        store.put(id, updated);
        return updated;
    }

    public void delete(Long id) {
        if (store.remove(id) == null) throw new NotFoundException("sách", id);
    }

    // ---- exception nghiệp vụ, được GlobalExceptionHandler dịch sang HTTP status ----
    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String resource, Object id) {
            super("Không tìm thấy " + resource + " với id " + id);
        }
    }

    public static class ConflictException extends RuntimeException {
        public ConflictException(String message) { super(message); }
    }
}
