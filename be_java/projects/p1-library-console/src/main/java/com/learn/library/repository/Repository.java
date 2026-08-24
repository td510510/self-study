package com.learn.library.repository;

import java.util.List;
import java.util.Optional;

/** Repository generic — đúng mô hình mà Spring Data JPA sẽ sinh tự động cho bạn ở Module 12. */
public interface Repository<T, ID> {
    T save(T entity);
    Optional<T> findById(ID id);
    List<T> findAll();
    boolean deleteById(ID id);
    long count();
}
