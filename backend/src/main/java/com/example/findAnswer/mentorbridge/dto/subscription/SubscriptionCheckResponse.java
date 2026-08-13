package com.example.findAnswer.mentorbridge.dto.subscription;

import com.example.findAnswer.mentorbridge.constants.SubscriptionStatus;

public record SubscriptionCheckResponse(
        boolean isSubscribed,
        SubscriptionStatus status,
        boolean accessAllowed
) {}