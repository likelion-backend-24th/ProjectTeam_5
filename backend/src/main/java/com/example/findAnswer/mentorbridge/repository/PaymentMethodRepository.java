package com.example.findAnswer.mentorbridge.repository;

import com.example.findAnswer.mentorbridge.constants.PaymentMethodStatus;
import com.example.findAnswer.mentorbridge.entity.PaymentMethod;
import com.example.findAnswer.mentorbridge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {

    List<PaymentMethod> findByUserAndPaymentMethodStatusOrderByCreatedAtDesc(User user, PaymentMethodStatus status);

    Optional<PaymentMethod> findByIdAndPaymentMethodStatus(Long id, PaymentMethodStatus status);

    boolean existsByUserAndPaymentMethodStatus(User user, PaymentMethodStatus status);

    Optional<PaymentMethod> findByUserAndIsDefaultTrueAndPaymentMethodStatus(User user, PaymentMethodStatus status);

}
