package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository  extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);// email로 회원 정보 조회
    boolean existsByEmail(String email); // 회원가입시 이메일 중복 확인

    //멘토조회
    @Query("SELECT u FROM User u WHERE u.role = 'MENTOR' " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(u.bio) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(u.tags) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> findMentors(
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
