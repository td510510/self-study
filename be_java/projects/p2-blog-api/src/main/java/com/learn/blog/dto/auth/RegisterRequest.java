package com.learn.blog.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        @Size(max = 255)
        String email,

        // Lưu ý: trong chuỗi Java phải viết "\\d" (một dấu \ là escape không hợp lệ -> lỗi biên dịch)
        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 8, max = 72, message = "Mật khẩu phải từ 8 đến 72 ký tự")
        @Pattern(regexp = ".*[A-Z].*", message = "Mật khẩu phải có ít nhất 1 chữ hoa")
        @Pattern(regexp = ".*\\d.*", message = "Mật khẩu phải có ít nhất 1 chữ số")
        String password,

        @NotBlank(message = "Họ tên không được để trống")
        @Size(min = 2, max = 100, message = "Họ tên phải từ 2 đến 100 ký tự")
        String fullName
) { }
