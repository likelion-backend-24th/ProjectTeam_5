package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentPrepareResponse;
import com.example.findAnswer.mentorbridge.entity.MentorPlan;
import com.example.findAnswer.mentorbridge.entity.Payment;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.MentorPlanRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentPrepareService {

    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final MentorPlanRepository mentorPlanRepository;

    @Value("${portone.store-id}")
    private String storeId;

    @Value("${portone.channel-key-payment}")
    private String channelKey;

    @Value("${portone.payment-id-prefix}")
    private String paymentIdPrefix;

    @Transactional
    public PaymentPrepareResponse prepare(Long userId, Long mentorId, Long planId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        MentorPlan mentorPlan = mentorPlanRepository.findByIdAndIsActiveTrue(planId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLAN_NOT_FOUND));

        if (!mentorPlan.isOwnedByMentor(mentorId)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        LocalDateTime now = LocalDateTime.now();

        // 처음 구독하는 멘토라면 여기서 PENDING 구독을 새로 만든다.
        // (SubscriptionController가 별도의 "구독 신청" 엔드포인트 없이 이 API 하나로 신청+결제 준비를 겸하기 때문에,
        //  여기서 만들어두지 않으면 첫 구독자는 영원히 SUBSCRIPTION_NOT_FOUND만 받게 된다.)
        Subscription subscription = subscriptionRepository.findByUserIdAndMentorId(userId, mentorId)
                .map(sub -> {
                    if (sub.hasActivePermission(now)) {
                        throw new CustomException(ErrorCode.ALREADY_SUBSCRIBED);
                    }
                    // 기존(만료 등) 이력이 있으면 결제 확정 전 상태로 되돌리고 이번에 선택된 요금제·금액을 반영
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

        int cycleNo = paymentRepository.findBySubscriptionIdOrderByCycleNoDesc(subscription.getId())
                .stream()
                .findFirst()
                .map(p -> p.getCycleNo() + 1)
                .orElse(1);

        String paymentId = paymentIdPrefix + "-" + cycleNo + "-" + UUID.randomUUID();

        Payment payment = paymentRepository.save(
                Payment.builder()
                        .paymentId(paymentId)
                        .subscriptionId(subscription.getId())
                        .cycleNo(cycleNo)
                        .attemptNo(1)
                        .currency("KRW")
                        .amount(mentorPlan.getPrice().longValue())
                        .status(PaymentStatus.READY)
                        .storeId(storeId)
                        .channelKey(channelKey)
                        .build()
        );

        return new PaymentPrepareResponse(
                storeId,
                channelKey,
                payment.getPaymentId(),
                mentorPlan.getPlanName() + " 구독",
                payment.getAmount(),
                payment.getCurrency()
        );
    }
}
