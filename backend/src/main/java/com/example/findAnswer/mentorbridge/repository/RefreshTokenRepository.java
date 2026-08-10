package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}