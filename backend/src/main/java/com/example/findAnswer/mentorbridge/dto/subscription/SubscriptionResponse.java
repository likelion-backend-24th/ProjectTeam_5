package com.example.findAnswer.mentorbridge.dto.subscription;

import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.entity.Subscription;

import java.time.LocalDateTime;

public record SubscriptionResponse(
        Long subscriptionId,
        Long mentorId,
        String mentorName,
        SubscriptionStatus status,
        Integer amount, // 💡 [추가] 구독 금액
        LocalDateTime currentPeriodStart,
        LocalDateTime currentPeriodEnd
) {
    public static SubscriptionResponse of(Subscription subscription, String mentorName) {
        return new SubscriptionResponse(
                subscription.getId(),
                subscription.getMentorId(),
                mentorName,
                subscription.getStatus(),
                subscription.getAmount(),
                subscription.getCurrentPeriodStart(),
                subscription.getCurrentPeriodEnd()
        );
    }
}