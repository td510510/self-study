package com.learn.blog.repository;

import com.learn.blog.domain.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.Set;

public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByName(String name);
    Set<Tag> findByNameIn(Set<String> names);
}
