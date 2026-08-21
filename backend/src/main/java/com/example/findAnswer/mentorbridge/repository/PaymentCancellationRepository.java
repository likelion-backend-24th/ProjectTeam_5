package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.constants.PaymentCancellationStatus;
import com.example.findAnswer.mentorbridge.entity.PaymentCancellation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentCancellationRepository extends JpaRepository<PaymentCancellation, Long> {

    List<PaymentCancellation> findByPaymentId(Long paymentId);

    boolean existsByPaymentIdAndStatus(Long paymentId, PaymentCancellationStatus status);

    List<PaymentCancellation> findByStatusOrderByCreatedAtAsc(PaymentCancellationStatus status);

    Optional<PaymentCancellation> findByIdAndRequestedByUserId(Long id, Long userId);

    List<PaymentCancellation> findByRequestedByUserId(Long userId);

    // 멘토 대시보드 — 이 멘토 소속 결제 건에 대해 대기 중인 환불 요청
    List<PaymentCancellation> findByPayment_Subscription_Mentor_IdAndStatusOrderByCreatedAtAsc(
            Long mentorId, PaymentCancellationStatus status
    );

    long countByPayment_Subscription_Mentor_IdAndStatus(Long mentorId, PaymentCancellationStatus status);
}
