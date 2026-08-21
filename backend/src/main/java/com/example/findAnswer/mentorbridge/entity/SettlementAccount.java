package com.example.findAnswer.mentorbridge.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "settlement_accounts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SettlementAccount extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 멘토(User)와 1:1 매핑
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String bankName; // 은행명 (예: 신한은행, 토스뱅크 등)

    @Column(nullable = false, length = 100)
    private String accountNumber; // 계좌번호 (추후 AES-256 등 암호화 고려 가능)

    @Column(nullable = false, length = 50)
    private String accountHolder; // 예금주명

    @Builder
    public SettlementAccount(User user, String bankName, String accountNumber, String accountHolder) {
        this.user = user;
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
    }

    // 계좌 정보 업데이트 메서드
    public void update(String bankName, String accountNumber, String accountHolder) {
        this.bankName = bankName;
        this.accountNumber = accountNumber;
        this.accountHolder = accountHolder;
    }
}