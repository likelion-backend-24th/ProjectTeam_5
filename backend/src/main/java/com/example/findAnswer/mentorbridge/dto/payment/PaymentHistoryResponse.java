package com.example.findAnswer.mentorbridge.dto.payment;

import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.entity.Payment;

import java.time.LocalDateTime;

public record PaymentHistoryResponse(
        String paymentId,
        int cycleNo,
        Long amount,
        PaymentStatus status,
        LocalDateTime paidAt
) {
    public static PaymentHistoryResponse from(Payment payment) {
        return new PaymentHistoryResponse(
                payment.getPaymentId(),
                payment.getCycleNo(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getPaidAt()
        );
    }
}
