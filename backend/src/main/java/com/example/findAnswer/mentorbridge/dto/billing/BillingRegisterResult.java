package com.example.findAnswer.mentorbridge.dto.billing;

import com.example.findAnswer.mentorbridge.constants.PaymentProvider;

// 결제사에 카드 등록 요청 시 응답
public record BillingRegisterResult(
        PaymentProvider paymentProvider,
        String billingKey,
        String brand,
        String last4
) {
}
