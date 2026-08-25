package com.example.findAnswer.mentorbridge.dto.settlement;

import com.example.findAnswer.mentorbridge.constants.SettlementStatus;
import com.example.findAnswer.mentorbridge.entity.Settlement;

import java.time.LocalDateTime;

public record SettlementResponse(
        Long id,
        String paymentId,
        Long mentorId,
        String mentorName,
        Long totalAmount,
        Long pgFee,
        Long platformFee,
        Long netAmount,
        SettlementStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        // 관리자가 실제로 송금할 때 필요한 멘토 정산 계좌.
        // 관리자 목록(getAllSettlements)에서만 채우고, 멘토 본인 목록에서는 null이다.
        SettlementAccountResponse account
) {
    public static SettlementResponse from(Settlement settlement) {
        return from(settlement, null);
    }

    public static SettlementResponse from(Settlement settlement, SettlementAccountResponse account) {
        return new SettlementResponse(
                settlement.getId(),
                settlement.getPayment().getPaymentId(),
                settlement.getMentor().getId(),
                settlement.getMentor().getName(),
                settlement.getTotalAmount(),
                settlement.getPgFee(),
                settlement.getPlatformFee(),
                settlement.getNetAmount(),
                settlement.getStatus(),
                settlement.getCreatedAt(),
                settlement.getUpdatedAt(),
                account
        );
    }
}