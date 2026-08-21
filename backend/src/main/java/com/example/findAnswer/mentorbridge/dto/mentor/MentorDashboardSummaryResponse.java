package com.example.findAnswer.mentorbridge.dto.mentor;

public record MentorDashboardSummaryResponse(
        int subscriberCount,
        long monthlyRevenue,
        int pendingRefundCount
) {
}
