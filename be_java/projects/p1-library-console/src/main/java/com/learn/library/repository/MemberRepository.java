package com.learn.library.repository;

import com.learn.library.model.Member;
import java.util.Optional;

public interface MemberRepository extends Repository<Member, String> {
    Optional<Member> findByEmail(String email);
}
