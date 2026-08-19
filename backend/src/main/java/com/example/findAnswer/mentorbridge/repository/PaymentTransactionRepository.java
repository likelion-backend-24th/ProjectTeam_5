package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.entity.PaymentTransaction;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByTransactionId(String transactionId);

    List<PaymentTransaction> findByPayment_IdOrderByCreatedAtAsc(Long paymentId);
}