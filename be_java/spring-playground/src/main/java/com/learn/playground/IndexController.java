package com.learn.playground;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/** Trang chủ liệt kê mọi endpoint demo — mở http://localhost:8080/ */
@RestController
public class IndexController {

    @GetMapping("/")
    public Map<String, Object> index() {
        Map<String, String> m10 = new LinkedHashMap<>();
        m10.put("GET /m10/di", "3 kiểu tiêm phụ thuộc + vì sao constructor thắng");
        m10.put("GET /m10/strategy?type=MOMO", "nhiều bean cùng kiểu: tiêm cả Map (Open/Closed)");
        m10.put("GET /m10/singleton-bug", "bean singleton có state -> sai dữ liệu khi đa luồng");
        m10.put("GET /m10/config", "đọc cấu hình bằng @ConfigurationProperties");
        m10.put("GET /m10/aop", "aspect đo thời gian chạy (xem console)");
        m10.put("GET /m10/self-invocation", "BẪY: gọi nội bộ -> @Transactional/@Cacheable vô hiệu");

        Map<String, String> m11 = new LinkedHashMap<>();
        m11.put("GET  /api/v1/books?page=0&size=5", "phân trang + PageResponse riêng");
        m11.put("POST /api/v1/books", "tạo mới -> 201 + header Location");
        m11.put("POST /api/v1/books (dữ liệu sai)", "-> 400 kèm fieldErrors tiếng Việt");
        m11.put("GET  /api/v1/books/999", "-> 404 đúng định dạng ErrorResponse");
        m11.put("(mọi request)", "log có requestId, response có header X-Request-Id — xem console");
        m11.put("GET  /m11/external/rates", "gọi API đối tác bằng RestClient, chuyển tiếp X-Request-Id");
        m11.put("GET  /m11/external/rates?delayMs=5000", "đối tác chậm -> read timeout 2s -> 503, KHÔNG treo thread");
        m11.put("GET  /m11/external/flaky", "đối tác lỗi 503 hai lần -> retry có backoff -> thành công");

        Map<String, String> m12 = new LinkedHashMap<>();
        m12.put("GET /m12/n-plus-1/bad", "đếm số câu SQL khi bị N+1");
        m12.put("GET /m12/n-plus-1/good", "cùng dữ liệu, dùng JOIN FETCH -> 1 query");
        m12.put("GET /m12/dirty-checking", "sửa entity trong transaction, KHÔNG gọi save()");
        m12.put("GET /m12/rollback", "ném exception giữa chừng -> rollback toàn bộ");
        m12.put("GET /m12/atomic-stock", "100 luồng cùng mua: UPDATE nguyên tử vs đọc-ghi");

        Map<String, String> m13 = new LinkedHashMap<>();
        m13.put("POST /m13/login", "{\"username\":\"an\",\"password\":\"123456\"} -> JWT");
        m13.put("GET  /m13/me", "cần Bearer token, không có -> 401");
        m13.put("GET  /m13/admin", "cần ROLE_ADMIN, thiếu quyền -> 403");
        m13.put("GET  /m13/orders/{id}", "demo IDOR: chỉ xem được đơn của chính mình");

        Map<String, String> m14 = new LinkedHashMap<>();
        m14.put("GET /m14/cache/{id}", "lần 1 chậm 1s, lần 2 tức thì (@Cacheable)");
        m14.put("GET /m14/cache/{id}/evict", "xóa cache -> lần sau lại chậm");
        m14.put("GET /m14/stampede", "20 luồng cùng đọc 1 key vừa hết hạn");
        m14.put("GET /m14/event", "sự kiện chỉ chạy SAU KHI transaction commit");

        Map<String, Object> all = new LinkedHashMap<>();
        all.put("huong-dan", "Gọi từng endpoint và ĐỌC LOG Ở CONSOLE — phần lớn bài học nằm ở đó.");
        all.put("Module 10 — Spring Core", m10);
        all.put("Module 11 — REST API", m11);
        all.put("Module 12 — Spring Data JPA", m12);
        all.put("Module 13 — Security & JWT", m13);
        all.put("Module 14 — Cache & Events", m14);
        all.put("h2-console", "http://localhost:8080/h2-console (JDBC URL: jdbc:h2:mem:playground)");
        return all;
    }
}
