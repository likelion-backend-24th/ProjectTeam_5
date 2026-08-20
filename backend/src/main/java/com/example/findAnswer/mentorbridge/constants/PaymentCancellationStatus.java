package com.example.findAnswer.mentorbridge.constants;

public enum PaymentCancellationStatus {
    REQUESTED,  // 유저가 환불 요청함, 관리자 처리 대기
    SUCCEEDED,  // 관리자 승인 + PortOne 취소 성공
    REJECTED,   // 관리자가 거절
    FAILED      // 승인은 했지만 PortOne 취소 API 호출이 실패함
}
