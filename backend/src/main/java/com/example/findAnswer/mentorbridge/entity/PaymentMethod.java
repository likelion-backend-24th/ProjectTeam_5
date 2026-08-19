package com.example.findAnswer.mentorbridge.entity;

import com.example.findAnswer.mentorbridge.constants.PaymentMethodStatus;
import com.example.findAnswer.mentorbridge.constants.PaymentProvider;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "payment_methods")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PaymentMethod extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentProvider paymentProvider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentMethodStatus paymentMethodStatus;

    @Column(nullable = true, length = 255) // portone 전환 시 false
    private String billingKey;

    @Column(nullable = false, length = 30)
    private String cardBrand;

    @Column(nullable = false, length = 4)
    private String last4;

    @Column(nullable = false, length = 50)
    private String cardNickname;

    @Column(nullable = false)
    private boolean isDefault;

    public boolean isOwnedBy(Long userId) {
        return this.user.getId().equals(userId);
    }

    public void softDelete() {
        this.paymentMethodStatus = PaymentMethodStatus.DELETED;
    }

    public void setDefault() {
        this.isDefault = true;
    }

    public void unsetDefault() {
        this.isDefault = false;
    }

}
