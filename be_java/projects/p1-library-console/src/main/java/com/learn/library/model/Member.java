package com.learn.library.model;

import java.time.LocalDate;
import java.util.Objects;

public class Member {

    public enum Status { ACTIVE, SUSPENDED }

    private final String code;
    private String name;
    private String email;
    private String phone;
    private final LocalDate joinedAt;
    private Status status = Status.ACTIVE;

    public Member(String code, String name, String email, String phone, LocalDate joinedAt) {
        if (code == null || code.isBlank()) throw new IllegalArgumentException("Mã thành viên không được rỗng");
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Tên không được rỗng");
        if (email != null && !email.contains("@")) throw new IllegalArgumentException("Email không hợp lệ: " + email);
        this.code = code;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.joinedAt = joinedAt == null ? LocalDate.now() : joinedAt;
    }

    public boolean isActive() { return status == Status.ACTIVE; }
    public void suspend() { status = Status.SUSPENDED; }
    public void activate() { status = Status.ACTIVE; }

    public String getCode() { return code; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public LocalDate getJoinedAt() { return joinedAt; }
    public Status getStatus() { return status; }

    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setPhone(String phone) { this.phone = phone; }

    @Override public boolean equals(Object o) { return o instanceof Member m && code.equals(m.code); }
    @Override public int hashCode() { return Objects.hash(code); }

    @Override public String toString() {
        return "%-8s | %-20s | %-24s | %-11s | %s".formatted(
                code, name, email == null ? "-" : email, phone == null ? "-" : phone, status);
    }
}
