package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.client.billing.BillingClient;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentMethodStatus;
import com.example.findAnswer.mentorbridge.dto.billing.BillingRegisterResult;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentMethodRegisterRequest;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentMethodResponse;
import com.example.findAnswer.mentorbridge.entity.PaymentMethod;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.PaymentMethodRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentMethodService {

    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;
    private final BillingClient billingClient;

    @Transactional
    public PaymentMethodResponse registerPaymentMethod(Long userId, PaymentMethodRegisterRequest request) {

        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        BillingRegisterResult result = billingClient.register(request); //mock은 그냥 통과, 포스원 실제 검증 필요

        boolean isFirst = !paymentMethodRepository.existsByUserAndPaymentMethodStatus(user, PaymentMethodStatus.ACTIVE);

        PaymentMethod saved = paymentMethodRepository.save(
                PaymentMethod.builder()
                        .user(user)
                        .paymentProvider(result.paymentProvider())
                        .billingKey(result.billingKey())
                        .cardBrand(result.brand())
                        .last4(result.last4())
                        .cardNickname(request.cardNickname())
                        .isDefault(isFirst)
                        .paymentMethodStatus(PaymentMethodStatus.ACTIVE)
                        .build()
        );

        return PaymentMethodResponse.from(saved);

    }

    public List<PaymentMethodResponse> getPaymentMethods(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        return paymentMethodRepository.findByUserAndPaymentMethodStatusOrderByCreatedAtDesc(user, PaymentMethodStatus.ACTIVE)
                .stream()
                .map(PaymentMethodResponse::from)
                .toList();
    }

    @Transactional
    public void deletePaymentMethod(Long userId, Long paymentMethodId) {
        PaymentMethod paymentMethod = paymentMethodRepository.findById(paymentMethodId).orElseThrow(
                () -> new CustomException(ErrorCode.PAYMENT_METHOD_NOT_FOUND)
        );

        if (!paymentMethod.isOwnedBy(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }

        paymentMethod.softDelete(); // soft delete

    }



}
