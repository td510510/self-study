package com.learn.blog.security;

import com.learn.blog.domain.Role;
import com.learn.blog.domain.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Set;

/**
 * Bọc User của ứng dụng thành UserDetails của Spring Security.
 *
 * Có thêm getId() để dùng trong @PreAuthorize:
 *   @PreAuthorize("#userId == authentication.principal.id or hasRole('ADMIN')")
 */
public class CustomUserDetails implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final String fullName;
    private final boolean enabled;
    private final Set<Role> roles;

    public CustomUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.fullName = user.getFullName();
        this.enabled = user.isEnabled();
        this.roles = Set.copyOf(user.getRoles());
    }

    public Long getId() { return id; }

    public String getEmail() { return email; }

    public String getFullName() { return fullName; }

    public boolean isAdmin() { return roles.contains(Role.ROLE_ADMIN); }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Tên enum đã có tiền tố ROLE_ nên hasRole('ADMIN') hoạt động đúng
        return roles.stream().map(r -> new SimpleGrantedAuthority(r.name())).toList();
    }

    @Override public String getPassword() { return password; }

    /** Spring Security gọi "username"; ở đây định danh là email. */
    @Override public String getUsername() { return email; }

    @Override public boolean isAccountNonExpired() { return true; }

    @Override public boolean isAccountNonLocked() { return true; }

    @Override public boolean isCredentialsNonExpired() { return true; }

    @Override public boolean isEnabled() { return enabled; }
}
