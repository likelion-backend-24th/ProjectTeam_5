package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findBySubscriptionIdOrderByCycleNoDesc(Long subscriptionId);

    Optional<Payment> findByPaymentId(String paymentId);

    boolean existsBySubscriptionIdAndCycleNo(Long subscriptionId, int cycleNo);

    // 다음 회차로 예약해둔 결제 건(구독 해지 시 이 건의 예약을 취소해야 함)
    Optional<Payment> findFirstBySubscriptionIdAndStatusOrderByCycleNoDesc(Long subscriptionId, PaymentStatus status);

}
