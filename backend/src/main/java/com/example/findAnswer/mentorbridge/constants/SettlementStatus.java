package com.example.findAnswer.mentorbridge.constants;

public enum SettlementStatus {
    PENDING,    // 자동 누적됨 (출금 신청 전)
    REQUESTED,  // 멘토가 출금 신청함 (관리자 대기중)
    COMPLETED,  // 관리자가 송금 완료함
    CANCELED    // 환불 등으로 취소됨
}