package com.learn.blog.controller;

import com.learn.blog.dto.auth.AuthResponse;
import com.learn.blog.dto.auth.LoginRequest;
import com.learn.blog.dto.auth.RefreshRequest;
import com.learn.blog.dto.auth.RegisterRequest;
import com.learn.blog.dto.common.UserSummary;
import com.learn.blog.security.CustomUserDetails;
import com.learn.blog.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Xác thực", description = "Đăng ký, đăng nhập, refresh token")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Đăng ký tài khoản mới")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Đăng ký thành công, trả về token"),
            @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
            @ApiResponse(responseCode = "409", description = "Email đã được sử dụng")
    })
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        // Vai trò do server gán (ROLE_USER). Client KHÔNG thể tự chọn role —
        // đó là lý do RegisterRequest không có trường role (chống mass assignment).
        return authService.register(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập, nhận access token + refresh token")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Đăng nhập thành công"),
            @ApiResponse(responseCode = "401", description = "Sai thông tin đăng nhập hoặc tài khoản bị khóa")
    })
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Cấp access token mới bằng refresh token (có xoay vòng token)")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Đăng xuất — thu hồi refresh token")
    public void logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.refreshToken());
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Đổi mật khẩu — thu hồi mọi phiên đăng nhập hiện có")
    public void changePassword(@AuthenticationPrincipal CustomUserDetails user,
                               @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(user.getId(), request.oldPassword(), request.newPassword());
    }

    @GetMapping("/me")
    @Operation(summary = "Thông tin người dùng đang đăng nhập")
    public UserSummary me(@AuthenticationPrincipal CustomUserDetails user) {
        return new UserSummary(user.getId(), user.getFullName(), null);
    }

    public record ChangePasswordRequest(
            @NotBlank(message = "Mật khẩu hiện tại không được để trống") String oldPassword,
            @NotBlank(message = "Mật khẩu mới không được để trống")
            @Size(min = 8, max = 72, message = "Mật khẩu phải từ 8 đến 72 ký tự") String newPassword
    ) { }
}
