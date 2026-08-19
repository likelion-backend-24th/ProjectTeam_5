package com.example.findAnswer.mentorbridge.client.billing;

import com.example.findAnswer.mentorbridge.dto.billing.BillingRegisterResult;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentMethodRegisterRequest;

public interface BillingClient {
    BillingRegisterResult register(PaymentMethodRegisterRequest request);

}
