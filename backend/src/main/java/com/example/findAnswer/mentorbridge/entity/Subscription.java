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

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public Subscription(Long userId, Long mentorId, SubscriptionStatus status, Integer amount,
                        LocalDateTime currentPeriodStart, LocalDateTime currentPeriodEnd) {
        this.userId = userId;
        this.mentorId = mentorId;
        this.status = status;
        this.amount = amount != null ? amount : 9900; // 기본값 방어
        this.currentPeriodStart = currentPeriodStart;
        this.currentPeriodEnd = currentPeriodEnd;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 구독 해지 예약 (다음 결제일까지 권한 유지)
    public void reserveCancellation() {
        this.status = SubscriptionStatus.CANCEL_RESERVED;
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
}