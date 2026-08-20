package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentCancellationStatus;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentCancellationResponse;
import com.example.findAnswer.mentorbridge.entity.Payment;
import com.example.findAnswer.mentorbridge.entity.PaymentCancellation;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.PaymentCancellationRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 환불 요청/승인/거절 — 해지(다음 결제 중단, SubscriptionService)와는 별개 기능이다(이미 낸 회차를 돌려주는 것만 다룸).
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentCancellationService {

    private final PaymentRepository paymentRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PaymentCancellationRepository paymentCancellationRepository;
    private final PaymentSyncService paymentSyncService;

    // 유저가 특정 결제 건의 환불을 요청한다. 관리자 승인이 있어야 실제로 취소된다.
    @Transactional
    public PaymentCancellationResponse requestCancellation(Long userId, String paymentId, String reason) {
        Payment payment = paymentRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND));

        Subscription subscription = subscriptionRepository.findById(payment.getSubscriptionId())
                .orElseThrow(() -> new CustomException(ErrorCode.SUBSCRIPTION_NOT_FOUND));

        if (!subscription.getUserId().equals(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        if (payment.getStatus() != PaymentStatus.PAID) {
            throw new CustomException(ErrorCode.PAYMENT_NOT_CANCELLABLE);
        }
        if (paymentCancellationRepository.existsByPaymentIdAndStatus(payment.getId(), PaymentCancellationStatus.REQUESTED)) {
            throw new CustomException(ErrorCode.CANCELLATION_ALREADY_PROCESSED);
        }

        PaymentCancellation cancellation = paymentCancellationRepository.save(
                PaymentCancellation.builder()
                        .payment(payment)
                        .requestedByUserId(userId)
                        .amount(payment.getAmount())
                        .status(PaymentCancellationStatus.REQUESTED)
                        .reason(reason)
                        .build()
        );

        return PaymentCancellationResponse.from(cancellation);
    }

    // 내가 요청한 환불 이력
    public List<PaymentCancellationResponse> getMyCancellations(Long userId) {
        return paymentCancellationRepository.findByRequestedByUserId(userId)
                .stream()
                .map(PaymentCancellationResponse::from)
                .toList();
    }

    // [관리자] 대기 중인 환불 요청 목록
    public List<PaymentCancellationResponse> getPendingCancellations() {
        return paymentCancellationRepository.findByStatusOrderByCreatedAtAsc(PaymentCancellationStatus.REQUESTED)
                .stream()
                .map(PaymentCancellationResponse::from)
                .toList();
    }

    // [관리자] 승인 — PortOne 취소 API를 실제로 호출하고, 해당 구독도 더 이상 유지되지 않도록 해지 처리한다.
    @Transactional
    public void approve(Long cancellationId) {
        PaymentCancellation cancellation = findRequestedOrThrow(cancellationId);
        Payment payment = cancellation.getPayment();

        try {
            paymentSyncService.cancelPayment(payment, cancellation.getReason());
        } catch (CustomException e) {
            cancellation.markFailed("PortOne 취소 API 호출 실패: " + e.getErrorCode());
            throw e;
        }

        cancellation.approve(null); // PortOne이 별도 취소 ID를 주지만 지금은 안 씀 — 필요해지면 응답 파싱 추가

        subscriptionRepository.findById(payment.getSubscriptionId())
                .ifPresent(Subscription::reserveCancellation);
    }

    // [관리자] 거절
    @Transactional
    public void reject(Long cancellationId, String adminNote) {
        PaymentCancellation cancellation = findRequestedOrThrow(cancellationId);
        cancellation.reject(adminNote);
    }

    private PaymentCancellation findRequestedOrThrow(Long cancellationId) {
        PaymentCancellation cancellation = paymentCancellationRepository.findById(cancellationId)
                .orElseThrow(() -> new CustomException(ErrorCode.CANCELLATION_NOT_FOUND));

        if (cancellation.getStatus() != PaymentCancellationStatus.REQUESTED) {
            throw new CustomException(ErrorCode.CANCELLATION_ALREADY_PROCESSED);
        }
        return cancellation;
    }
}
