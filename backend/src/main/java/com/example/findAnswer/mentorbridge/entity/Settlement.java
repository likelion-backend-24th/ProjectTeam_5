package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.SettlementStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(name = "settlements")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Settlement extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 결제에서 발생한 수익인지
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    // 돈을 받을 멘토
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User mentor;

    @Column(nullable = false)
    private Long totalAmount; // 원래 결제된 총액

    @Column(nullable = false)
    private Long pgFee; // PG사 수수료 (예: 3%)

    @Column(nullable = false)
    private Long platformFee; // 플랫폼 수수료 (예: 10%)

    @Column(nullable = false)
    private Long netAmount; // 수수료 떼고 멘토가 실제 받을 금액

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SettlementStatus status;

    @Builder
    public Settlement(Payment payment, User mentor, Long totalAmount, Long pgFee, Long platformFee, Long netAmount) {
        this.payment = payment;
        this.mentor = mentor;
        this.totalAmount = totalAmount;
        this.pgFee = pgFee;
        this.platformFee = platformFee;
        this.netAmount = netAmount;
        this.status = SettlementStatus.PENDING;
    }

    public void cancel() {
        this.status = SettlementStatus.CANCELED;
    }

    /**
     * 출금 신청된 건만 송금 완료로 바꿀 수 있다.
     * 예전에는 상태를 보지 않아서, 환불로 CANCELED가 된 건도 COMPLETED로 되돌릴 수 있었다.
     * (실제 이체는 시스템 밖에서 일어나므로 중복 호출을 막을 다른 장치가 없다.)
     */
    public void complete() {
        if (this.status != SettlementStatus.REQUESTED) {
            throw new IllegalStateException(
                    "출금 신청(REQUESTED) 상태에서만 송금 완료로 바꿀 수 있습니다. 현재 상태: " + this.status);
        }
        this.status = SettlementStatus.COMPLETED;
    }

    public void requestWithdrawal() {
        if (this.status == SettlementStatus.PENDING) {
            this.status = SettlementStatus.REQUESTED;
        }
    }
}