package com.example.findAnswer.mentorbridge.dto.mentor;

import com.example.findAnswer.mentorbridge.entity.MentorReview;

import java.time.LocalDateTime;

public record MentorReviewResponse(
        Long id,
        Long userId,
        String userName,
        String userProfileImageUrl,
        int rating,
        String comment,
        LocalDateTime createdAt
) {
    public static MentorReviewResponse from(MentorReview review) {
        return new MentorReviewResponse(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getName(),
                review.getUser().getProfileImageUrl(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
