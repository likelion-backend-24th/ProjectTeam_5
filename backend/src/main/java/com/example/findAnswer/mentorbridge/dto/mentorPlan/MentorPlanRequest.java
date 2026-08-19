package com.example.findAnswer.mentorbridge.dto.mentorPlan;

public record MentorPlanRequest(
        Long mentorId,
        String planName,
        String description,
        Integer price,
        int billingCycle
) {
}
