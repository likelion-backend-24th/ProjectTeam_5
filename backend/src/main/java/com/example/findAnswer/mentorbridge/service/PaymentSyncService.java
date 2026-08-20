package com.example.findAnswer.mentorbridge.service;

import com.example.findAnswer.mentorbridge.client.portone.PortOnePaymentClient;
import com.example.findAnswer.mentorbridge.client.portone.PortOnePaymentSnapshot;
import com.example.findAnswer.mentorbridge.constants.ErrorCode;
import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.dto.payment.PaymentCompleteResponse;
import com.example.findAnswer.mentorbridge.entity.Payment;
import com.example.findAnswer.mentorbridge.entity.PaymentTransaction;
import com.example.findAnswer.mentorbridge.entity.Subscription;
import com.example.findAnswer.mentorbridge.exception.CustomException;
import com.example.findAnswer.mentorbridge.repository.PaymentRepository;
import com.example.findAnswer.mentorbridge.repository.PaymentTransactionRepository;
import com.example.findAnswer.mentorbridge.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final PortOnePaymentClient  portOnePaymentClient;

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
        }

        return PaymentCompleteResponse.from(payment, subscription);
    }
}
