package com.learn.shop.product.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 100)
    private String category;

    /** VND. Dùng long thay vì double: tiền không được sai số làm tròn. */
    @Column(nullable = false)
    private long price;

    /**
     * Tồn kho. KHÔNG có setter công khai để trừ kho kiểu read-modify-write trong Java
     * (race condition khi nhiều request đồng thời) — trừ kho luôn bằng UPDATE nguyên tử
     * trong ProductRepository.decreaseStock.
     */
    @Column(nullable = false)
    private int stock;

    @Column(nullable = false)
    private boolean active = true;

    /** Optimistic locking: hai admin cùng sửa một sản phẩm -> người lưu sau nhận 409. */
    @Version
    private long version;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Product() {
        // cho JPA
    }

    public Product(String sku, String name, String category, long price, int stock) {
        this.sku = sku;
        this.name = name;
        this.category = category;
        this.price = price;
        this.stock = stock;
    }

    @PrePersist
    void onCreate() {
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void rename(String name) { this.name = name; }
    public void changeCategory(String category) { this.category = category; }
    public void changePrice(long price) { this.price = price; }
    public void setActive(boolean active) { this.active = active; }

    /** Admin nhập kho / kiểm kê. Khác với trừ kho khi bán (đi đường UPDATE nguyên tử). */
    public void adjustStockTo(int newStock) {
        if (newStock < 0) throw new IllegalArgumentException("Tồn kho không được âm");
        this.stock = newStock;
    }

    public Long getId() { return id; }
    public String getSku() { return sku; }
    public String getName() { return name; }
    public String getCategory() { return category; }
    public long getPrice() { return price; }
    public int getStock() { return stock; }
    public boolean isActive() { return active; }
    public long getVersion() { return version; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
