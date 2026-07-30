package com.example.findAnswer.dev.repository;

import com.example.findAnswer.dev.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository  extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);// email로 회원 정보 조회
    boolean existsByEmail(String email); // 회원가입시 이메일 중복 확인
}
