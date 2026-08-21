package com.example.findAnswer.mentorbridge.dto.mentor;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record MentorReviewRequest(
        @Min(value = 1, message = "별점은 1점 이상이어야 합니다.")
        @Max(value = 5, message = "별점은 5점 이하여야 합니다.")
        int rating,

        @Size(max = 1000, message = "리뷰는 1000자 이내로 작성해주세요.")
        String comment
) {
}
