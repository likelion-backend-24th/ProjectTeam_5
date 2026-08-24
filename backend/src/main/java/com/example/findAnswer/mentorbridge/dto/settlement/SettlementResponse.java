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
        LocalDateTime updatedAt
) {
    public static SettlementResponse from(Settlement settlement) {
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
                settlement.getUpdatedAt()
        );
    }
}