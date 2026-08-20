package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.client.billing.BillingClient;
import com.example.findAnswer.mentorbridge.constants.BillingKeyIssuanceStatus;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentMethodStatus;
import com.example.findAnswer.mentorbridge.dto.billing.BillingKeyPrepareResponse;
import com.example.findAnswer.mentorbridge.dto.billing.BillingRegisterResult;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentMethodRegisterRequest;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentMethodResponse;
import com.example.findAnswer.mentorbridge.entity.BillingKeyIssuanceIntent;
import com.example.findAnswer.mentorbridge.entity.PaymentMethod;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.BillingKeyIssuanceIntentRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentMethodRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import com.example.findAnswer.mentorbridge.util.ShortId;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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
    private final BillingKeyIssuanceIntentRepository billingKeyIssuanceIntentRepository;

    @Value("${portone.store-id}")
    private String storeId;

    @Value("${portone.channel-key-billing}")
    private String channelKeyBilling;

    @Value("${portone.billing-issue-id-prefix}")
    private String billingIssueIdPrefix;

    // 빌링키 발급 준비 — 프론트가 PortOne requestIssueBillingKey()를 호출할 때 넘길 값들을 만들어준다.
    @Transactional
    public BillingKeyPrepareResponse prepareBillingKeyIssuance(Long userId) {
        userRepository.findById(userId).orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 이니시스 oid 제한(1~40자) 때문에 UUID를 통째로 못 붙인다.
        String issueId = billingIssueIdPrefix + "-" + ShortId.generate();

        billingKeyIssuanceIntentRepository.save(
                BillingKeyIssuanceIntent.builder()
                        .issueId(issueId)
                        .userId(userId)
                        .storeId(storeId)
                        .channelKey(channelKeyBilling)
                        .status(BillingKeyIssuanceStatus.PENDING)
                        .build()
        );

        return new BillingKeyPrepareResponse(storeId, channelKeyBilling, issueId);
    }

    @Transactional
    public PaymentMethodResponse registerPaymentMethod(Long userId, PaymentMethodRegisterRequest request) {

        User user = userRepository.findById(userId).orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        BillingKeyIssuanceIntent intent = billingKeyIssuanceIntentRepository.findByIssueId(request.issueId())
                .orElseThrow(() -> new CustomException(ErrorCode.BILLING_KEY_ISSUANCE_NOT_FOUND));

        if (!intent.isOwnedBy(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        if (intent.getStatus() != BillingKeyIssuanceStatus.PENDING) {
            throw new CustomException(ErrorCode.BILLING_KEY_ALREADY_USED);
        }

        BillingRegisterResult result;
        try {
            result = billingClient.register(request.billingKey());
        } catch (CustomException e) {
            intent.markFailed();
            throw e;
        }
        intent.markIssued();
        user.updatePhoneNumber(request.phoneNumber());

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
