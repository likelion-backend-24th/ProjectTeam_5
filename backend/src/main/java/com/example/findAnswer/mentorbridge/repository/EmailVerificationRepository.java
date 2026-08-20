package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.EmailVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, Long> {

    Optional<EmailVerification> findByUserIdAndEmail(Long userId, String email);
    void deleteByUserId(Long userId);
}