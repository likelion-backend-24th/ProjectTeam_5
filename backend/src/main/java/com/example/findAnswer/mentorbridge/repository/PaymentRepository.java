package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findBySubscriptionIdOrderByCycleNoDesc(Long subscriptionId);

    Optional<Payment> findByPaymentId(String paymentId);

    boolean existsBySubscriptionIdAndCycleNo(Long subscriptionId, int cycleNo);

}
