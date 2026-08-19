package com.example.findAnswer.mentorbridge.dto.payment;

import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.entity.Payment;
import com.example.findAnswer.mentorbridge.entity.Subscription;

import java.time.LocalDateTime;

public record PaymentCompleteResponse(
        String paymentId,
        Long subscriptionId,
        PaymentStatus paymentStatus,
        SubscriptionStatus subscriptionStatus,
        Long amount,
        LocalDateTime currentPeriodEnd
) {

    public static PaymentCompleteResponse from(Payment payment, Subscription subscription) {

        return new PaymentCompleteResponse(
                payment.getPaymentId(),
                subscription.getId(),
                payment.getStatus(),
                subscription.getStatus(),
                payment.getAmount(),
                subscription.getCurrentPeriodEnd()
        );

    }
}
