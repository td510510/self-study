package com.learn.library.repository;

import com.learn.library.model.Member;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class InMemoryMemberRepository implements MemberRepository {

    private final Map<String, Member> data = new LinkedHashMap<>();

    @Override public Member save(Member m) { data.put(m.getCode(), m); return m; }

    @Override public Optional<Member> findById(String code) { return Optional.ofNullable(data.get(code)); }

    @Override public List<Member> findAll() { return new ArrayList<>(data.values()); }

    @Override public boolean deleteById(String code) { return data.remove(code) != null; }

    @Override public long count() { return data.size(); }

    @Override public Optional<Member> findByEmail(String email) {
        if (email == null) return Optional.empty();
        return data.values().stream()
                .filter(m -> email.equalsIgnoreCase(m.getEmail()))
                .findFirst();
    }
}
