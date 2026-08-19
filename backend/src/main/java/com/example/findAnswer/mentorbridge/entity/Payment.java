package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Payment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_id", nullable = false, unique = true, length = 100)
    private String paymentId; // portone 공유 결제 ID

    @Column(name = "subscription_id", nullable = false)
    private Long subscriptionId;

    @Column(name = "cycle_no", nullable = false)
    private int cycleNo; // 몇 번째 결제인지 - 최초결제 = 1

    @Column(name = "attempt_no", nullable = false)
    private int attemptNo; // 결제 재시도 횟수

    @Column(nullable = false)
    private String currency;

    @Column(name = "amount", nullable = false)
    private Long amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PaymentStatus status;

    // portone 조회 결과 검증용 스냅샷
    @Column(name = "store_id", length = 100)
    private String storeId;

    @Column(name = "channel_key", length = 100)
    private String channelKey;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public void markPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
        this.status = PaymentStatus.PAID;
    }

    public void markFailed() {
        this.status = PaymentStatus.FAILED;
    }

    public boolean isOfSubscription(Long subscriptionId) {
        return this.subscriptionId.equals(subscriptionId);
    }

}
