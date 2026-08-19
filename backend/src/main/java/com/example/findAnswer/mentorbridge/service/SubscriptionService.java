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

    /**
     * F-24: 구독 신청 (멘토가 지정한 가격 동적 반영)
     */
    @Transactional
    public SubscriptionResponse subscribe(Long userId, Long mentorPlanId) {
        LocalDateTime now = LocalDateTime.now();

//        // 💡 [수정] 멘토가 설정한 구독 금액 조회
//        Integer mentorPrice = userRepository.findById(mentorId)
//                .map(user -> user.getSubscriptionPrice() != null ? user.getSubscriptionPrice() : 9900)
//                .orElse(9900);

        MentorPlan mentorPlan = mentorPlanRepository.findById(mentorPlanId).orElseThrow(() -> new CustomException(ErrorCode.PLAN_NOT_FOUND));

        // 기존 구독 이력이 있는지 확인
        Subscription subscription = subscriptionRepository.findByUserIdAndMentorId(userId, mentorPlan.getMentorId())
                .map(sub -> {
                    if (sub.hasActivePermission(now)) {
                        throw new IllegalStateException("이미 진행 중인 구독이 존재합니다.");
                    }
                    // 만료된 상태라면 최신 멘토 가격을 반영하여 재활용
                    sub.reactivate(now, now.plusMonths(1), mentorPlan.getPrice());
                    return sub;
                })
                .orElseGet(() -> {
                    // 신규 구독 생성 시 멘토가 지정한 가격(mentorPrice) 대입
                    return subscriptionRepository.save(
                            Subscription.builder()
                                    .userId(userId)
                                    .mentorId(mentorPlan.getMentorId())
                                    .status(SubscriptionStatus.ACTIVE)
                                    .amount(mentorPlan.getPrice())
                                    .currentPeriodStart(now)
                                    .currentPeriodEnd(now.plusMonths(1))
                                    .build()
                    );
                });

        String mentorName = userRepository.findById(mentorPlan.getMentorId())
                .map(User::getName)
                .orElse("알 수 없는 멘토");

        return SubscriptionResponse.of(subscription, mentorName);
    }

    /**
     * F-24: 구독 해지 예약
     */
    @Transactional
    public void cancelSubscription(Long userId, Long subscriptionId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독 정보를 찾을 수 없습니다."));

        if (!subscription.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인의 구독 정보만 해지할 수 있습니다.");
        }

        subscription.reserveCancellation();
    }

    /**
     * F-23: 구독 권한 검증
     */
    public SubscriptionCheckResponse checkAccessPermission(Long userId, Long mentorId) {
        LocalDateTime now = LocalDateTime.now();
        return subscriptionRepository.findByUserIdAndMentorId(userId, mentorId)
                .map(sub -> new SubscriptionCheckResponse(
                        true,
                        sub.getStatus(),
                        sub.hasActivePermission(now)
                ))
                .orElseGet(() -> new SubscriptionCheckResponse(false, null, false));
    }

    /**
     * F-28: 내 구독 상태 목록 조회
     */
    public List<SubscriptionResponse> getMySubscriptions(Long userId) {
        List<SubscriptionStatus> activeStatuses = List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCEL_RESERVED);

        return subscriptionRepository.findByUserIdAndStatusInAndCurrentPeriodEndAfter(userId, activeStatuses, LocalDateTime.now())
                .stream()
                .map(sub -> {
                    String mentorName = userRepository.findById(sub.getMentorId())
                            .map(User::getName)
                            .orElse("알 수 없는 멘토");

                    return SubscriptionResponse.of(sub, mentorName);
                })
                .toList();
    }
}