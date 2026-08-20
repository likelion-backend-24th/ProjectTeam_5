package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u LEFT JOIN u.mentorProfile p WHERE u.role = 'MENTOR' " +
            "AND (:keyword IS NULL OR :keyword = '' OR " +
            "     LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(p.bio) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "     LOWER(p.tags) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> findMentors(
            @Param("keyword") String keyword,
            Pageable pageable
    );
}