package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.converter.EncryptedStringConverter;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

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
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(nullable = false, length = 50)
    private String bankName; // 은행명 (예: 신한은행, 토스뱅크 등)

    // 계좌번호는 AES-256-GCM으로 암호화해 저장한다. 암호문 + Base64라 원문보다 길어서 컬럼도 넓혀야 한다.
    @Convert(converter = EncryptedStringConverter.class)
    @Column(nullable = false, length = 255)
    private String accountNumber;

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