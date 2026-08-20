package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionCheckResponse;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionResponse;
import com.example.findAnswer.mentorbridge.entity.MentorPlan;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.MentorPlanRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final MentorPlanRepository mentorPlanRepository;

    @Transactional
    public SubscriptionResponse subscribe(Long userId, Long mentorPlanId) {
        LocalDateTime now = LocalDateTime.now();

        MentorPlan mentorPlan = mentorPlanRepository.findById(mentorPlanId)
                .orElseThrow(() -> new CustomException(ErrorCode.PLAN_NOT_FOUND));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        User mentor = mentorPlan.getMentor();

        Subscription subscription = subscriptionRepository.findByUserIdAndMentor_Id(userId, mentor.getId())
                .map(sub -> {
                    if (sub.hasActivePermission(now)) {
                        throw new IllegalStateException("이미 진행 중인 구독이 존재합니다.");
                    }
                    sub.reactivate(now, now.plusMonths(1), mentorPlan.getPrice());
                    return sub;
                })
                .orElseGet(() -> {
                    return subscriptionRepository.save(
                            Subscription.builder()
                                    .user(user)
                                    .mentor(mentor)
                                    .status(SubscriptionStatus.ACTIVE)
                                    .amount(mentorPlan.getPrice())
                                    .currentPeriodStart(now)
                                    .currentPeriodEnd(now.plusMonths(1))
                                    .build()
                    );
                });

        return SubscriptionResponse.of(subscription, mentor.getName());
    }

    @Transactional
    public void cancelSubscription(Long userId, Long subscriptionId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독 정보를 찾을 수 없습니다."));

        if (!subscription.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 구독 정보만 해지할 수 있습니다.");
        }

        subscription.reserveCancellation();
    }

    public SubscriptionCheckResponse checkAccessPermission(Long userId, Long mentorId) {
        LocalDateTime now = LocalDateTime.now();
        return subscriptionRepository.findByUserIdAndMentor_Id(userId, mentorId)
                .map(sub -> new SubscriptionCheckResponse(
                        true,
                        sub.getStatus(),
                        sub.hasActivePermission(now)
                ))
                .orElseGet(() -> new SubscriptionCheckResponse(false, null, false));
    }

    public List<SubscriptionResponse> getMySubscriptions(Long userId) {
        List<SubscriptionStatus> activeStatuses = List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCEL_RESERVED);

        return subscriptionRepository.findByUserIdAndStatusInAndCurrentPeriodEndAfter(userId, activeStatuses, LocalDateTime.now())
                .stream()
                .map(sub -> {
                    String mentorName = sub.getMentor() != null ? sub.getMentor().getName() : "알 수 없는 멘토";
                    return SubscriptionResponse.of(sub, mentorName);
                })
                .toList();
    }
}