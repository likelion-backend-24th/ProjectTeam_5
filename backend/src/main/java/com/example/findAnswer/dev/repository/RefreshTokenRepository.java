package com.example.findAnswer.dev.repository;

import com.example.findAnswer.dev.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
}