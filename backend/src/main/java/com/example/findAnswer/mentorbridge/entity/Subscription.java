package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "subscription",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_mentor", columnNames = {"user_id", "mentor_id"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "mentor_id", nullable = false)
    private Long mentorId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status;

    // 💡 [추가] 멘토가 지정한 당시의 구독 금액 저장
    @Column(name = "amount", nullable = false)
    private Integer amount;

    @Column(name = "current_period_start", nullable = false)
    private LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end", nullable = false)
    private LocalDateTime currentPeriodEnd;

    @Column(name = "plan_id")
    private Long planId;              // MentorPlan 참조. 우선 nullable

    @Column(name = "payment_method_id")
    private Long paymentMethodId;     // PaymentMethod 참조. 정기결제 시 이 결제수단으로 청구

    @Column(name = "next_billing_at")
    private LocalDateTime nextBillingAt; // 조회용 요약값

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Subscription(Long userId, Long mentorId, Long planId, Long paymentMethodId,
                        Integer amount,
                        SubscriptionStatus status,
                        LocalDateTime currentPeriodStart, LocalDateTime currentPeriodEnd,
                        LocalDateTime nextBillingAt) {
        this.userId = userId;
        this.mentorId = mentorId;
        this.planId = planId;
        this.paymentMethodId = paymentMethodId;
        this.amount = amount;
        this.status = status;
        this.currentPeriodStart = currentPeriodStart;
        this.currentPeriodEnd = currentPeriodEnd;
        this.nextBillingAt = nextBillingAt;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 구독 해지 예약 (다음 결제일까지 권한 유지)
    public void reserveCancellation() {
        this.status = SubscriptionStatus.CANCEL_RESERVED;
        this.updatedAt = LocalDateTime.now();
    }

    // 결제에 사용한 결제수단을 연결 — 이게 있어야 정기결제(예약) 때 어느 카드로 청구할지 알 수 있다.
    public void assignPaymentMethod(Long paymentMethodId) {
        this.paymentMethodId = paymentMethodId;
        this.updatedAt = LocalDateTime.now();
    }

    // 만료(EXPIRED) 후 재구독 시 상태, 금액, 기간을 갱신하는 메서드
    public void reactivate(LocalDateTime start, LocalDateTime end, Integer amount) {
        this.status = SubscriptionStatus.ACTIVE;
        this.amount = amount;
        this.currentPeriodStart = start;
        this.currentPeriodEnd = end;
        this.updatedAt = LocalDateTime.now();
    }

    // 권한 유효성 검증
    public boolean hasActivePermission(LocalDateTime now) {
        boolean isValidStatus = (this.status == SubscriptionStatus.ACTIVE || this.status == SubscriptionStatus.CANCEL_RESERVED);
        return isValidStatus && this.currentPeriodEnd.isAfter(now);
    }


    // 최초 결제 검증 성공 시 PENDING → ACTIVE
    public void activateAfterFirstPayment(LocalDateTime periodEnd) {
        this.status = SubscriptionStatus.ACTIVE;
        this.currentPeriodEnd = periodEnd;
        this.nextBillingAt = periodEnd;
        this.updatedAt = LocalDateTime.now();
    }

    // 정기결제(N회차) 성공 시 기간만 연장 — 이미 ACTIVE인 상태이므로 상태 전이는 없음
    public void renewPeriod(LocalDateTime periodEnd) {
        this.currentPeriodEnd = periodEnd;
        this.nextBillingAt = periodEnd;
        this.updatedAt = LocalDateTime.now();
    }

    // 회차 결제 실패 시
    public void markPastDue() {
        this.status = SubscriptionStatus.PAST_DUE;
        this.updatedAt = LocalDateTime.now();
    }

    //만료된 구독 다시 결제할 때 pending으로 만듬
    public void reserverForPayment(Long mentorPlanId, Integer amount) {
        this.status = SubscriptionStatus.PENDING;
        this.planId = mentorPlanId;
        this.amount = amount;
        this.updatedAt = LocalDateTime.now();
    }
}