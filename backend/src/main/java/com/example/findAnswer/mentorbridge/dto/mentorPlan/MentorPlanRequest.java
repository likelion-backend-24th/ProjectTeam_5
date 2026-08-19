package com.example.findAnswer.mentorbridge.dto.mentorPlan;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record MentorPlanRequest(
        @NotBlank(message = "요금제 이름은 필수입니다.")
        String planName,

        String description,

        @Positive(message = "가격은 0보다 커야 합니다.")
        Integer price,

        @PositiveOrZero(message = "결제 주기는 0 이상이어야 합니다.")
        int billingCycle
) {
}
