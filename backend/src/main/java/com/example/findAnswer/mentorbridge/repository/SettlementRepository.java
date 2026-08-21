package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    Optional<Settlement> findByPaymentId(Long paymentId);
}