package com.example.findAnswer.mentorbridge.dto.settlement;

import com.example.findAnswer.mentorbridge.entity.SettlementAccount;
import java.time.LocalDateTime;

public record SettlementAccountResponse(
        String bankName,
        String accountNumber,
        String accountHolder,
        LocalDateTime updatedAt
) {
    public static SettlementAccountResponse from(SettlementAccount account) {
        return new SettlementAccountResponse(
                account.getBankName(),
                account.getAccountNumber(),
                account.getAccountHolder(),
                account.getUpdatedAt()
        );
    }
}