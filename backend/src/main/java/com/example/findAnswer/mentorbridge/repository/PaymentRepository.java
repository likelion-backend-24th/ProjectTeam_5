package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findBySubscriptionIdOrderByCycleNoDesc(Long subscriptionId);

    Optional<Payment> findByPaymentId(String paymentId);

    boolean existsBySubscriptionIdAndCycleNo(Long subscriptionId, int cycleNo);

    // 다음 회차로 예약해둔 결제 건(구독 해지 시 이 건의 예약을 취소해야 함)
    Optional<Payment> findFirstBySubscriptionIdAndStatusOrderByCycleNoDesc(Long subscriptionId, PaymentStatus status);

    // 멘토 대시보드 — 이 멘토가 받은 전체 결제 내역(최신순)
    List<Payment> findBySubscription_Mentor_IdOrderByCreatedAtDesc(Long mentorId);

    // 멘토 대시보드 — 이번 달 매출(정상 결제 합계, periodStart 이후 paidAt 기준)
    @Query("""
            select coalesce(sum(p.amount), 0)
            from Payment p
            where p.subscription.mentor.id = :mentorId
              and p.status = :status
              and p.paidAt >= :periodStart
            """)
    long sumPaidAmountByMentorSince(
            @Param("mentorId") Long mentorId,
            @Param("status") PaymentStatus status,
            @Param("periodStart") LocalDateTime periodStart
    );
}
