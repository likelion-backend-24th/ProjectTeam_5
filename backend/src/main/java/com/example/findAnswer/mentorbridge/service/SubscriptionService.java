package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.client.billing.PortOneBillingClient;
import com.example.findAnswer.mentorbridge.constants.NotificationType;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentHistoryResponse;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionCheckResponse;
import com.example.findAnswer.mentorbridge.dto.subscription.SubscriptionResponse;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final PortOneBillingClient portOneBillingClient;
    private final NotificationService notificationService;

    // 구독 신청("바로 ACTIVE" 로직)은 PaymentPrepareService.subscribe()로 대체됨 (결제 검증 후에만 ACTIVE)

    /**
     * F-24: 구독 해지 예약 — 다음 결제부터 중단. 이미 낸 돈 환불은 별개(PaymentCancellationService).
     */
    @Transactional
    public void cancelSubscription(Long userId, Long subscriptionId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독 정보를 찾을 수 없습니다."));

        if (!subscription.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 구독 정보만 해지할 수 있습니다.");
        }

        // 다음 회차로 예약해둔 결제가 있으면 PortOne에도 취소를 알려야 한다 — 안 그러면 해지해도 다음 달에 그대로 청구된다.
        paymentRepository.findFirstBySubscriptionIdAndStatusOrderByCycleNoDesc(subscriptionId, PaymentStatus.READY)
                .filter(payment -> payment.getScheduleId() != null)
                .ifPresent(payment -> {
                    try {
                        portOneBillingClient.cancelSchedule(payment.getScheduleId());
                    } catch (Exception e) {
                        log.warn("예약 취소 실패 subscriptionId={}, paymentId={}", subscriptionId, payment.getPaymentId(), e);
                    }
                });

        subscription.reserveCancellation();

        notificationService.notify(userId, NotificationType.SUBSCRIPTION_CANCELLED,
                "구독이 해지 예약되었습니다. 현재 결제 기간이 끝날 때까지는 계속 이용하실 수 있습니다.", "/profile");
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

    /**
     * 구독 관리 화면 — 결제 이력(환불 요청 대상 선택용)
     */
    public List<PaymentHistoryResponse> getPaymentHistory(Long userId, Long subscriptionId) {
        Subscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("구독 정보를 찾을 수 없습니다."));

        if (!subscription.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 구독 정보만 조회할 수 있습니다.");
        }

        return paymentRepository.findBySubscriptionIdOrderByCycleNoDesc(subscriptionId)
                .stream()
                .map(PaymentHistoryResponse::from)
                .toList();
    }
}
