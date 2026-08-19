package com.example.findAnswer.mentorbridge.dto.mentorPlan;

import com.example.findAnswer.mentorbridge.entity.MentorPlan;

public record MentorPlanResponse(
    Long mentorId,
    String planName,
    String description,
    Integer price,
    int billingCycle,
    boolean isActive
) {

    public static MentorPlanResponse fromEntity(MentorPlan mentorPlan) {

        return new MentorPlanResponse(
                mentorPlan.getMentorId(),
                mentorPlan.getPlanName(),
                mentorPlan.getDescription(),
                mentorPlan.getPrice(),
                mentorPlan.getBillingCycle(),
                mentorPlan.isActive()
        );
    }
}
