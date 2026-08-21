package com.example.findAnswer.mentorbridge.dto.mentor;

public record MentorRatingHistogramResponse(
        double average,
        long reviewCount,
        long count5,
        long count4,
        long count3,
        long count2,
        long count1
) {
}
