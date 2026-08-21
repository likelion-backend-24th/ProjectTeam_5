package com.example.findAnswer.mentorbridge.dto.mentor;

public record MentorDashboardSummaryResponse(
        int subscriberCount,
        double subscriberGrowthRate,   // 전월 대비 누적 구독 증감률(%)
        long monthlyRevenue,
        double revenueGrowthRate,      // 전월 대비 매출 증감률(%)
        int pendingRefundCount,
        int postCount,
        int newPostCountThisMonth,
        double averageRating,
        int reviewCount
) {
}
