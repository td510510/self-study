package com.learn.blog.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

/**
 * Người dùng.
 *
 * Chú ý:
 *  - KHÔNG dùng Lombok @Data trên entity (sinh equals/hashCode trên mọi field,
 *    kể cả quan hệ lazy -> tải dữ liệu ngoài ý muốn / đệ quy vô hạn).
 *  - equals/hashCode dựa trên email (định danh nghiệp vụ), không dựa trên id.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    /** Luôn là BCrypt hash, không bao giờ là mật khẩu thô. */
    @Column(nullable = false, length = 255)
    private String password;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    /** Bảng phụ user_roles. EAGER vì luôn cần khi xác thực và tập này rất nhỏ. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role", nullable = false)
    @Enumerated(EnumType.STRING)          // LUÔN STRING, không bao giờ ORDINAL
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;

    public boolean hasRole(Role role) { return roles.contains(role); }

    public void addRole(Role role) { roles.add(role); }

    @Override
    public boolean equals(Object o) {
        return o instanceof User u && email != null && email.equals(u.email);
    }

    @Override
    public int hashCode() { return Objects.hashCode(email); }

    @Override
    public String toString() { return "User(id=" + id + ", email=" + email + ")"; }
}
