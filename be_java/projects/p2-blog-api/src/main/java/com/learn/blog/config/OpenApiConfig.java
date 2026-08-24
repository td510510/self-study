package com.learn.blog.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Cấu hình Swagger UI: http://localhost:8080/swagger-ui.html
 *
 * Nút "Authorize" cho phép dán access token để gọi thử các API cần đăng nhập.
 */
@Configuration
public class OpenApiConfig {

    private static final String SCHEME = "bearerAuth";

    @Bean
    public OpenAPI blogOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Blog API")
                        .version("1.0.0")
                        .description("""
                                Dự án 2 của chương trình tự học Java Backend.

                                Cách dùng: gọi POST /api/v1/auth/login để lấy accessToken,
                                bấm nút Authorize ở góc phải và dán token vào.
                                """)
                        .contact(new Contact().name("Học viên Java Backend")))
                .addSecurityItem(new SecurityRequirement().addList(SCHEME))
                .components(new Components().addSecuritySchemes(SCHEME,
                        new SecurityScheme()
                                .name(SCHEME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
