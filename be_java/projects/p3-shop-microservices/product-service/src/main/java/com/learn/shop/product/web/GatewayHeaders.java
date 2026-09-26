package com.learn.shop.product.web;

import com.learn.shop.product.exception.ApiException;

import java.util.Arrays;

/**
 * Service phía sau gateway KHÔNG tự kiểm JWT: gateway đã xác thực và chuyển xuống
 *   X-User-Id: 42
 *   X-User-Roles: ROLE_USER,ROLE_ADMIN
 *
 * ⚠ Điều này chỉ an toàn khi client KHÔNG THỂ gọi thẳng vào service (chỉ gateway mới tới được,
 * bằng mạng nội bộ Docker/Kubernetes NetworkPolicy), và gateway XÓA các header này nếu client tự gửi lên.
 * Nếu không, ai cũng tự thêm "X-User-Roles: ROLE_ADMIN" được.
 */
public final class GatewayHeaders {

    public static final String USER_ID = "X-User-Id";
    public static final String USER_ROLES = "X-User-Roles";

    private GatewayHeaders() {
    }

    public static void requireAdmin(String rolesHeader) {
        boolean admin = rolesHeader != null && Arrays.stream(rolesHeader.split(","))
                .map(String::trim)
                .anyMatch("ROLE_ADMIN"::equals);
        if (!admin) throw ApiException.forbidden("Chỉ ADMIN được thực hiện thao tác này");
    }
}
