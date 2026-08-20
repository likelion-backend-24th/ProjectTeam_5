package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.client.billing.PortOneBillingClient;
import com.example.findAnswer.mentorbridge.client.portone.PortOnePaymentClient;
import com.example.findAnswer.mentorbridge.client.portone.PortOnePaymentSnapshot;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
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
import com.example.findAnswer.mentorbridge.repository.PaymentMethodRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentTransactionRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import com.example.findAnswer.mentorbridge.repository.UserRepository;
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
    private final PaymentMethodRepository paymentMethodRepository;
    private final UserRepository userRepository;
    private final PortOnePaymentClient portOnePaymentClient;
    private final PortOneBillingClient portOneBillingClient;

    @Value("${portone.payment-id-prefix}")
    private String paymentIdPrefix;

    @Transactional
    public PaymentCompleteResponse complete(String paymentId, Long userId) {
        Payment payment = findPaymentOrThrow(paymentId);
        Subscription subscription = findSubscriptionOrThrow(payment);

        if (!subscription.getUserId().equals(userId)) {
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
        return subscriptionRepository.findById(payment.getSubscriptionId())
                .orElseThrow(() -> new CustomException(ErrorCode.SUBSCRIPTION_NOT_FOUND));
    }

    private PaymentCompleteResponse sync(Payment payment, Subscription subscription) {
        if (payment.getStatus() == PaymentStatus.PAID) {
            return PaymentCompleteResponse.from(payment, subscription);
        }

        log.info("Payment {} has been synced. Store Id = {}", payment.getPaymentId(), payment.getSubscriptionId());

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
            throw new CustomException(ErrorCode.PAYMENT_VERIFICATION_FAILED);
        }

        payment.markPaidAt(LocalDateTime.now());

        if (subscription.getStatus() == SubscriptionStatus.PENDING) {
            subscription.activateAfterFirstPayment(LocalDateTime.now().plusMonths(1));
        } else if (subscription.getStatus() == SubscriptionStatus.ACTIVE) {
            subscription.renewPeriod(LocalDateTime.now().plusMonths(1));
        }

        scheduleNextCycle(payment, subscription);

        return PaymentCompleteResponse.from(payment, subscription);
    }

    // 이번 결제가 확정된 직후, 구독이 여전히 살아있으면 다음 회차를 PortOne에 예약해둔다.
    // 예약 생성이 실패해도 이번 결제 확정 자체는 그대로 성공 처리한다 — SubscriptionScheduler(만료 처리)가 최후 안전망.
    private void scheduleNextCycle(Payment payment, Subscription subscription) {
        if (subscription.getStatus() != SubscriptionStatus.ACTIVE) {
            return;
        }
        if (subscription.getPaymentMethodId() == null) {
            log.warn("paymentMethodId가 없어 다음 회차 예약을 건너뜀 subscriptionId={}", subscription.getId());
            return;
        }

        PaymentMethod paymentMethod = paymentMethodRepository.findById(subscription.getPaymentMethodId())
                .filter(pm -> pm.getPaymentMethodStatus() == PaymentMethodStatus.ACTIVE)
                .orElse(null);
        if (paymentMethod == null) {
            log.warn("유효한 결제수단이 없어 다음 회차 예약을 건너뜀 subscriptionId={}", subscription.getId());
            return;
        }

        User user = userRepository.findById(subscription.getUserId()).orElse(null);
        if (user == null) {
            return;
        }

        int nextCycleNo = payment.getCycleNo() + 1;
        String nextPaymentId = paymentIdPrefix + "-" + nextCycleNo + "-" + ShortId.generate();
        String orderName = "정기결제 " + nextCycleNo + "회차";

        Payment nextPayment = paymentRepository.save(
                Payment.builder()
                        .paymentId(nextPaymentId)
                        .subscriptionId(subscription.getId())
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
