package com.learn.playground.m11rest;

import com.learn.playground.m11rest.BookDtos.BookResponse;
import com.learn.playground.m11rest.BookDtos.CreateBookRequest;
import com.learn.playground.m11rest.BookDtos.UpdateBookRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

/**
 * Module 11 — REST API đúng chuẩn.
 *
 * Controller chỉ làm 3 việc: nhận input → gọi service → trả DTO.
 * Không có quy tắc nghiệp vụ nào ở đây.
 *
 * Thử nhanh:
 *   curl localhost:8080/api/v1/books?page=0&size=3
 *   curl -X POST localhost:8080/api/v1/books -H "Content-Type: application/json" \
 *        -d '{"isbn":"978-9999","title":"Sách mới","author":"Ai đó","copies":2}' -i
 *   curl -X POST localhost:8080/api/v1/books -H "Content-Type: application/json" -d '{}'
 */
@RestController
@RequestMapping("/api/v1/books")
public class BookController {

    /** Chặn client yêu cầu size=1000000 làm sập server. */
    private static final int MAX_PAGE_SIZE = 50;

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public PageResponse<BookResponse> list(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 5) Pageable pageable) {
        return PageResponse.of(bookService.search(keyword, capSize(pageable)), b -> b);
    }

    @GetMapping("/{id}")
    public BookResponse getOne(@PathVariable Long id) {
        return bookService.getById(id);
    }

    /** 201 Created + header Location trỏ tới tài nguyên vừa tạo. */
    @PostMapping
    public ResponseEntity<BookResponse> create(@Valid @RequestBody CreateBookRequest request) {
        BookResponse created = bookService.create(request);
        return ResponseEntity
                .created(URI.create("/api/v1/books/" + created.id()))
                .body(created);
    }

    /** PATCH = sửa một phần. Field nào null thì giữ nguyên. */
    @PatchMapping("/{id}")
    public BookResponse update(@PathVariable Long id, @Valid @RequestBody UpdateBookRequest request) {
        return bookService.update(id, request);
    }

    /** 204 No Content: xóa xong không có gì để trả về. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        bookService.delete(id);
    }

    /** Endpoint cố tình lỗi — để xem lưới an toàn 500 hoạt động thế nào. */
    @GetMapping("/boom")
    public String boom() {
        throw new IllegalStateException("Lỗi nội bộ giả lập: chi tiết này CHỈ được ghi vào log");
    }

    private Pageable capSize(Pageable pageable) {
        return pageable.getPageSize() <= MAX_PAGE_SIZE
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), MAX_PAGE_SIZE, pageable.getSort());
    }
}
