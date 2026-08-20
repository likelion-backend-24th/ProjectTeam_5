package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.PaymentCancellationStatus;
import jakarta.persistence.*;
import lombok.*;

// 환불 요청/처리 이력 — 해지(다음 결제 중단)와는 별개다. 이미 낸 회차를 돌려주는 것만 다룬다.
@Entity
@Table(name = "payment_cancellation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentCancellation extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(name = "requested_by_user_id", nullable = false)
    private Long requestedByUserId;

    // PortOne이 취소 성공 후 돌려주는 값. 요청만 된 상태에선 null.
    @Column(name = "cancellation_id", length = 100)
    private String cancellationId;

    @Column(nullable = false)
    private Long amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentCancellationStatus status;

    @Column(length = 500)
    private String reason;

    // 거절/실패 사유 등 관리자가 남기는 메모
    @Column(name = "admin_note", length = 500)
    private String adminNote;

    public void approve(String cancellationId) {
        this.status = PaymentCancellationStatus.SUCCEEDED;
        this.cancellationId = cancellationId;
    }

    public void reject(String adminNote) {
        this.status = PaymentCancellationStatus.REJECTED;
        this.adminNote = adminNote;
    }

    public void markFailed(String adminNote) {
        this.status = PaymentCancellationStatus.FAILED;
        this.adminNote = adminNote;
    }

    public boolean isRequestedBy(Long userId) {
        return this.requestedByUserId.equals(userId);
    }
}
