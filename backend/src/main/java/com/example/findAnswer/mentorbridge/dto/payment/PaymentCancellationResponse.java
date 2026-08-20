package com.example.findAnswer.mentorbridge.dto.payment;

import com.example.findAnswer.mentorbridge.constants.PaymentCancellationStatus;
import com.example.findAnswer.mentorbridge.entity.PaymentCancellation;

import java.time.LocalDateTime;

public record PaymentCancellationResponse(
        Long id,
        String paymentId,
        Long amount,
        PaymentCancellationStatus status,
        String reason,
        String adminNote,
        LocalDateTime createdAt
) {
    public static PaymentCancellationResponse from(PaymentCancellation cancellation) {
        return new PaymentCancellationResponse(
                cancellation.getId(),
                cancellation.getPayment().getPaymentId(),
                cancellation.getAmount(),
                cancellation.getStatus(),
                cancellation.getReason(),
                cancellation.getAdminNote(),
                cancellation.getCreatedAt()
        );
    }
}
