package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.SettlementAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SettlementAccountRepository extends JpaRepository<SettlementAccount, Long> {
    Optional<SettlementAccount> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}