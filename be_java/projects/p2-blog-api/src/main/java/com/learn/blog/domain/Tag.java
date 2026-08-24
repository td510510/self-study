package com.learn.blog.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.Objects;

@Entity
@Table(name = "tags")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    public Tag(String name) { this.name = name; }

    @Override public boolean equals(Object o) {
        return o instanceof Tag t && name != null && name.equals(t.name);
    }
    @Override public int hashCode() { return Objects.hashCode(name); }
}
