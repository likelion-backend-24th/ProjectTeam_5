package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.client.billing.PortOneBillingClient;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentMethodStatus;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentCompleteResponse;
import com.example.findAnswer.mentorbridge.entity.MentorPlan;
import com.example.findAnswer.mentorbridge.entity.Payment;
import com.example.findAnswer.mentorbridge.entity.PaymentMethod;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.MentorPlanRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentMethodRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import com.example.findAnswer.mentorbridge.util.ShortId;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

// 구독 신청 = 등록된 카드(빌링키)로 즉시 서버가 직접 청구.
// PortOne 결제창 팝업이 없다 — 카드는 미리 "카드 등록" 화면에서 등록돼 있어야 한다(PaymentMethodService).
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentPrepareService {

    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final MentorPlanRepository mentorPlanRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final PortOneBillingClient portOneBillingClient;
    private final PaymentSyncService paymentSyncService;

    @Value("${portone.store-id}")
    private String storeId;

    @Value("${portone.channel-key-payment}")
    private String channelKey;

    @Value("${portone.payment-id-prefix}")
    private String paymentIdPrefix;

    @Transactional
    public PaymentCompleteResponse subscribe(Long userId, Long mentorId, Long planId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        MentorPlan mentorPlan = mentorPlanRepository.findByIdAndIsActiveTrue(planId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLAN_NOT_FOUND));

        if (!mentorPlan.isOwnedByMentor(mentorId)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        // 구독하려면 대표 카드가 미리 등록돼 있어야 한다 — 없으면 프론트가 카드 등록 화면으로 보내야 함.
        PaymentMethod paymentMethod = paymentMethodRepository
                .findByUserAndIsDefaultTrueAndPaymentMethodStatus(user, PaymentMethodStatus.ACTIVE)
                .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_METHOD_REQUIRED));

        LocalDateTime now = LocalDateTime.now();

        // 처음 구독하는 멘토라면 여기서 PENDING 구독을 새로 만든다.
        Subscription subscription = subscriptionRepository.findByUserIdAndMentorId(userId, mentorId)
                .map(sub -> {
                    if (sub.hasActivePermission(now)) {
                        throw new CustomException(ErrorCode.ALREADY_SUBSCRIBED);
                    }
                    sub.reserverForPayment(mentorPlan.getId(), mentorPlan.getPrice());
                    return sub;
                })
                .orElseGet(() -> subscriptionRepository.save(
                        Subscription.builder()
                                .userId(userId)
                                .mentorId(mentorId)
                                .planId(mentorPlan.getId())
                                .status(SubscriptionStatus.PENDING)
                                .amount(mentorPlan.getPrice())
                                .currentPeriodStart(now)
                                .currentPeriodEnd(now) // 결제 확정 전 임시값. activateAfterFirstPayment가 갱신한다.
                                .build()
                ));

        subscription.assignPaymentMethod(paymentMethod.getId());

        int cycleNo = paymentRepository.findBySubscriptionIdOrderByCycleNoDesc(subscription.getId())
                .stream()
                .findFirst()
                .map(p -> p.getCycleNo() + 1)
                .orElse(1);

        // 이니시스 oid 제한(1~40자) 때문에 UUID를 통째로 못 붙인다.
        String paymentId = paymentIdPrefix + "-" + cycleNo + "-" + ShortId.generate();
        String orderName = mentorPlan.getPlanName() + " 구독";
        Long amount = mentorPlan.getPrice().longValue();

        paymentRepository.save(
                Payment.builder()
                        .paymentId(paymentId)
                        .subscriptionId(subscription.getId())
                        .cycleNo(cycleNo)
                        .attemptNo(1)
                        .currency("KRW")
                        .amount(amount)
                        .status(PaymentStatus.READY)
                        .storeId(storeId)
                        .channelKey(channelKey)
                        .build()
        );

        // 결제창 없이 서버가 직접 청구 — 프론트 신호를 기다릴 필요가 없다(원칙 2는 아래 complete()의 재조회가 지켜준다).
        portOneBillingClient.payWithBillingKey(
                paymentId, paymentMethod.getBillingKey(), channelKey, orderName, amount, "KRW",
                user.getName(), user.getPhoneNumber(), user.getEmail()
        );

        return paymentSyncService.complete(paymentId, userId);
    }
}
