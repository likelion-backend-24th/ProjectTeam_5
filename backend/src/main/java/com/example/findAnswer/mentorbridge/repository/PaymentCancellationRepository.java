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
}
