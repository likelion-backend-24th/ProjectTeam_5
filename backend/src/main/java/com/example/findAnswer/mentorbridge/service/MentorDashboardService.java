package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentCancellationStatus;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.Role;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorDashboardSummaryResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorPaymentResponse;
import com.example.findAnswer.mentorbridge.dto.mentor.MentorSubscriberResponse;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentCancellationResponse;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.PaymentCancellationRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// 멘토 대시보드(docs/mentor-dashboard-plan.md 2단계) — 항상 "내(로그인한 멘토)" 기준으로 조회한다.
// 매출 집계 기준은 캘린더 월(이번 달 1일 00:00 ~ 지금)로 정했다 — 요금제마다 결제 주기(1/3/12개월)가
// 달라서 "구독 시작일 기준 N일"로 하면 멘토별로 기준이 다 달라지고 복잡해진다.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MentorDashboardService {

    private static final List<SubscriptionStatus> ACTIVE_STATUSES =
            List.of(SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCEL_RESERVED);

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentCancellationRepository paymentCancellationRepository;

    public MentorDashboardSummaryResponse getSummary(Long mentorId) {
        validateMentor(mentorId);
        LocalDateTime now = LocalDateTime.now();

        long subscriberCount = subscriptionRepository.countByMentor_IdAndStatusInAndCurrentPeriodEndAfter(
                mentorId, ACTIVE_STATUSES, now
        );

        LocalDateTime monthStart = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
        long monthlyRevenue = paymentRepository.sumPaidAmountByMentorSince(mentorId, PaymentStatus.PAID, monthStart);

        long pendingRefundCount = paymentCancellationRepository.countByPayment_Subscription_Mentor_IdAndStatus(
                mentorId, PaymentCancellationStatus.REQUESTED
        );

        return new MentorDashboardSummaryResponse((int) subscriberCount, monthlyRevenue, (int) pendingRefundCount);
    }

    public List<MentorSubscriberResponse> getSubscribers(Long mentorId) {
        validateMentor(mentorId);
        return subscriptionRepository.findByMentor_IdOrderByCreatedAtDesc(mentorId)
                .stream()
                .map(MentorSubscriberResponse::from)
                .toList();
    }

    public List<PaymentCancellationResponse> getPendingRefunds(Long mentorId) {
        validateMentor(mentorId);
        return paymentCancellationRepository
                .findByPayment_Subscription_Mentor_IdAndStatusOrderByCreatedAtAsc(mentorId, PaymentCancellationStatus.REQUESTED)
                .stream()
                .map(PaymentCancellationResponse::from)
                .toList();
    }

    public List<MentorPaymentResponse> getPayments(Long mentorId) {
        validateMentor(mentorId);
        return paymentRepository.findBySubscription_Mentor_IdOrderByCreatedAtDesc(mentorId)
                .stream()
                .map(MentorPaymentResponse::from)
                .toList();
    }

    private void validateMentor(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (user.getRole() != Role.MENTOR) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
    }
}
