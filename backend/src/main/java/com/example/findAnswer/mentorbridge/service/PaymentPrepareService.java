package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentPrepareResponse;
import com.example.findAnswer.mentorbridge.entity.MentorPlan;
import com.example.findAnswer.mentorbridge.entity.Payment;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.MentorPlanRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import com.example.findAnswer.mentorbridge.util.ShortId;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

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
        // 1. 유저 조회
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        // 2. 멘토 조회 (MentorPlan이 속한 멘토 확인용)
        User mentor = userRepository.findById(mentorId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        MentorPlan mentorPlan = mentorPlanRepository.findByIdAndIsActiveTrue(planId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLAN_NOT_FOUND));

        if (!mentorPlan.isOwnedByMentor(mentorId)) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        }

        LocalDateTime now = LocalDateTime.now();


        Subscription subscription = subscriptionRepository.findByUserIdAndMentor_Id(userId, mentorId)
                .map(sub -> {
                    if (sub.hasActivePermission(now)) {
                        throw new CustomException(ErrorCode.ALREADY_SUBSCRIBED);
                    }
                    sub.reserverForPayment(mentorPlan, mentorPlan.getPrice());
                    return sub;
                })
                .orElseGet(() -> subscriptionRepository.save(
                        Subscription.builder()
                                .user(user)       //[cite: 8] User 객체 주입
                                .mentor(mentor)   //[cite: 8] 멘토 User 객체 주입
                                .plan(mentorPlan) //[cite: 8] MentorPlan 객체 주입
                                .status(SubscriptionStatus.PENDING)
                                .amount(mentorPlan.getPrice())
                                .currentPeriodStart(now)
                                .currentPeriodEnd(now)
                                .build()
                ));

        int cycleNo = paymentRepository.findBySubscriptionIdOrderByCycleNoDesc(subscription.getId())
                .stream()
                .findFirst()
                .map(p -> p.getCycleNo() + 1)
                .orElse(1);

        String paymentId = paymentIdPrefix + "-" + cycleNo + "-" + ShortId.generate();

        Payment payment = paymentRepository.save(
                Payment.builder()
                        .paymentId(paymentId)
                        .subscription(subscription) //[cite: 7] Subscription 객체 주입
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