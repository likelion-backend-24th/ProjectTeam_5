package com.example.findAnswer.mentorbridge.dto.mentor;

import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;
import com.example.findAnswer.mentorbridge.entity.Subscription;

import java.time.LocalDateTime;

public record MentorSubscriberResponse(
        Long subscriptionId,
        Long userId,
        String userName,
        String planName,
        SubscriptionStatus status,
        LocalDateTime currentPeriodEnd,
        LocalDateTime createdAt
) {
    public static MentorSubscriberResponse from(Subscription subscription) {
        return new MentorSubscriberResponse(
                subscription.getId(),
                subscription.getUser().getId(),
                subscription.getUser().getName(),
                subscription.getPlan() != null ? subscription.getPlan().getPlanName() : null,
                subscription.getStatus(),
                subscription.getCurrentPeriodEnd(),
                subscription.getCreatedAt()
        );
    }
}
