package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.BillingKeyIssuanceStatus;
import jakarta.persistence.*;
import lombok.*;

// 프론트가 PortOne requestIssueBillingKey()를 호출하기 전에 서버가 미리 발급해두는 issueId를 추적한다.
// Payment의 READY 상태와 같은 역할 — 등록(register) 시점에 이 issueId 소유자만 결과를 확정할 수 있다.
@Entity
@Table(name = "billing_key_issuance_intent")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class BillingKeyIssuanceIntent extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "issue_id", nullable = false, unique = true, length = 100)
    private String issueId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "store_id", length = 100)
    private String storeId;

    @Column(name = "channel_key", length = 100)
    private String channelKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BillingKeyIssuanceStatus status;

    public boolean isOwnedBy(Long userId) {
        return this.userId.equals(userId);
    }

    public void markIssued() {
        this.status = BillingKeyIssuanceStatus.ISSUED;
    }

    public void markFailed() {
        this.status = BillingKeyIssuanceStatus.FAILED;
    }
}
