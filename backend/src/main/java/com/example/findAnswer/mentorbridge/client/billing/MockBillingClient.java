package com.example.findAnswer.mentorbridge.client.billing;

import com.example.findAnswer.mentorbridge.constants.PaymentProvider;
import com.example.findAnswer.mentorbridge.dto.billing.BillingRegisterResult;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentMethodRegisterRequest;
import org.springframework.stereotype.Component;

@Component
public class MockBillingClient implements BillingClient {

    @Override
    public BillingRegisterResult register(PaymentMethodRegisterRequest request) {

        return new BillingRegisterResult(
                PaymentProvider.MOCK,
                null,
                request.brand(),
                request.last4()
        );

    }
}
