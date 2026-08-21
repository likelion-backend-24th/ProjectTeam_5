package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.client.billing.PortOneBillingClient;
import com.example.findAnswer.mentorbridge.client.portone.PortOnePaymentClient;
import com.example.findAnswer.mentorbridge.client.portone.PortOnePaymentSnapshot;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.NotificationType;
import com.example.findAnswer.mentorbridge.constants.PaymentMethodStatus;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentCompleteResponse;
import com.example.findAnswer.mentorbridge.entity.Payment;
import com.example.findAnswer.mentorbridge.entity.PaymentMethod;
import com.example.findAnswer.mentorbridge.entity.PaymentTransaction;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.entity.User;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentTransactionRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.util.ShortId;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentSyncService {

    private final PaymentRepository paymentRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PortOnePaymentClient portOnePaymentClient;
    private final PortOneBillingClient portOneBillingClient;
    private final NotificationService notificationService;

    @Value("${portone.payment-id-prefix}")
    private String paymentIdPrefix;

    @Transactional
    public PaymentCompleteResponse complete(String paymentId, Long userId) {
        Payment payment = findPaymentOrThrow(paymentId);
        Subscription subscription = findSubscriptionOrThrow(payment);

        // 수정: subscription.getUserId() -> subscription.getUser().getId()
        if (!subscription.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.ACCESS_DENIED);
        }
        return sync(payment, subscription);
    }

    @Transactional
    public PaymentCompleteResponse syncFromWebhook(String paymentId) {
        Payment payment = findPaymentOrThrow(paymentId);
        Subscription subscription = findSubscriptionOrThrow(payment);
        return sync(payment, subscription);
    }

    private void recordTransaction(Payment payment, PortOnePaymentSnapshot remote, boolean verified) {
        if (remote.transactionId() == null
                || paymentTransactionRepository.findByTransactionId(remote.transactionId()).isPresent()) {
            return;
        }

        PaymentStatus txStatus = (verified && "PAID".equals(remote.status()))
                ? PaymentStatus.PAID
                : PaymentStatus.FAILED;

        paymentTransactionRepository.save(
                PaymentTransaction.builder()
                        .payment(payment)
                        .transactionId(remote.transactionId())
                        .amount(remote.amount())
                        .paymentStatus(txStatus)
                        .approvedAt(LocalDateTime.now())
                        .build()
        );
    }

    private Payment findPaymentOrThrow(String paymentId) {
        return paymentRepository.findByPaymentId(paymentId)
                .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND));
    }

    private Subscription findSubscriptionOrThrow(Payment payment) {
        // 수정: payment.getSubscriptionId() -> payment.getSubscription().getId()
        return subscriptionRepository.findById(payment.getSubscription().getId())
                .orElseThrow(() -> new CustomException(ErrorCode.SUBSCRIPTION_NOT_FOUND));
    }

    private PaymentCompleteResponse sync(Payment payment, Subscription subscription) {
        if (payment.getStatus() == PaymentStatus.PAID) {
            return PaymentCompleteResponse.from(payment, subscription);
        }

        // 수정: payment.getSubscriptionId() -> payment.getSubscription().getId()
        log.info("Payment {} has been synced. Subscription Id = {}", payment.getPaymentId(), payment.getSubscription().getId());

        PortOnePaymentSnapshot snapshot = portOnePaymentClient.getPayment(payment.getPaymentId());

        boolean verified = payment.getStoreId().equals(snapshot.storeId())
                && payment.getChannelKey().equals(snapshot.channelKey())
                && payment.getCurrency().equals(snapshot.currency())
                && payment.getAmount().equals(snapshot.amount());

        recordTransaction(payment, snapshot, verified);

        if (!verified || !"PAID".equals(snapshot.status())) {
            log.warn("결제 검증 실패 paymentId={} : local(storeId={}, channelKey={}, currency={}, amount={}) "
                            + "vs remote(storeId={}, channelKey={}, currency={}, amount={}, status={})",
                    payment.getPaymentId(),
                    payment.getStoreId(), payment.getChannelKey(), payment.getCurrency(), payment.getAmount(),
                    snapshot.storeId(), snapshot.channelKey(), snapshot.currency(), snapshot.amount(), snapshot.status());
            payment.markFailed();
            notificationService.notify(subscription.getUser().getId(), NotificationType.PAYMENT_FAILED,
                    "결제에 실패했습니다.", "/profile");
            throw new CustomException(ErrorCode.PAYMENT_VERIFICATION_FAILED);
        }

        payment.markPaidAt(LocalDateTime.now());

        // 결제 주기는 고정 1개월이 아니라 멘토가 설정한 요금제(MentorPlan.billingCycle, 단위: 개월)를 따른다.
        int billingCycleMonths = subscription.getPlan() != null ? subscription.getPlan().getBillingCycle() : 1;
        LocalDateTime nextPeriodEnd = LocalDateTime.now().plusMonths(billingCycleMonths);

        if (subscription.getStatus() == SubscriptionStatus.PENDING) {
            subscription.activateAfterFirstPayment(nextPeriodEnd);
        } else if (subscription.getStatus() == SubscriptionStatus.ACTIVE) {
            subscription.renewPeriod(nextPeriodEnd);
        }

        scheduleNextCycle(payment, subscription);

        notificationService.notify(subscription.getUser().getId(), NotificationType.PAYMENT_SUCCESS,
                "결제가 완료되었습니다.", "/profile");

        return PaymentCompleteResponse.from(payment, subscription);
    }

    // 이번 결제가 확정된 직후, 구독이 여전히 살아있으면 다음 회차를 PortOne에 예약해둔다.
    // 예약 생성이 실패해도 이번 결제 확정 자체는 그대로 성공 처리한다 — SubscriptionScheduler(만료 처리)가 최후 안전망.
    private void scheduleNextCycle(Payment payment, Subscription subscription) {
        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            return;
        }

        PaymentMethod paymentMethod = subscription.getPaymentMethod();
        if (paymentMethod == null || paymentMethod.getPaymentMethodStatus() != PaymentMethodStatus.ACTIVE) {
            log.warn("유효한 결제수단이 없어 다음 회차 예약을 건너뜀 subscriptionId={}", subscription.getId());
            return;
        }

        User user = subscription.getUser();

        int nextCycleNo = payment.getCycleNo() + 1;
        String nextPaymentId = paymentIdPrefix + "-" + nextCycleNo + "-" + ShortId.generate();
        String orderName = "정기결제 " + nextCycleNo + "회차";

        Payment nextPayment = paymentRepository.save(
                Payment.builder()
                        .paymentId(nextPaymentId)
                        .subscription(subscription)
                        .cycleNo(nextCycleNo)
                        .attemptNo(1)
                        .currency(payment.getCurrency())
                        .amount(payment.getAmount())
                        .status(PaymentStatus.READY)
                        .storeId(payment.getStoreId())
                        .channelKey(payment.getChannelKey())
                        .build()
        );

        try {
            String scheduleId = portOneBillingClient.createSchedule(
                    nextPaymentId, paymentMethod.getBillingKey(), payment.getChannelKey(), orderName,
                    payment.getAmount(), payment.getCurrency(), subscription.getCurrentPeriodEnd(),
                    user.getName(), user.getPhoneNumber(), user.getEmail()
            );
            nextPayment.markScheduled(scheduleId);
        } catch (CustomException e) {
            log.warn("다음 회차 예약 생성 실패 subscriptionId={}, nextPaymentId={}", subscription.getId(), nextPaymentId);
        }
    }

    // 관리자 환불 승인 시 호출 — PortOne 취소 API를 실행하고 로컬 Payment도 CANCELED로 반영한다.
    @Transactional
    public void cancelPayment(Payment payment, String reason) {
        portOnePaymentClient.cancelPayment(payment.getPaymentId(), reason);
        payment.markCanceled();
    }
}