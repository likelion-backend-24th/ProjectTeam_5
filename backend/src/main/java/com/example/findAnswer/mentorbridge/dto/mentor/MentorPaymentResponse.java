package com.example.findAnswer.mentorbridge.dto.mentor;

import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.entity.Payment;

import java.time.LocalDateTime;

public record MentorPaymentResponse(
        String paymentId,
        int cycleNo,
        Long amount,
        PaymentStatus status,
        Long userId,
        String userName,
        LocalDateTime paidAt,
        LocalDateTime createdAt
) {
    public static MentorPaymentResponse from(Payment payment) {
        return new MentorPaymentResponse(
                payment.getPaymentId(),
                payment.getCycleNo(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getSubscription().getUser().getId(),
                payment.getSubscription().getUser().getName(),
                payment.getPaidAt(),
                payment.getCreatedAt()
        );
    }
}
