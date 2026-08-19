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

        boolean wasDefault = paymentMethod.isDefault();
        paymentMethod.softDelete(); // soft delete

        // 대표 카드를 삭제했다면, 남은 ACTIVE 카드 중 가장 최근 것을 대표로 자동 승격.
        // (softDelete 로 status=DELETED 가 flush 되므로 아래 ACTIVE 조회에서 방금 지운 카드는 빠진다.
        //  혹시 모를 flush 타이밍 대비로 방금 지운 id 는 한 번 더 걸러낸다.)
        if (wasDefault) {
            paymentMethodRepository
                    .findByUserAndPaymentMethodStatusOrderByCreatedAtDesc(paymentMethod.getUser(), PaymentMethodStatus.ACTIVE)
                    .stream()
                    .filter(pm -> !pm.getId().equals(paymentMethodId))
                    .findFirst()
                    .ifPresent(PaymentMethod::setDefault);
        }
    }

    @Transactional
    public PaymentMethodResponse setDefaultPaymentMethod(Long userId, Long paymentMethodId) {
        PaymentMethod targetPaymentMethod = paymentMethodRepository.findById(paymentMethodId).orElseThrow(
                () -> new CustomException(ErrorCode.PAYMENT_METHOD_NOT_FOUND)
        );
        if (!targetPaymentMethod.isOwnedBy(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 기존 "대표 카드"(다른 카드)를 찾아 해제해야 대표가 1개로 유지된다.
        // 기존 코드는 target 자신을 다시 찾아 unset→set 하기만 해서 기존 대표가 안 풀려 대표가 2개가 됐다.
        paymentMethodRepository.findByUserAndIsDefaultTrueAndPaymentMethodStatus(user, PaymentMethodStatus.ACTIVE)
                .ifPresent(PaymentMethod::unsetDefault);

        targetPaymentMethod.setDefault();

        return PaymentMethodResponse.from(targetPaymentMethod);
    }



}
