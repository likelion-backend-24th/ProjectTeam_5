package com.example.findAnswer.mentorbridge.dto.payment;

public record PaymentPrepareResponse(
        String storeId,
        String channelKey,
        String paymentId,
        String orderName,
        Long totalAmount,
        String currency
) {
}