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
public class Subscription extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private MentorPlan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_method_id")
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status;

    @Column(name = "amount", nullable = false)
    private Integer amount;

    @Column(name = "current_period_start", nullable = false)
    private LocalDateTime currentPeriodStart;

    @Column(name = "current_period_end", nullable = false)
    private LocalDateTime currentPeriodEnd;

    @Column(name = "next_billing_at")
    private LocalDateTime nextBillingAt;

    @Builder
    public Subscription(User user, User mentor, MentorPlan plan, PaymentMethod paymentMethod,
                        Integer amount, SubscriptionStatus status,
                        LocalDateTime currentPeriodStart, LocalDateTime currentPeriodEnd,
                        LocalDateTime nextBillingAt) {
        this.user = user;
        this.mentor = mentor;
        this.plan = plan;
        this.paymentMethod = paymentMethod;
        this.amount = amount;
        this.status = status;
        this.currentPeriodStart = currentPeriodStart;
        this.currentPeriodEnd = currentPeriodEnd;
        this.nextBillingAt = nextBillingAt;
    }

    // 비즈니스 로직
    public void reserveCancellation() {
        this.status = SubscriptionStatus.CANCEL_RESERVED;
    }

    public void reactivate(LocalDateTime start, LocalDateTime end, Integer amount) {
        this.status = SubscriptionStatus.ACTIVE;
        this.amount = amount;
        this.currentPeriodStart = start;
        this.currentPeriodEnd = end;
    }

    public boolean hasActivePermission(LocalDateTime now) {
        boolean isValidStatus = (this.status == SubscriptionStatus.ACTIVE || this.status == SubscriptionStatus.CANCEL_RESERVED);
        return isValidStatus && this.currentPeriodEnd.isAfter(now);
    }

    public void activateAfterFirstPayment(LocalDateTime periodEnd) {
        this.status = SubscriptionStatus.ACTIVE;
        this.currentPeriodEnd = periodEnd;
        this.nextBillingAt = periodEnd;
    }

    // 정기결제(N회차) 성공 시 기간만 연장 — 이미 ACTIVE인 상태이므로 상태 전이는 없음
    public void renewPeriod(LocalDateTime periodEnd) {
        this.currentPeriodEnd = periodEnd;
        this.nextBillingAt = periodEnd;
    }

    // 결제에 사용한 결제수단을 연결 — 이게 있어야 정기결제(예약) 때 어느 카드로 청구할지 알 수 있다.
    public void assignPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    // 회차 결제 실패 시
    public void markPastDue() {
        this.status = SubscriptionStatus.PAST_DUE;
    }

    // 만료된 구독 다시 결제할 때 PENDING 상태로 설정 (필드 타입에 맞춰 plan 객체 수신)
    public void reserverForPayment(MentorPlan plan, Integer amount) {
        this.status = SubscriptionStatus.PENDING;
        this.plan = plan;
        this.amount = amount;
    }
}