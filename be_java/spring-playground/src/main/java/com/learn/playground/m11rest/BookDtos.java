package com.learn.playground.m11rest;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Module 11 — DTO tách khỏi model.
 *
 * Request và Response là HAI thứ khác nhau:
 *  - Request KHÔNG có id, createdAt (server tự sinh) và không có field nhạy cảm
 *    -> client không thể tự gán (chống mass assignment).
 *  - Response quyết định chính xác những gì lộ ra ngoài.
 */
public final class BookDtos {

    public record CreateBookRequest(

            @NotBlank(message = "ISBN không được để trống")
            @Pattern(regexp = "\d{3}-\d{4}", message = "ISBN phải có dạng 978-1234")
            String isbn,

            @NotBlank(message = "Tên sách không được để trống")
            @Size(min = 3, max = 200, message = "Tên sách phải từ 3 đến 200 ký tự")
            String title,

            @NotBlank(message = "Tác giả không được để trống")
            String author,

            @Min(value = 1, message = "Số bản phải >= 1")
            int copies
    ) { }

    /** Cập nhật một phần: field null nghĩa là "giữ nguyên". */
    public record UpdateBookRequest(
            @Size(min = 3, max = 200) String title,
            String author,
            @Min(1) Integer copies
    ) { }

    public record BookResponse(
            Long id,
            String isbn,
            String title,
            String author,
            int copies,
            Instant createdAt
    ) { }

    private BookDtos() { }
}
