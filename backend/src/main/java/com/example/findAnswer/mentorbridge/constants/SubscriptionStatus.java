package com.example.findAnswer.mentorbridge.constants;

public enum SubscriptionStatus {
    ACTIVE,          // 정상 구독 중
    CANCEL_RESERVED, // 구독 해지 예약
    EXPIRED,          // 만료됨

    PENDING, // 구독 신청 직후, 결제 대기 중
    PAST_DUE, // 재시도 대기
}