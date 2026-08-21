package com.example.findAnswer.mentorbridge.constants;

public enum SettlementStatus {
    PENDING,    // 정산 대기 (이번 달 결제분)
    COMPLETED,  // 멘토 계좌로 송금 완료됨
    CANCELED    // 환불 등으로 정산 취소됨
}