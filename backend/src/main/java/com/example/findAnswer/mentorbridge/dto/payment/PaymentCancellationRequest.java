package com.example.findAnswer.mentorbridge.dto.payment;

import jakarta.validation.constraints.NotBlank;

public record PaymentCancellationRequest(
        @NotBlank(message = "환불 사유는 필수입니다.")
        String reason
) {
}
