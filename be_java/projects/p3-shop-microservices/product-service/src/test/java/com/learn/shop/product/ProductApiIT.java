package com.learn.shop.product;

import com.learn.shop.product.domain.Product;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("API sản phẩm (qua HTTP)")
class ProductApiIT extends AbstractIT {

    private static final String ADMIN = "ROLE_USER,ROLE_ADMIN";

    @Autowired MockMvc mvc;

    @Test
    @DisplayName("danh sách có phân trang theo đúng hợp đồng, size bị chặn ở 100")
    void danhSach() throws Exception {
        mvc.perform(get("/api/v1/products").param("category", "Máy tính").param("size", "500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.size").value(100))
                .andExpect(jsonPath("$.items[0].category").value("Máy tính"))
                .andExpect(jsonPath("$.first").value(true));
    }

    @Test
    @DisplayName("lọc theo khoảng giá và từ khóa")
    void locGia() throws Exception {
        mvc.perform(get("/api/v1/products").param("keyword", "laptop").param("maxPrice", "23000000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].sku").value("LT-DELL-01"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("sort theo cột không cho phép -> 400 INVALID_SORT")
    void sortKhongHopLe() throws Exception {
        mvc.perform(get("/api/v1/products").param("sort", "version,desc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("INVALID_SORT"));
    }

    @Test
    @DisplayName("không tìm thấy -> 404 PRODUCT_NOT_FOUND, traceId trong body trùng header X-Trace-Id gửi lên")
    void khongTimThay() throws Exception {
        mvc.perform(get("/api/v1/products/999999").header("X-Trace-Id", "trace-abc-123"))
                .andExpect(status().isNotFound())
                .andExpect(header().string("X-Trace-Id", "trace-abc-123"))
                .andExpect(jsonPath("$.errorCode").value("PRODUCT_NOT_FOUND"))
                .andExpect(jsonPath("$.traceId").value("trace-abc-123"));
    }

    @Test
    @DisplayName("tạo sản phẩm: thiếu quyền ADMIN -> 403; ADMIN -> 201 + Location; SKU trùng -> 409")
    void taoSanPham() throws Exception {
        String body = """
                {"sku":"NEW-SKU-01","name":"Sản phẩm mới","category":"Phụ kiện","price":99000,"stock":3}""";

        mvc.perform(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON).content(body)
                        .header("X-User-Roles", "ROLE_USER"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.errorCode").value("FORBIDDEN"));

        mvc.perform(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON).content(body)
                        .header("X-User-Roles", ADMIN))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.sku").value("NEW-SKU-01"));

        mvc.perform(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON).content(body)
                        .header("X-User-Roles", ADMIN))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("SKU_EXISTS"));
    }

    @Test
    @DisplayName("dữ liệu sai -> 400 kèm fieldErrors")
    void validate() throws Exception {
        mvc.perform(post("/api/v1/products").contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-Roles", ADMIN)
                        .content("""
                                {"sku":"sai sku","name":"","category":"X","price":0,"stock":-1}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.sku").exists())
                .andExpect(jsonPath("$.fieldErrors.name").exists())
                .andExpect(jsonPath("$.fieldErrors.price").exists())
                .andExpect(jsonPath("$.fieldErrors.stock").exists());
    }

    @Test
    @DisplayName("cache Redis: đọc -> sửa giá -> đọc lại thấy giá MỚI (cache được xóa sau khi commit)")
    void cacheBiXoaKhiSua() throws Exception {
        Product p = newProduct(100_000, 5);
        String url = "/api/v1/products/" + p.getId();

        mvc.perform(get(url)).andExpect(jsonPath("$.price").value(100_000));
        mvc.perform(get(url)).andExpect(jsonPath("$.price").value(100_000));      // lần 2: lấy từ Redis

        mvc.perform(patch(url).contentType(MediaType.APPLICATION_JSON).header("X-User-Roles", ADMIN)
                        .content("{\"price\":120000}"))
                .andExpect(status().isOk());

        mvc.perform(get(url)).andExpect(jsonPath("$.price").value(120_000));
    }

    @Test
    @DisplayName("cache Redis: giữ kho qua API nội bộ -> chi tiết sản phẩm hiển thị tồn kho mới")
    void cacheBiXoaKhiGiuKho() throws Exception {
        Product p = newProduct(100_000, 5);
        String url = "/api/v1/products/" + p.getId();
        mvc.perform(get(url)).andExpect(jsonPath("$.stock").value(5));

        mvc.perform(post("/internal/products/reserve").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":%d,\"items\":[{\"productId\":%d,\"quantity\":2}]}"
                                .formatted(System.nanoTime(), p.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reserved").value(true))
                .andExpect(jsonPath("$.items[0].productName").value(p.getName()));

        mvc.perform(get(url)).andExpect(jsonPath("$.stock").value(3));
    }

    @Test
    @DisplayName("giữ kho vượt tồn -> 409 INSUFFICIENT_STOCK đúng định dạng hợp đồng")
    void giuKhoVuotTon() throws Exception {
        Product p = newProduct(100_000, 1);
        mvc.perform(post("/internal/products/reserve").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":%d,\"items\":[{\"productId\":%d,\"quantity\":2}]}"
                                .formatted(System.nanoTime(), p.getId())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("INSUFFICIENT_STOCK"))
                .andExpect(jsonPath("$.details.productId").value(p.getId()))
                .andExpect(jsonPath("$.details.requested").value(2))
                .andExpect(jsonPath("$.details.available").value(1));
    }
}
