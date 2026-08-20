package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_transaction")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentTransaction extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(name = "transaction_id", nullable = false, unique = true, length = 100)
    private String transactionId; // payment와 1:1 아님

    @Column(nullable = false)
    private Long amount; // 이 거래 시도 시점에 PortOne이 응답한 결제 금액(amount.total) 스냅샷

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    // 장애 분석용 응답 스냅삿
    @Lob
    @Column(name = "raw_snapshot")
    private String rawSnapshot;


}
