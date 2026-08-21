package com.example.findAnswer.mentorbridge.dto.payment;

import com.example.findAnswer.mentorbridge.constants.PaymentCancellationStatus;
import com.example.findAnswer.mentorbridge.entity.PaymentCancellation;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.entity.User;

import java.time.LocalDateTime;

public record PaymentCancellationResponse(
        Long id,
        String paymentId,
        Long amount,
        PaymentCancellationStatus status,
        String reason,
        String adminNote,
        LocalDateTime createdAt,
        Long userId,
        String userName,
        Long mentorId,
        String mentorName
) {
    public static PaymentCancellationResponse from(PaymentCancellation cancellation) {
        Subscription subscription = cancellation.getPayment().getSubscription();
        User user = subscription.getUser();
        User mentor = subscription.getMentor();

        return new PaymentCancellationResponse(
                cancellation.getId(),
                cancellation.getPayment().getPaymentId(),
                cancellation.getAmount(),
                cancellation.getStatus(),
                cancellation.getReason(),
                cancellation.getAdminNote(),
                cancellation.getCreatedAt(),
                user.getId(),
                user.getName(),
                mentor.getId(),
                mentor.getName()
        );
    }
}
