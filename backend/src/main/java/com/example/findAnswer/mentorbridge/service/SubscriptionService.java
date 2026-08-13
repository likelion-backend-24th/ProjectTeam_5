package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionCheckResponse;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionResponse;
import com.example.findAnswer.mentorbridge.entity.Subscription;
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

    /**
     * F-24: 구독 신청 (PG사 연동 전 임시 활성화 로직)
     */
    @Transactional
    public SubscriptionResponse subscribe(Long userId, Long mentorId) {
        LocalDateTime now = LocalDateTime.now();

        // 💡 기존 구독 이력이 있는지 확인
        Subscription subscription = subscriptionRepository.findByUserIdAndMentorId(userId, mentorId)
                .map(sub -> {
                    // 이미 권한이 유효한 상태라면 중복 신청 불가 예외 발생
                    if (sub.hasActivePermission(now)) {
                        throw new IllegalStateException("이미 진행 중인 구독이 존재합니다.");
                    }
                    // 만료(EXPIRED)된 상태 등이라면 기존 레코드를 재활용하여 ACTIVE로 갱신
                    sub.reactivate(now, now.plusMonths(1));
                    return sub;
                })
                .orElseGet(() -> {
                    // 아예 구독 이력이 없는 신규 신청인 경우 새로 생성
                    return subscriptionRepository.save(
                            Subscription.builder()
                                    .userId(userId)
                                    .mentorId(mentorId)
                                    .status(SubscriptionStatus.ACTIVE)
                                    .currentPeriodStart(now)
                                    .currentPeriodEnd(now.plusMonths(1))
                                    .build()
                    );
                });

        String mentorName = userRepository.findById(mentorId)
                .map(user -> user.getName())
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
     * F-23: 구독 권한 검증 (내부 호출/API)
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
     * F-28: 내 구독 상태 목록 조회 (💡 만료 시간이 안 지난 항목만 필터링)
     */
    public List<SubscriptionResponse> getMySubscriptions(Long userId) {
        List<SubscriptionStatus> activeStatuses = List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCEL_RESERVED);

        // 💡 CurrentPeriodEndAfter(LocalDateTime.now()) 조건을 추가하여 이미 만료 기간이 지난 건은 프론트에 표시되지 않음
        return subscriptionRepository.findByUserIdAndStatusInAndCurrentPeriodEndAfter(userId, activeStatuses, LocalDateTime.now())
                .stream()
                .map(sub -> {
                    String mentorName = userRepository.findById(sub.getMentorId())
                            .map(user -> user.getName())
                            .orElse("알 수 없는 멘토");

                    return SubscriptionResponse.of(sub, mentorName);
                })
                .toList();
    }
}