package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SettlementRepository extends JpaRepository<Settlement, Long> {
    Optional<Settlement> findByPaymentId(Long paymentId);

    // 멘토 본인의 정산 내역 조회
    List<Settlement> findByMentor_IdOrderByCreatedAtDesc(Long mentorId);

    // 관리자용 전체 정산 내역 조회
    List<Settlement> findAllByOrderByCreatedAtDesc();
}