package com.example.findAnswer.mentorbridge.dto.payment;

import com.example.findAnswer.mentorbridge.constants.PaymentProvider;
import com.example.findAnswer.mentorbridge.entity.PaymentMethod;

import java.time.LocalDateTime;

public record PaymentMethodResponse(
        Long id,
        PaymentProvider paymentProvider,
        String brand,
        String last4,
        String cardNickname,
        boolean isDefault,
        LocalDateTime createdAt
) {

    public static PaymentMethodResponse from(PaymentMethod paymentMethod) {
        return new PaymentMethodResponse(
                paymentMethod.getId(),
                paymentMethod.getPaymentProvider(),
                paymentMethod.getCardBrand(),
                paymentMethod.getLast4(),
                paymentMethod.getCardNickname(),
                paymentMethod.isDefault(),
                paymentMethod.getCreatedAt()
        );
    }
}
