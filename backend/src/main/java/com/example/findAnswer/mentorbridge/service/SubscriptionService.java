package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionCheckResponse;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionResponse;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.entity.User;
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

    // 구독 신청("바로 ACTIVE" 로직)은 PaymentPrepareService.prepare()로 대체됨(결제 검증 후에만 ACTIVE).

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