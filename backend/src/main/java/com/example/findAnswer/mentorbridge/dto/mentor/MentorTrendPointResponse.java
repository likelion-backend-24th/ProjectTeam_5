package com.example.findAnswer.mentorbridge.dto.mentor;

public record MentorTrendPointResponse(
        String month,          // ex) "2026-05"
        String label,          // ex) "5월"
        long subscriberCount,  // 해당 월말 기준 누적 구독 건수
        long revenue           // 해당 월의 매출 합계
) {
}
