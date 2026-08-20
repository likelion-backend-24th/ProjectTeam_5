package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
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

    // PortOne 예약결제 API가 돌려주는 예약 ID. 다음 회차가 예약된 READY 상태 Payment에만 값이 있다.
    // 구독 해지 시 이 값으로 정확히 이 회차의 예약만 취소한다(billingKey 기준으로 취소하면 같은 카드의
    // 다른 구독 예약까지 같이 취소될 위험이 있다).
    @Column(name = "schedule_id", length = 100)
    private String scheduleId;

    public void markPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
        this.status = PaymentStatus.PAID;
    }

    public void markFailed() {
        this.status = PaymentStatus.FAILED;
    }

    public void markCanceled() {
        this.status = PaymentStatus.CANCELED;
    }

    public void markScheduled(String scheduleId) {
        this.scheduleId = scheduleId;
    }

    public boolean isOfSubscription(Long subscriptionId) {
        return this.subscriptionId.equals(subscriptionId);
    }

}
